import type Stripe from 'stripe';
import { eurosToStripeCents } from './pricing.js';
import {
  PaymentValidationError,
  type OrderPaymentRecord,
} from './paymentOrder.js';

export {
  PaymentValidationError,
  isOrderPaymentReleasable,
  type OrderPaymentRecord,
} from './paymentOrder.js';

export class StockInsufficientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StockInsufficientError';
  }
}

export function isStockInsufficientError(err: unknown): boolean {
  return err instanceof StockInsufficientError;
}

/** Acción Stripe al liberar un PI según su estado actual. */
export function getStripePaymentReleaseAction(
  paymentIntentStatus: Stripe.PaymentIntent.Status,
): 'cancel' | 'refund' | 'none' {
  switch (paymentIntentStatus) {
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
    case 'requires_capture':
    case 'processing':
      return 'cancel';
    case 'succeeded':
      return 'refund';
    case 'canceled':
      return 'none';
    default:
      return 'none';
  }
}

/** Comprueba metadata, importe e ID del PI sin validar estado del pedido. */
export function validatePaymentIntentIdentity(
  order: OrderPaymentRecord,
  paymentIntent: Stripe.PaymentIntent,
): void {
  if (paymentIntent.metadata.orderId !== order.id) {
    throw new PaymentValidationError('Pago no coincide con el pedido');
  }

  if (!order.userId || paymentIntent.metadata.userId !== order.userId) {
    throw new PaymentValidationError('Pago no coincide con el usuario');
  }

  const expectedAmount = eurosToStripeCents(order.total ?? 0);
  if (paymentIntent.amount !== expectedAmount) {
    throw new PaymentValidationError('Importe de pago no coincide');
  }

  if (!order.stripePaymentIntentId || paymentIntent.id !== order.stripePaymentIntentId) {
    throw new PaymentValidationError('Payment Intent no coincide con el pedido');
  }
}

/** Valida que un PaymentIntent de Stripe corresponde al pedido antes de fulfill/refund. */
export function assertPaymentIntentMatchesOrder(
  order: OrderPaymentRecord,
  paymentIntent: Stripe.PaymentIntent,
  options?: { requireSucceeded?: boolean },
): 'already_fulfilled' | 'ready' {
  const requireSucceeded = options?.requireSucceeded ?? true;

  if (order.status === 'pagado' && order.stripePaymentIntentId === paymentIntent.id) {
    return 'already_fulfilled';
  }

  if (order.status === 'reembolsado' || order.status === 'reembolso_pendiente') {
    return 'already_fulfilled';
  }

  if (order.status !== 'pendiente_pago') {
    throw new PaymentValidationError('El pedido no está pendiente de pago');
  }

  validatePaymentIntentIdentity(order, paymentIntent);

  if (requireSucceeded && paymentIntent.status !== 'succeeded') {
    throw new PaymentValidationError('El pago no se ha completado');
  }

  return 'ready';
}
