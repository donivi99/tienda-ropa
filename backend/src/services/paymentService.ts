import Stripe from 'stripe';
import {
  fulfillPaidOrder,
  getOrderById,
  getPendingRefundOrders,
  markOrderPaymentFailed,
  markOrderRefunded,
  markOrderRefundPending,
  setOrderPaymentIntentId,
} from './orderService.js';
import { eurosToStripeCents } from '../utils/pricing.js';
import {
  assertPaymentIntentMatchesOrder,
  isStockInsufficientError,
  getStripePaymentReleaseAction,
  type OrderPaymentRecord,
  PaymentValidationError,
  validatePaymentIntentIdentity,
} from '../utils/stripePayment.js';
import type { RefundPendingReason } from '../types/index.js';

const REFUND_PENDING_USER_MESSAGE =
  'Estamos procesando el reembolso. Si no lo recibes en 48 h, contacta con soporte.';

let stripeClient: Stripe | null = null;

function asOrderPaymentRecord(order: { id: string } & Record<string, unknown>): OrderPaymentRecord {
  return order as OrderPaymentRecord;
}

function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY no configurada');
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

async function createIdempotentRefund(paymentIntentId: string): Promise<string> {
  const stripe = getStripe();
  const existingRefunds = await stripe.refunds.list({ payment_intent: paymentIntentId, limit: 1 });
  const existingId = existingRefunds.data[0]?.id;
  if (existingId) {
    return existingId;
  }
  const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
  return refund.id;
}

async function issueRefundOrMarkPending(
  orderId: string,
  paymentIntentId: string,
  reason: RefundPendingReason,
): Promise<'refunded' | 'pending'> {
  try {
    const refundId = await createIdempotentRefund(paymentIntentId);
    const marked = await markOrderRefunded(orderId, refundId, paymentIntentId);
    if (!marked) {
      const errMsg = 'No se pudo actualizar el pedido tras el reembolso en Stripe';
      await markOrderRefundPending(orderId, paymentIntentId, reason, errMsg);
      console.error('[payments] REFUND_PENDING', { orderId, paymentIntentId, reason, errMsg });
      return 'pending';
    }
    return 'refunded';
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await markOrderRefundPending(orderId, paymentIntentId, reason, errMsg);
    console.error('[payments] REFUND_PENDING', { orderId, paymentIntentId, reason, err: errMsg });
    return 'pending';
  }
}

async function refundPaymentForCanceledOrder(
  orderId: string,
  order: OrderPaymentRecord,
  paymentIntent: Stripe.PaymentIntent,
) {
  if (order.status === 'reembolsado' || order.stripeRefundId) {
    return { id: orderId, status: 'reembolsado' as const };
  }

  validatePaymentIntentIdentity(order, paymentIntent);
  const outcome = await issueRefundOrMarkPending(orderId, paymentIntent.id, 'order_canceled');
  if (outcome === 'pending') {
    return { id: orderId, status: 'reembolso_pendiente' as const };
  }
  console.error(`[payments] Pedido cancelado ${orderId} reembolsado (cobro concurrente)`);
  return { id: orderId, status: 'reembolsado' as const };
}

/** Invalida el PI en Stripe tras cancelar un pedido (cancel o refund según estado del PI). */
export async function releaseStripePaymentForOrder(
  orderId: string,
  options?: { paymentIntentId?: string },
): Promise<void> {
  if (!isStripeConfigured()) {
    return;
  }

  const raw = await getOrderById(orderId);
  if (!raw) {
    return;
  }

  const order = asOrderPaymentRecord(raw);
  const paymentIntentId = options?.paymentIntentId ?? order.stripePaymentIntentId;
  if (!paymentIntentId) {
    return;
  }

  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const action = getStripePaymentReleaseAction(paymentIntent.status);

    if (action === 'cancel') {
      try {
        await stripe.paymentIntents.cancel(paymentIntentId);
      } catch (err) {
        console.error(
          `[payments] No se pudo cancelar PI ${paymentIntentId} del pedido ${orderId}:`,
          err,
        );
      }
      return;
    }

    if (action === 'refund') {
      const outcome = await issueRefundOrMarkPending(orderId, paymentIntentId, 'order_canceled');
      if (outcome === 'refunded') {
        console.error(`[payments] Pedido ${orderId} reembolsado tras cancelación con cobro concurrente`);
      }
    }
  } catch (err) {
    console.error(`[payments] Error al liberar PI del pedido ${orderId}:`, err);
  }
}

