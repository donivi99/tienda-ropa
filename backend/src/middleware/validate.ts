import type { Request, Response, NextFunction } from 'express';

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
  if (!body.name || typeof body.name !== 'string') return 'Nombre requerido';
  if (typeof body.price !== 'number' || body.price <= 0) return 'Precio inválido';
  if (!body.category || typeof body.category !== 'string') return 'Categoría requerida';
  if (!body.genero || !['mujer', 'hombre', 'niños'].includes(body.genero as string)) return 'Género inválido';
  if (!body.tipo || !['corto', 'largo', 'tirantes'].includes(body.tipo as string)) return 'Tipo inválido';
  if (!Array.isArray(body.images) || body.images.length === 0) return 'Al menos una imagen requerida';
  if (!Array.isArray(body.sizes) || body.sizes.length === 0) return 'Al menos una talla requerida';
  if (!Array.isArray(body.colors) || body.colors.length === 0) return 'Al menos un color requerido';
  if (!body.stock || typeof body.stock !== 'object') return 'Stock requerido';
  return null;
}

export function validateOrder(body: Record<string, unknown>): string | null {
  if (!Array.isArray(body.items) || body.items.length === 0) return 'Al menos un producto requerido';
  if (!body.shippingAddress) return 'Dirección de envío requerida';
  const addr = body.shippingAddress as Record<string, unknown>;
  if (!addr.calle || !addr.ciudad || !addr.codigoPostal) return 'Dirección incompleta';
  return null;
}
