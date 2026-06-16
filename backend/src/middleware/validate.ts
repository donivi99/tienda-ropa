import type { Request, Response, NextFunction } from 'express';
import { isAllowedHttpsUrl, validateShippingAddressFields } from '../utils/validation.js';

type Validator = (body: Record<string, unknown>) => string | null;

export function validate(schema: Validator) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const error = schema(req.body as Record<string, unknown>);
    if (error) {
      res.status(400).json({ error });
      return;
    }
    next();
  };
}

export function validateProduct(body: Record<string, unknown>): string | null {
  if ('productoId' in body) return 'productoId no puede enviarse manualmente';
  if (!body.name || typeof body.name !== 'string') return 'Nombre requerido';
  if (typeof body.price !== 'number' || body.price <= 0) return 'Precio inválido';
  if (!body.category || typeof body.category !== 'string') return 'Categoría requerida';
  if (!body.genero || !['mujer', 'hombre', 'niños'].includes(body.genero as string)) return 'Género inválido';
  if (!body.tipo || !['corto', 'largo', 'tirantes'].includes(body.tipo as string)) return 'Tipo inválido';
  if (!Array.isArray(body.images) || body.images.length === 0) return 'Al menos una imagen requerida';
  if (!Array.isArray(body.sizes) || body.sizes.length === 0) return 'Al menos una talla requerida';
  if (!Array.isArray(body.colors) || body.colors.length === 0) return 'Al menos un color requerido';
  if (!body.stock || typeof body.stock !== 'object') return 'Stock requerido';
  if (body.discountPercent !== undefined && body.discountPercent !== null) {
    if (typeof body.discountPercent !== 'number' || body.discountPercent < 0 || body.discountPercent > 100) return 'Descuento inválido (0-100)';
  }
  return null;
}

export function validateOrder(body: Record<string, unknown>): string | null {
  if (!Array.isArray(body.items) || body.items.length === 0) return 'Al menos un producto requerido';
  if (body.deliveryMethod !== 'domicilio') return 'Método de entrega inválido';
  if (typeof body.subtotal !== 'number' || body.subtotal <= 0) return 'Subtotal inválido';
  if (typeof body.shippingFee !== 'number' || body.shippingFee < 0) return 'Coste de envío inválido';
  if (typeof body.totalAmount !== 'number' || body.totalAmount <= 0) return 'Total inválido';

  if (!body.shippingAddress || typeof body.shippingAddress !== 'object') return 'Dirección de envío requerida';
  const addrErr = validateShippingAddressFields(body.shippingAddress as Record<string, unknown>);
  if (addrErr) return addrErr;

  for (const item of body.items) {
    if (!item || typeof item !== 'object') return 'Ítem de pedido inválido';
    const row = item as Record<string, unknown>;
    if (row.image !== undefined && !isAllowedHttpsUrl(row.image)) {
      return 'URL de imagen inválida (solo HTTPS)';
    }
  }

  return null;
}
