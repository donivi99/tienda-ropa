import { Router } from 'express';
import {
  confirmStripePayment,
  createStripePaymentIntent,
  handleStripeWebhook,
  isStripeConfigured,
} from '../services/paymentService.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.post('/stripe/create-intent', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Pagos con tarjeta no configurados' });
      return;
    }

    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
    if (!orderId) {
      res.status(400).json({ error: 'orderId requerido' });
      return;
    }

    const result = await createStripePaymentIntent(orderId, req.user!.uid);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al iniciar el pago';
    res.status(400).json({ error: message });
  }
});

router.post('/stripe/confirm', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Pagos con tarjeta no configurados' });
      return;
    }

    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
    if (!orderId) {
      res.status(400).json({ error: 'orderId requerido' });
      return;
    }

    const result = await confirmStripePayment(orderId, req.user!.uid);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al confirmar el pago';
    res.status(400).json({ error: message });
  }
});

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
