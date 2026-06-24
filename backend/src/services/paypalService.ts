import {
  fulfillPaidOrder,
  getOrderById,
  preparePendingOrderPayment,
} from './orderService.js';
import {
  assertPendingOrderForPayment,
  assertWebhookCaptureAmount,
  formatPayPalAmount,
  resolvePayPalCaptureWebhookAction,
  type OrderPaymentRecord,
  PaymentValidationError,
} from '../utils/paymentOrder.js';
import { isStockInsufficientError } from '../utils/stripePayment.js';
import { withExternalApiRetry, isRetryableHttpStatus } from '../utils/externalApiRetry.js';
import { invalidateCachePrefix } from '../utils/cache.js';
import type { RefundPendingReason } from '../types/index.js';
import { getAdminDb } from '../config/firebase.js';

const REFUND_PENDING_USER_MESSAGE =
  'Estamos procesando el reembolso. Si no lo recibes en 48 h, contacta con soporte.';

const REUSABLE_PAYPAL_ORDER_STATUSES = new Set(['CREATED', 'APPROVED', 'PAYER_ACTION_REQUIRED']);

type PayPalMode = 'sandbox' | 'live';

interface PayPalTokenResponse {
  access_token: string;
  expires_in: number;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: {
      captures?: Array<{ id: string; status: string; amount?: { value?: string } }>;
    };
  }>;
}

interface PayPalWebhookEvent {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    custom_id?: string;
    invoice_id?: string;
    supplementary_data?: {
      related_ids?: { order_id?: string };
    };
    amount?: { value?: string; currency_code?: string };
  };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function getPayPalMode(): PayPalMode {
  const mode = process.env.PAYPAL_MODE?.trim().toLowerCase();
  return mode === 'live' ? 'live' : 'sandbox';
}

function getPayPalBaseUrl(): string {
  return getPayPalMode() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function getPayPalCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error('Credenciales PayPal no configuradas');
  }
  return { clientId, clientSecret };
}

export function isPayPalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim(),
  );
}

function asOrderPaymentRecord(order: { id: string } & Record<string, unknown>): OrderPaymentRecord {
  return order as OrderPaymentRecord;
}

async function paypalFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    requestId?: string;
    retry?: boolean;
  } = {},
): Promise<T> {
  const token = await getPayPalAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  if (options.requestId) {
    headers['PayPal-Request-Id'] = options.requestId;
  }

  const execute = async (): Promise<T> => {
    const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as T & { message?: string }) : ({} as T);

    if (!response.ok) {
      const message =
        (data as { message?: string }).message ??
        `Error PayPal ${response.status} en ${path}`;
      const err = new Error(message) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    return data;
  };

  if (options.retry === false) {
    return execute();
  }

  return withExternalApiRetry(execute, {
    shouldRetry: (err) => {
      const status = (err as { status?: number }).status;
      return typeof status === 'number' && isRetryableHttpStatus(status);
    },
  });
}

async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }

  const { clientId, clientSecret } = getPayPalCredentials();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const data = await withExternalApiRetry(async () => {
    const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const err = new Error('No se pudo obtener token de PayPal') as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    return response.json() as Promise<PayPalTokenResponse>;
  });

  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return data.access_token;
}

export async function setOrderPayPalOrderId(
  orderId: string,
  userId: string,
  paypalOrderId: string,
): Promise<{ id: string; paypalOrderId: string } | null> {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.userId !== userId || data.status !== 'pendiente_pago') {
    return null;
  }

  await orderRef.update({
    paypalOrderId,
    paymentMethod: 'paypal',
    updatedAt: new Date().toISOString(),
  });

  return { id: orderId, paypalOrderId };
}

function extractCaptureId(order: PayPalOrderResponse): string | null {
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  return capture?.id ?? null;
}

function assertPayPalOrderMatches(
  order: OrderPaymentRecord,
  paypalOrder: PayPalOrderResponse,
  paypalOrderId: string,
): void {
  if (paypalOrder.id !== paypalOrderId) {
    throw new PaymentValidationError('Orden PayPal no coincide');
  }

  const unit = paypalOrder.purchase_units?.[0];
  if (unit?.custom_id !== order.id && unit?.reference_id !== order.id) {
    throw new PaymentValidationError('Orden PayPal no coincide con el pedido');
  }

  const amountValue = unit?.amount?.value;
  const expected = formatPayPalAmount(order.total ?? 0);
  if (amountValue !== expected) {
    throw new PaymentValidationError('Importe de pago PayPal no coincide');
  }
}

