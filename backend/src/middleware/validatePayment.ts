import type { Request, Response, NextFunction } from 'express';

const PAYPAL_WEBHOOK_HEADERS = [
  'paypal-transmission-id',
  'paypal-transmission-time',
  'paypal-cert-url',
  'paypal-auth-algo',
  'paypal-transmission-sig',
] as const;

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function validatePayPalCreateOrder(req: Request, res: Response, next: NextFunction): void {
  const orderId = readString((req.body as Record<string, unknown>)?.orderId);
  if (!orderId) {
    res.status(400).json({ error: 'orderId requerido' });
    return;
  }
  next();
}

export const validatePayPalReconcile = validatePayPalCreateOrder;

export function validateStripeOrderId(req: Request, res: Response, next: NextFunction): void {
  const orderId = readString((req.body as Record<string, unknown>)?.orderId);
  if (!orderId) {
    res.status(400).json({ error: 'orderId requerido' });
    return;
  }
  next();
}

export function validatePayPalCapture(req: Request, res: Response, next: NextFunction): void {
  const body = req.body as Record<string, unknown>;
  const orderId = readString(body?.orderId);
  const paypalOrderId = readString(body?.paypalOrderId);

  if (!orderId) {
    res.status(400).json({ error: 'orderId requerido' });
    return;
  }

  if (!paypalOrderId) {
    res.status(400).json({ error: 'paypalOrderId requerido' });
    return;
  }

  next();
}

export function validatePayPalWebhookHeaders(req: Request, res: Response, next: NextFunction): void {
  const missing = PAYPAL_WEBHOOK_HEADERS.filter((header) => !readString(req.headers[header]));
  if (missing.length > 0) {
    res.status(400).json({ error: 'Cabeceras de webhook PayPal incompletas' });
    return;
  }
  next();
}