export async function createStripePaymentIntent(orderId: string, userId: string) {
  const raw = await getOrderById(orderId, userId);
  if (!raw) {
    throw new Error('Pedido no encontrado');
  }
  const order = asOrderPaymentRecord(raw);

  const status = order.status;
  if (status !== 'pendiente_pago') {
    throw new Error('El pedido no está pendiente de pago');
  }

  const total = typeof order.total === 'number' ? order.total : 0;
  if (total <= 0) {
    throw new Error('Total de pedido inválido');
  }

  const stripe = getStripe();
  const amount = eurosToStripeCents(total);

  const existingIntentId = order.stripePaymentIntentId;
  if (existingIntentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(existingIntentId);
      if (
        existing.status === 'requires_payment_method' ||
        existing.status === 'requires_confirmation' ||
        existing.status === 'requires_action'
      ) {
        if (existing.metadata.orderId === orderId && existing.amount === amount) {
          return {
            clientSecret: existing.client_secret,
            paymentIntentId: existing.id,
          };
        }
      }
    } catch {
      // Crear nuevo intent si el anterior no es reutilizable
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId,
      userId,
    },
  });

  if (!paymentIntent.client_secret) {
    throw new Error('No se pudo crear la sesión de pago');
  }

  const linked = await setOrderPaymentIntentId(orderId, userId, paymentIntent.id);
  if (!linked) {
    try {
      await stripe.paymentIntents.cancel(paymentIntent.id);
    } catch (err) {
      console.error(
        `[payments] PI huérfano ${paymentIntent.id} tras fallo al vincular pedido ${orderId}:`,
        err,
      );
    }
    throw new Error('El pedido ya no está disponible para pago. Vuelve a intentarlo.');
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

async function fulfillPaidOrderOrRefund(orderId: string, paymentIntentId: string) {
  const raw = await getOrderById(orderId);
  if (!raw) {
    throw new Error('Pedido no encontrado');
  }
  const order = asOrderPaymentRecord(raw);

  if (order.status === 'reembolsado' || order.stripeRefundId) {
    return { id: orderId, status: 'reembolsado' as const };
  }

  if (order.status === 'reembolso_pendiente') {
    return { id: orderId, status: 'reembolso_pendiente' as const };
  }

  try {
    return await fulfillPaidOrder(orderId, paymentIntentId, 'stripe');
  } catch (err) {
    if (!isStockInsufficientError(err)) {
      throw err;
    }

    const outcome = await issueRefundOrMarkPending(orderId, paymentIntentId, 'stock_insufficient');
    if (outcome === 'pending') {
      throw new Error(
        `El producto se agotó durante el pago. ${REFUND_PENDING_USER_MESSAGE}`,
      );
    }

    console.error(`[payments] Pedido ${orderId} reembolsado por stock insuficiente`);
    throw new Error('El producto se agotó durante el pago; se ha procesado el reembolso.');
  }
}

export async function confirmStripePayment(orderId: string, userId: string) {
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

  const paymentIntentId = order.stripePaymentIntentId;
  if (!paymentIntentId) {
    if (order.status === 'cancelado') {
      throw new Error('El pedido fue cancelado');
    }
    throw new Error('No hay pago iniciado para este pedido');
  }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (order.status === 'cancelado') {
    if (paymentIntent.status === 'succeeded') {
      return refundPaymentForCanceledOrder(orderId, order, paymentIntent);
    }
    throw new Error('El pedido fue cancelado');
  }

  const match = assertPaymentIntentMatchesOrder(order, paymentIntent, { requireSucceeded: false });

  if (match === 'already_fulfilled') {
    return order.status === 'reembolsado'
      ? { id: orderId, status: 'reembolsado' as const }
      : { id: orderId, status: 'pagado' as const };
  }

  if (paymentIntent.status === 'succeeded') {
    assertPaymentIntentMatchesOrder(order, paymentIntent, { requireSucceeded: true });
    return fulfillPaidOrderOrRefund(orderId, paymentIntentId);
  }

  if (paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method') {
    await markOrderPaymentFailed(orderId, paymentIntentId);
    throw new Error('El pago no se completó');
  }

  throw new Error('Pago aún en proceso');
}

async function processPaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    console.warn('[payments] Webhook payment_intent.succeeded sin orderId en metadata');
    return;
  }

  const raw = await getOrderById(orderId);
  if (!raw) {
    console.warn(`[payments] Webhook: pedido ${orderId} no encontrado`);
    return;
  }

  const order = asOrderPaymentRecord(raw);

  if (order.status === 'reembolso_pendiente') {
    const piId =
      order.stripePaymentIntentId ??
      (typeof paymentIntent.id === 'string' ? paymentIntent.id : undefined);
    if (piId) {
      const reason =
        (order as { refundPendingReason?: RefundPendingReason }).refundPendingReason ??
        'order_canceled';
      await issueRefundOrMarkPending(orderId, piId, reason);
    }
    return;
  }

  if (order.status === 'cancelado') {
    if (paymentIntent.status === 'succeeded') {
      await refundPaymentForCanceledOrder(orderId, order, paymentIntent);
    }
    return;
  }

  const match = assertPaymentIntentMatchesOrder(order, paymentIntent);

  if (match === 'already_fulfilled') {
    return;
  }

  await fulfillPaidOrderOrRefund(orderId, paymentIntent.id);
}

