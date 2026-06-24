import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertPendingOrderForPayment,
  assertWebhookCaptureAmount,
  formatPayPalAmount,
  getPaymentReferenceId,
  PaymentValidationError,
  resolvePayPalCaptureWebhookAction,
  type OrderPaymentRecord,
} from './paymentOrder.js';

describe('formatPayPalAmount', () => {
  it('formats euros with two decimals', () => {
    assert.equal(formatPayPalAmount(19.9), '19.90');
    assert.equal(formatPayPalAmount(4.99), '4.99');
  });
});

describe('assertPendingOrderForPayment', () => {
  const order: OrderPaymentRecord = {
    id: 'order-1',
    userId: 'user-1',
    status: 'pendiente_pago',
    total: 24.99,
  };

  it('passes for a valid pending order', () => {
    assert.doesNotThrow(() => assertPendingOrderForPayment(order, 'user-1'));
  });

  it('rejects another user', () => {
    assert.throws(
      () => assertPendingOrderForPayment(order, 'other-user'),
      PaymentValidationError,
    );
  });

  it('rejects non-pending status', () => {
    assert.throws(
      () => assertPendingOrderForPayment({ ...order, status: 'pagado' }, 'user-1'),
      PaymentValidationError,
    );
  });

  it('rejects invalid total', () => {
    assert.throws(
      () => assertPendingOrderForPayment({ ...order, total: 0 }, 'user-1'),
      PaymentValidationError,
    );
  });
});

describe('getPaymentReferenceId', () => {
  const order: OrderPaymentRecord = {
    id: 'order-1',
    stripePaymentIntentId: 'pi_123',
    paypalCaptureId: 'cap_456',
  };

  it('returns stripe payment intent id', () => {
    assert.equal(getPaymentReferenceId(order, 'stripe'), 'pi_123');
  });

  it('returns paypal capture id', () => {
    assert.equal(getPaymentReferenceId(order, 'paypal'), 'cap_456');
  });
});

describe('resolvePayPalCaptureWebhookAction', () => {
  const base: OrderPaymentRecord = { id: 'order-1', total: 19.99 };

  it('ignores duplicate pagado with same capture', () => {
    assert.equal(
      resolvePayPalCaptureWebhookAction(
        { ...base, status: 'pagado', paypalCaptureId: 'cap-1' },
        'cap-1',
      ),
      'ignore',
    );
  });

  it('refunds when order is cancelado', () => {
    assert.equal(
      resolvePayPalCaptureWebhookAction({ ...base, status: 'cancelado' }, 'cap-1'),
      'refund_canceled',
    );
  });

  it('retries refund when reembolso_pendiente', () => {
    assert.equal(
      resolvePayPalCaptureWebhookAction({ ...base, status: 'reembolso_pendiente' }, 'cap-1'),
      'retry_refund',
    );
  });

  it('fulfills when pendiente_pago', () => {
    assert.equal(
      resolvePayPalCaptureWebhookAction({ ...base, status: 'pendiente_pago' }, 'cap-1'),
      'fulfill',
    );
  });

  it('ignores unknown status', () => {
    assert.equal(
      resolvePayPalCaptureWebhookAction({ ...base, status: 'enviado' }, 'cap-1'),
      'ignore',
    );
  });
});

describe('assertWebhookCaptureAmount', () => {
  const order: OrderPaymentRecord = { id: 'order-1', total: 19.99 };

  it('passes when amount matches', () => {
    assert.doesNotThrow(() => assertWebhookCaptureAmount(order, '19.99'));
  });

  it('rejects mismatched amount', () => {
    assert.throws(
      () => assertWebhookCaptureAmount(order, '9.99'),
      PaymentValidationError,
    );
  });

  it('rejects missing amount', () => {
    assert.throws(() => assertWebhookCaptureAmount(order, undefined), PaymentValidationError);
  });
});