async function issuePayPalRefundOrMarkPending(
  orderId: string,
  captureId: string,
  reason: RefundPendingReason,
): Promise<'refunded' | 'pending'> {
  try {
    const refund = await paypalFetch<{ id: string }>(
      `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`,
      {
        method: 'POST',
        body: {},
        requestId: `refund:${orderId}:${captureId}`,
      },
    );

    const marked = await markOrderRefundedPayPal(orderId, refund.id, captureId);
    if (!marked) {
      const errMsg = 'No se pudo actualizar el pedido tras el reembolso en PayPal';
      await markOrderRefundPendingPayPal(orderId, captureId, reason, errMsg);
      return 'pending';
    }
    return 'refunded';
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await markOrderRefundPendingPayPal(orderId, captureId, reason, errMsg);
    return 'pending';
  }
}

async function markOrderRefundedPayPal(
  orderId: string,
  refundId: string,
  captureId: string,
) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data) return null;
  if (data.status === 'reembolsado') {
    return { id: orderId, status: 'reembolsado' as const };
  }

  if (
    data.status !== 'pendiente_pago' &&
    data.status !== 'cancelado' &&
    data.status !== 'reembolso_pendiente'
  ) {
    return null;
  }

  const refundedAt = new Date().toISOString();
  await orderRef.update({
    status: 'reembolsado',
    paypalRefundId: refundId,
    paypalCaptureId: captureId,
    refundedAt,
    refundPendingAt: null,
    refundPendingReason: null,
    refundLastError: null,
    updatedAt: refundedAt,
  });

  invalidateCachePrefix('admin:');

  return { id: orderId, status: 'reembolsado' as const };
}

async function markOrderRefundPendingPayPal(
  orderId: string,
  captureId: string,
  reason: RefundPendingReason,
  lastError?: string,
) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data) return null;
  if (data.status === 'reembolsado' || data.paypalRefundId) {
    return { id: orderId, status: 'reembolsado' as const };
  }

  const refundPendingAt = new Date().toISOString();
  await orderRef.update({
    status: 'reembolso_pendiente',
    paypalCaptureId: captureId,
    paymentMethod: 'paypal',
    refundPendingAt,
    refundPendingReason: reason,
    refundLastError: lastError?.slice(0, 500) ?? null,
    updatedAt: refundPendingAt,
  });

  invalidateCachePrefix('admin:');

  return { id: orderId, status: 'reembolso_pendiente' as const };
}

async function fulfillPaidOrderOrRefundPayPal(orderId: string, captureId: string) {
  try {
    return await fulfillPaidOrder(orderId, captureId, 'paypal');
  } catch (err) {
    if (!isStockInsufficientError(err)) {
      throw err;
    }

    const outcome = await issuePayPalRefundOrMarkPending(orderId, captureId, 'stock_insufficient');
    if (outcome === 'pending') {
      throw new Error(
        `El producto se agotó durante el pago. ${REFUND_PENDING_USER_MESSAGE}`,
      );
    }

    throw new Error('El producto se agotó durante el pago; se ha procesado el reembolso.');
  }
}

async function tryReusePayPalOrder(
  order: OrderPaymentRecord,
  existingPayPalOrderId: string,
): Promise<string | null> {
  try {
    const existing = await paypalFetch<PayPalOrderResponse>(
      `/v2/checkout/orders/${encodeURIComponent(existingPayPalOrderId)}`,
      { retry: true },
    );
    if (!REUSABLE_PAYPAL_ORDER_STATUSES.has(existing.status)) {
      return null;
    }
    assertPayPalOrderMatches(order, existing, existingPayPalOrderId);
    return existingPayPalOrderId;
  } catch {
    return null;
  }
}

