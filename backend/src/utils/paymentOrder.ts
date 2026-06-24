export type PaymentProvider = 'stripe' | 'paypal';

export interface OrderPaymentRecord {
  id: string;
  status?: string;
  total?: number;
  userId?: string;
  paymentMethod?: PaymentProvider | string | null;
  stripePaymentIntentId?: string | null;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
  stripeRefundId?: string | null;
  paypalRefundId?: string | null;
}

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentValidationError';
  }
}

const PAYMENT_RELEASABLE_STATUSES = new Set([
  'pendiente_pago',
  'pago_fallido',
  'reembolsado',
  'reembolso_pendiente',
]);

export function isOrderPaymentReleasable(status: string | undefined): boolean {
  return Boolean(status && PAYMENT_RELEASABLE_STATUSES.has(status));
}

export function formatPayPalAmount(total: number): string {
  return total.toFixed(2);
}

export function assertPendingOrderForPayment(
  order: OrderPaymentRecord,
  userId: string,
): void {
  if (order.userId !== userId) {
    throw new PaymentValidationError('Pedido no encontrado');
  }

  if (order.status !== 'pendiente_pago') {
    throw new PaymentValidationError('El pedido no está pendiente de pago');
  }

  if (typeof order.total !== 'number' || order.total <= 0) {
    throw new PaymentValidationError('Total de pedido inválido');
  }
}

export function getPaymentReferenceId(
  order: OrderPaymentRecord,
  paymentMethod: PaymentProvider,
): string | null {
  if (paymentMethod === 'stripe') {
    return order.stripePaymentIntentId ?? null;
  }
  return order.paypalCaptureId ?? null;
}

export type PayPalCaptureWebhookAction =
  | 'ignore'
  | 'fulfill'
  | 'refund_canceled'
  | 'retry_refund';

/** Decide cómo procesar PAYMENT.CAPTURE.COMPLETED según el estado del pedido. */
export function resolvePayPalCaptureWebhookAction(
  order: OrderPaymentRecord,
  captureId: string,
): PayPalCaptureWebhookAction {
  if (order.status === 'pagado' && order.paypalCaptureId === captureId) {
    return 'ignore';
  }
  if (order.status === 'reembolsado' || order.paypalRefundId) {
    return 'ignore';
  }
  if (order.status === 'reembolso_pendiente') {
    return 'retry_refund';
  }
  if (order.status === 'cancelado') {
    return 'refund_canceled';
  }
  if (order.status === 'pendiente_pago') {
    return 'fulfill';
  }
  return 'ignore';
}

/** Valida que el importe capturado en webhook coincide con order.total. */
export function assertWebhookCaptureAmount(
  order: OrderPaymentRecord,
  captureAmountValue?: string,
): void {
  if (!captureAmountValue) {
    throw new PaymentValidationError('Importe de captura PayPal ausente');
  }
  const expected = formatPayPalAmount(order.total ?? 0);
  if (captureAmountValue !== expected) {
    throw new PaymentValidationError('Importe de captura PayPal no coincide');
  }
}