async function processPaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  const raw = await getOrderById(orderId);
  if (!raw) return;

  const order = asOrderPaymentRecord(raw);
  if (order.stripePaymentIntentId && paymentIntent.id !== order.stripePaymentIntentId) {
    console.warn(`[payments] Webhook payment_failed: PI no coincide con pedido ${orderId}`);
    return;
  }

  await markOrderPaymentFailed(orderId, paymentIntent.id);
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET no configurada');
  }

  if (!signature) {
    throw new Error('Firma de webhook ausente');
  }

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await processPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await processPaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        break;
    }
  } catch (err) {
    if (err instanceof PaymentValidationError) {
      console.warn('[payments] Webhook rechazado:', err.message);
      return { received: true };
    }
    throw err;
  }

  return { received: true };
}

/** Reintenta reembolsos pendientes (cron / script manual). */
export async function retryPendingRefunds(): Promise<{
  processed: number;
  resolved: number;
  failed: number;
}> {
  if (!isStripeConfigured()) {
    return { processed: 0, resolved: 0, failed: 0 };
  }

  const pending = await getPendingRefundOrders();
  let resolved = 0;
  let failed = 0;

  for (const row of pending) {
    const order = asOrderPaymentRecord(row as { id: string } & Record<string, unknown>);
    const paymentIntentId = order.stripePaymentIntentId;
    if (!paymentIntentId) {
      failed += 1;
      continue;
    }

    const reason =
      (row as { refundPendingReason?: RefundPendingReason }).refundPendingReason ??
      'order_canceled';
    const outcome = await issueRefundOrMarkPending(order.id, paymentIntentId, reason);
    if (outcome === 'refunded') {
      resolved += 1;
    } else {
      failed += 1;
    }
  }

  return { processed: pending.length, resolved, failed };
}