export async function createPayPalOrder(orderId: string, userId: string) {
  const prepared = await preparePendingOrderPayment(orderId, userId);
  const order = asOrderPaymentRecord(prepared.order as { id: string } & Record<string, unknown>);
  assertPendingOrderForPayment(order, userId);

  const existingPayPalOrderId =
    typeof order.paypalOrderId === 'string' ? order.paypalOrderId : null;

  if (existingPayPalOrderId) {
    const reusedId = await tryReusePayPalOrder(order, existingPayPalOrderId);
    if (reusedId) {
      return {
        order: prepared.order,
        adjustments: prepared.adjustments,
        quantitySummary: prepared.quantitySummary,
        paypalOrderId: reusedId,
      };
    }
  }

  const paypalOrder = await paypalFetch<PayPalOrderResponse>('/v2/checkout/orders', {
    method: 'POST',
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          custom_id: orderId,
          amount: {
            currency_code: 'EUR',
            value: formatPayPalAmount(order.total ?? 0),
          },
        },
      ],
    },
    requestId: `create:${orderId}:${formatPayPalAmount(order.total ?? 0)}`,
  });

  const linked = await setOrderPayPalOrderId(orderId, userId, paypalOrder.id);
  if (!linked) {
    throw new Error('El pedido ya no está disponible para pago. Vuelve a intentarlo.');
  }

  return {
    order: prepared.order,
    adjustments: prepared.adjustments,
    quantitySummary: prepared.quantitySummary,
    paypalOrderId: paypalOrder.id,
  };
}

export async function capturePayPalOrder(
  orderId: string,
  userId: string,
  paypalOrderId: string,
) {
  const raw = await getOrderById(orderId, userId);
  if (!raw) {
    throw new Error('Pedido no encontrado');
  }

  const order = asOrderPaymentRecord(raw);
  if (order.status === 'pagado') {
    return { id: orderId, status: 'pagado' as const };
  }

  assertPendingOrderForPayment(order, userId);

  if (order.paypalOrderId && order.paypalOrderId !== paypalOrderId) {
    throw new PaymentValidationError('Orden PayPal no coincide con el pedido');
  }

  const existing = await paypalFetch<PayPalOrderResponse>(
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
    { retry: true },
  );
  assertPayPalOrderMatches(order, existing, paypalOrderId);

  let captured = existing;
  if (existing.status !== 'COMPLETED') {
    captured = await paypalFetch<PayPalOrderResponse>(
      `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
      {
        method: 'POST',
        requestId: `capture:${orderId}:${paypalOrderId}`,
      },
    );
  }

  const captureId = extractCaptureId(captured);
  if (!captureId) {
    throw new Error('No se pudo confirmar la captura de PayPal');
  }

  return fulfillPaidOrderOrRefundPayPal(orderId, captureId);
}

export async function reconcilePayPalOrder(orderId: string, userId: string) {
  const raw = await getOrderById(orderId, userId);
  if (!raw) {
    throw new Error('Pedido no encontrado');
  }

  const order = asOrderPaymentRecord(raw);

  if (order.status === 'pagado') {
    return { id: orderId, status: 'pagado' as const };
  }
  if (order.status === 'reembolsado') {
    return { id: orderId, status: 'reembolsado' as const };
  }
  if (order.status === 'reembolso_pendiente') {
    return { id: orderId, status: 'reembolso_pendiente' as const };
  }
  if (order.status === 'cancelado') {
    throw new Error('El pedido fue cancelado');
  }

  const paypalOrderId = order.paypalOrderId;
  if (!paypalOrderId) {
    throw new Error('No hay pago PayPal iniciado para este pedido');
  }

  if (order.status !== 'pendiente_pago') {
    throw new Error('El pedido no está pendiente de pago');
  }

  const existing = await paypalFetch<PayPalOrderResponse>(
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
    { retry: true },
  );
  assertPayPalOrderMatches(order, existing, paypalOrderId);

  if (existing.status === 'COMPLETED') {
    const captureId = extractCaptureId(existing);
    if (!captureId) {
      throw new Error('No se pudo confirmar la captura de PayPal');
    }
    return fulfillPaidOrderOrRefundPayPal(orderId, captureId);
  }

  if (existing.status === 'APPROVED') {
    return capturePayPalOrder(orderId, userId, paypalOrderId);
  }

  throw new Error('Pago aún en proceso');
}

export async function releasePayPalPaymentForOrder(orderId: string): Promise<void> {
  if (!isPayPalConfigured()) return;

  const raw = await getOrderById(orderId);
  if (!raw) return;

  const order = asOrderPaymentRecord(raw);
  const captureId = order.paypalCaptureId;
  const paypalOrderId = order.paypalOrderId;

  if (captureId) {
    await issuePayPalRefundOrMarkPending(orderId, captureId, 'order_canceled');
    return;
  }

  if (!paypalOrderId) return;

  try {
    const existing = await paypalFetch<PayPalOrderResponse>(
      `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
      { retry: true },
    );
    if (existing.status === 'APPROVED') {
      console.error(
        `[payments] Orden PayPal ${paypalOrderId} aprobada sin capturar; expirará automáticamente`,
      );
    }
  } catch (err) {
    console.error(`[payments] No se pudo consultar orden PayPal ${paypalOrderId}:`, err);
  }
}

