import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type Stripe from 'stripe';
import {
  isOrderPaymentReleasable,
  PaymentValidationError,
  type OrderPaymentRecord,
} from './paymentOrder.js';
import {
  getStripePaymentReleaseAction,
  validatePaymentIntentIdentity,
} from './stripePayment.js';

describe('isOrderPaymentReleasable', () => {
  it('returns true for pendiente_pago, pago_fallido, reembolsado and reembolso_pendiente', () => {
    assert.equal(isOrderPaymentReleasable('pendiente_pago'), true);
    assert.equal(isOrderPaymentReleasable('pago_fallido'), true);
    assert.equal(isOrderPaymentReleasable('reembolsado'), true);
    assert.equal(isOrderPaymentReleasable('reembolso_pendiente'), true);
  });

  it('returns false for pagado, cancelado and unknown', () => {
    assert.equal(isOrderPaymentReleasable('pagado'), false);
    assert.equal(isOrderPaymentReleasable('cancelado'), false);
    assert.equal(isOrderPaymentReleasable(undefined), false);
  });
});

describe('getStripePaymentReleaseAction', () => {
  it('returns cancel for open payment intents', () => {
    assert.equal(getStripePaymentReleaseAction('requires_payment_method'), 'cancel');
    assert.equal(getStripePaymentReleaseAction('requires_confirmation'), 'cancel');
    assert.equal(getStripePaymentReleaseAction('requires_action'), 'cancel');
    assert.equal(getStripePaymentReleaseAction('requires_capture'), 'cancel');
    assert.equal(getStripePaymentReleaseAction('processing'), 'cancel');
  });

  it('returns refund for succeeded', () => {
    assert.equal(getStripePaymentReleaseAction('succeeded'), 'refund');
  });

  it('returns none for canceled', () => {
    assert.equal(getStripePaymentReleaseAction('canceled'), 'none');
  });
});

describe('validatePaymentIntentIdentity', () => {
  const order: OrderPaymentRecord = {
    id: 'order-1',
    userId: 'user-1',
    total: 19.99,
    stripePaymentIntentId: 'pi_test_123',
  };

  const paymentIntent = {
    id: 'pi_test_123',
    amount: 1999,
    metadata: { orderId: 'order-1', userId: 'user-1' },
  } as unknown as Stripe.PaymentIntent;

  it('passes when metadata, amount and PI id match', () => {
    assert.doesNotThrow(() => validatePaymentIntentIdentity(order, paymentIntent));
  });

  it('rejects mismatched orderId', () => {
    assert.throws(
      () =>
        validatePaymentIntentIdentity(order, {
          ...paymentIntent,
          metadata: { orderId: 'other', userId: 'user-1' },
        } as Stripe.PaymentIntent),
      PaymentValidationError,
    );
  });

  it('rejects mismatched payment intent id', () => {
    assert.throws(
      () =>
        validatePaymentIntentIdentity(order, {
          ...paymentIntent,
          id: 'pi_other',
        } as Stripe.PaymentIntent),
      PaymentValidationError,
    );
  });
});
