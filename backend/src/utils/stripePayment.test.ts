import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type Stripe from 'stripe';
import {
  assertPaymentIntentMatchesOrder,
  PaymentValidationError,
  type OrderPaymentRecord,
} from './stripePayment.js';

function baseOrder(overrides: Partial<OrderPaymentRecord> = {}): OrderPaymentRecord {
  return {
    id: 'order-1',
    status: 'pendiente_pago',
    total: 24.99,
    stripePaymentIntentId: 'pi_test_123',
    userId: 'user-1',
    ...overrides,
  };
}

function basePaymentIntent(overrides: Partial<Stripe.PaymentIntent> = {}): Stripe.PaymentIntent {
  return {
    id: 'pi_test_123',
    amount: 2499,
    status: 'succeeded',
    metadata: { orderId: 'order-1', userId: 'user-1' },
    ...overrides,
  } as Stripe.PaymentIntent;
}

describe('assertPaymentIntentMatchesOrder', () => {
  it('returns ready when all fields match', () => {
    const result = assertPaymentIntentMatchesOrder(baseOrder(), basePaymentIntent());
    assert.equal(result, 'ready');
  });

  it('returns already_fulfilled when order is pagado with same PI', () => {
    const result = assertPaymentIntentMatchesOrder(
      baseOrder({ status: 'pagado' }),
      basePaymentIntent(),
    );
    assert.equal(result, 'already_fulfilled');
  });

  it('returns already_fulfilled when order is reembolsado', () => {
    const result = assertPaymentIntentMatchesOrder(
      baseOrder({ status: 'reembolsado' }),
      basePaymentIntent(),
    );
    assert.equal(result, 'already_fulfilled');
  });

  it('rejects mismatched orderId in metadata', () => {
    assert.throws(
      () =>
        assertPaymentIntentMatchesOrder(
          baseOrder(),
          basePaymentIntent({ metadata: { orderId: 'other', userId: 'user-1' } }),
        ),
      PaymentValidationError,
    );
  });

  it('rejects mismatched userId in metadata', () => {
    assert.throws(
      () =>
        assertPaymentIntentMatchesOrder(
          baseOrder(),
          basePaymentIntent({ metadata: { orderId: 'order-1', userId: 'other' } }),
        ),
      (err: unknown) =>
        err instanceof PaymentValidationError && err.message.includes('usuario'),
    );
  });

  it('rejects mismatched amount', () => {
    assert.throws(
      () => assertPaymentIntentMatchesOrder(baseOrder(), basePaymentIntent({ amount: 100 })),
      (err: unknown) =>
        err instanceof PaymentValidationError && err.message.includes('Importe'),
    );
  });

  it('rejects payment intent not stored on order', () => {
    assert.throws(
      () => assertPaymentIntentMatchesOrder(baseOrder(), basePaymentIntent({ id: 'pi_other' })),
      (err: unknown) =>
        err instanceof PaymentValidationError && err.message.includes('Payment Intent'),
    );
  });

  it('rejects non-succeeded status when requireSucceeded is true', () => {
    assert.throws(
      () =>
        assertPaymentIntentMatchesOrder(
          baseOrder(),
          basePaymentIntent({ status: 'requires_action' }),
        ),
      (err: unknown) =>
        err instanceof PaymentValidationError && err.message.includes('no se ha completado'),
    );
  });

  it('allows non-succeeded status when requireSucceeded is false', () => {
    const result = assertPaymentIntentMatchesOrder(
      baseOrder(),
      basePaymentIntent({ status: 'requires_action' }),
      { requireSucceeded: false },
    );
    assert.equal(result, 'ready');
  });

  it('rejects order not in pendiente_pago', () => {
    assert.throws(
      () =>
        assertPaymentIntentMatchesOrder(
          baseOrder({ status: 'cancelado' }),
          basePaymentIntent(),
        ),
      (err: unknown) =>
        err instanceof PaymentValidationError && err.message.includes('pendiente de pago'),
    );
  });
});