/** Reintenta un reembolso PayPal pendiente (cron / script manual). */
export async function retryPayPalRefundForOrder(
  orderId: string,
): Promise<'refunded' | 'pending' | 'skipped'> {
  const raw = await getOrderById(orderId);
  if (!raw) return 'skipped';

  const order = asOrderPaymentRecord(raw);
  const captureId = order.paypalCaptureId;
  if (!captureId) return 'skipped';

  const reason =
    (raw as { refundPendingReason?: RefundPendingReason }).refundPendingReason ??
    'order_canceled';

  const outcome = await issuePayPalRefundOrMarkPending(orderId, captureId, reason);
  return outcome;
}

async function processPayPalCaptureCompleted(
  orderId: string,
  captureId: string,
  captureAmountValue?: string,
): Promise<void> {
  const raw = await getOrderById(orderId);
  if (!raw) {
    console.warn(`[payments] Webhook PayPal: pedido ${orderId} no encontrado`);
    return;
  }

  const order = asOrderPaymentRecord(raw);
  const action = resolvePayPalCaptureWebhookAction(order, captureId);

  if (action === 'ignore') {
    return;
  }

  if (action === 'retry_refund') {
    const captureIdToUse = order.paypalCaptureId ?? captureId;
    const reason =
      (raw as { refundPendingReason?: RefundPendingReason }).refundPendingReason ??
      'order_canceled';
    await issuePayPalRefundOrMarkPending(orderId, captureIdToUse, reason);
    return;
  }

  if (action === 'refund_canceled') {
    await issuePayPalRefundOrMarkPending(orderId, captureId, 'order_canceled');
    console.error(`[payments] Pedido cancelado ${orderId} reembolsado (cobro concurrente PayPal)`);
    return;
  }

  try {
    assertWebhookCaptureAmount(order, captureAmountValue);
  } catch (err) {
    if (err instanceof PaymentValidationError) {
      console.warn('[payments] Webhook PayPal rechazado:', err.message);
      return;
    }
    throw err;
  }

  await fulfillPaidOrderOrRefundPayPal(orderId, captureId);
}

export async function handlePayPalWebhook(
  rawBody: Buffer,
  headers: Record<string, string | string[] | undefined>,
) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) {
    throw new Error('PAYPAL_WEBHOOK_ID no configurada');
  }

  const event = JSON.parse(rawBody.toString('utf8')) as PayPalWebhookEvent;

  const verification = await paypalFetch<{ verification_status?: string }>(
    '/v1/notifications/verify-webhook-signature',
    {
      method: 'POST',
      body: {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: event,
      },
      retry: false,
    },
  );

  if (verification.verification_status !== 'SUCCESS') {
    throw new PaymentValidationError('Webhook PayPal inválido');
  }

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const captureId = event.resource?.id;
    const orderId = event.resource?.custom_id ?? event.resource?.invoice_id;

    if (!captureId || !orderId) {
      console.warn('[payments] Webhook PayPal sin captureId u orderId');
      return { received: true };
    }

    try {
      await processPayPalCaptureCompleted(
        orderId,
        captureId,
        event.resource?.amount?.value,
      );
    } catch (err) {
      if (err instanceof PaymentValidationError) {
        console.warn('[payments] Webhook PayPal rechazado:', err.message);
        return { received: true };
      }
      console.warn('[payments] Webhook PayPal error:', err);
      return { received: true };
    }
  }

  return { received: true };
}
