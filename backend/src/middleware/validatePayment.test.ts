import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  validatePayPalCapture,
  validatePayPalCreateOrder,
  validatePayPalWebhookHeaders,
} from '../middleware/validatePayment.js';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as Response & { statusCode: number; body: unknown };
  return res;
}

describe('validatePayPalCreateOrder', () => {
  it('rejects empty orderId', () => {
    const req = { body: {} } as Request;
    const res = mockRes();
    let nextCalled = false;
    validatePayPalCreateOrder(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
  });

  it('accepts valid orderId', () => {
    const req = { body: { orderId: 'order-1' } } as Request;
    const res = mockRes();
    let nextCalled = false;
    validatePayPalCreateOrder(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });
});

describe('validatePayPalCapture', () => {
  it('requires paypalOrderId', () => {
    const req = { body: { orderId: 'order-1' } } as Request;
    const res = mockRes();
    let nextCalled = false;
    validatePayPalCapture(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
  });
});

describe('validatePayPalWebhookHeaders', () => {
  it('rejects missing headers', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    let nextCalled = false;
    validatePayPalWebhookHeaders(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
  });

  it('accepts required headers', () => {
    const req = {
      headers: {
        'paypal-transmission-id': 'tx-1',
        'paypal-transmission-time': '2026-01-01T00:00:00Z',
        'paypal-cert-url': 'https://api.sandbox.paypal.com/cert',
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-transmission-sig': 'sig',
      },
    } as unknown as Request;
    const res = mockRes();
    let nextCalled = false;
    validatePayPalWebhookHeaders(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });
});
