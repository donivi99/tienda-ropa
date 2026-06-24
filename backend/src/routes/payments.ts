import { Router } from 'express';
import {
  confirmStripePayment,
  createStripePaymentIntent,
  handleStripeWebhook,
  isStripeConfigured,
} from '../services/paymentService.js';
import {
  capturePayPalOrder,
  createPayPalOrder,
  handlePayPalWebhook,
  isPayPalConfigured,
  reconcilePayPalOrder,
} from '../services/paypalService.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  validatePayPalCapture,
  validatePayPalCreateOrder,
  validatePayPalReconcile,
  validatePayPalWebhookHeaders,
  validateStripeOrderId,
} from '../middleware/validatePayment.js';
import { PaymentValidationError } from '../utils/paymentOrder.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.post(
  '/stripe/create-intent',
  authMiddleware,
  validateStripeOrderId,
  async (req: AuthRequest, res) => {
    try {
      if (!isStripeConfigured()) {
        res.status(503).json({ error: 'Pagos con tarjeta no configurados' });
        return;
      }

      const orderId = (req.body as { orderId: string }).orderId;
      const result = await createStripePaymentIntent(orderId, req.user!.uid);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar el pago';
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  '/stripe/confirm',
  authMiddleware,
  validateStripeOrderId,
  async (req: AuthRequest, res) => {
    try {
      if (!isStripeConfigured()) {
        res.status(503).json({ error: 'Pagos con tarjeta no configurados' });
        return;
      }

      const orderId = (req.body as { orderId: string }).orderId;
      const result = await confirmStripePayment(orderId, req.user!.uid);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al confirmar el pago';
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  '/paypal/create-order',
  authMiddleware,
  validatePayPalCreateOrder,
  async (req: AuthRequest, res) => {
    try {
      if (!isPayPalConfigured()) {
        res.status(503).json({ error: 'Pagos con PayPal no configurados' });
        return;
      }

      const orderId = (req.body as { orderId: string }).orderId;
      const result = await createPayPalOrder(orderId, req.user!.uid);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar el pago con PayPal';
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  '/paypal/capture',
  authMiddleware,
  validatePayPalCapture,
  async (req: AuthRequest, res) => {
    try {
      if (!isPayPalConfigured()) {
        res.status(503).json({ error: 'Pagos con PayPal no configurados' });
        return;
      }

      const { orderId, paypalOrderId } = req.body as {
        orderId: string;
        paypalOrderId: string;
      };
      const result = await capturePayPalOrder(orderId, req.user!.uid, paypalOrderId);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al confirmar el pago con PayPal';
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  '/paypal/reconcile',
  authMiddleware,
  validatePayPalReconcile,
  async (req: AuthRequest, res) => {
    try {
      if (!isPayPalConfigured()) {
        res.status(503).json({ error: 'Pagos con PayPal no configurados' });
        return;
      }

      const orderId = (req.body as { orderId: string }).orderId;
      const result = await reconcilePayPalOrder(orderId, req.user!.uid);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reconciliar el pago con PayPal';
      res.status(400).json({ error: message });
    }
  },
);

export async function paypalWebhookHandler(req: AuthRequest, res: import('express').Response) {
  try {
    if (!isPayPalConfigured()) {
      res.status(503).json({ error: 'PayPal no configurado' });
      return;
    }

    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).json({ error: 'Cuerpo de webhook inválido' });
      return;
    }

    await handlePayPalWebhook(rawBody, req.headers);
    res.json({ received: true });
  } catch (err) {
    console.error('PayPal webhook error:', err);
    const status = err instanceof PaymentValidationError ? 400 : 400;
    res.status(status).json({ error: 'Webhook inválido' });
  }
}

export async function stripeWebhookHandler(req: AuthRequest, res: import('express').Response) {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Stripe no configurado' });
      return;
    }

    const signature = req.headers['stripe-signature'];
    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).json({ error: 'Cuerpo de webhook inválido' });
      return;
    }

    await handleStripeWebhook(rawBody, typeof signature === 'string' ? signature : undefined);
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(400).json({ error: 'Webhook inválido' });
  }
}

export default router;
