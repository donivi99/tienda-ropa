import type { Request, Response, NextFunction } from 'express';
import { isAllowedHttpsUrl } from '../utils/validation.js';

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
  const addr = body.shippingAddress as Record<string, unknown>;

  if (!addr.nombre || typeof addr.nombre !== 'string' || (addr.nombre as string).trim().length < 2) return 'Nombre requerido';
  if (!addr.telefono || typeof addr.telefono !== 'string' || (addr.telefono as string).trim().length < 6) return 'Teléfono inválido';
  if (!addr.calle || typeof addr.calle !== 'string' || (addr.calle as string).trim().length < 3) return 'Calle requerida';
  if (!addr.ciudad || typeof addr.ciudad !== 'string' || (addr.ciudad as string).trim().length < 2) return 'Ciudad requerida';
  if (!addr.provincia || typeof addr.provincia !== 'string' || (addr.provincia as string).trim().length < 2) return 'Provincia requerida';

  if (!addr.codigoPostal || typeof addr.codigoPostal !== 'string') return 'Código postal requerido';
  const cp = addr.codigoPostal as string;
  if (!/^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(cp.trim())) return 'Código postal español inválido';

  for (const item of body.items) {
    if (!item || typeof item !== 'object') return 'Ítem de pedido inválido';
    const row = item as Record<string, unknown>;
    if (row.image !== undefined && !isAllowedHttpsUrl(row.image)) {
      return 'URL de imagen inválida (solo HTTPS)';
    }
  }

  return null;
}
