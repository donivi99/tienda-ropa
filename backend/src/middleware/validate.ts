import type { Request, Response, NextFunction } from 'express';
import { isAllowedHttpsUrl, validateShippingAddressFields, validateProfileAddressFields } from '../utils/validation.js';
import { normalizeProductCategory } from '../utils/productCategory.js';

type Validator = (body: Record<string, unknown>) => string | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function validateProductFields(body: Record<string, unknown>, partial: boolean): string | null {
  if ('productoId' in body) return 'productoId no puede enviarse manualmente';

  if (!partial || body.name !== undefined) {
    if (!body.name || typeof body.name !== 'string') return 'Nombre requerido';
  }
  if (!partial || body.price !== undefined) {
    if (typeof body.price !== 'number' || body.price <= 0) return 'Precio inválido';
  }
  if (!partial || body.category !== undefined) {
    if (!body.category || typeof body.category !== 'string') return 'Categoría requerida';
    const normalized = normalizeProductCategory(body.category);
    if (normalized !== 'camisetas' && normalized !== 'pantalones') return 'Categoría inválida';
  }
  if (!partial || body.genero !== undefined) {
    if (!body.genero || !['mujer', 'hombre', 'niños'].includes(body.genero as string)) return 'Género inválido';
  }
  if (!partial || body.tipo !== undefined) {
    if (!body.tipo || !['corto', 'largo', 'tirantes'].includes(body.tipo as string)) return 'Tipo inválido';
  }
  if (!partial || body.images !== undefined) {
    if (!Array.isArray(body.images) || body.images.length === 0) return 'Al menos una imagen requerida';
    for (const url of body.images) {
      if (!isAllowedHttpsUrl(url)) return 'URL de imagen inválida (solo HTTPS)';
    }
  }
  if (!partial || body.sizes !== undefined) {
    if (!Array.isArray(body.sizes) || body.sizes.length === 0) return 'Al menos una talla requerida';
  }
  if (!partial || body.colors !== undefined) {
    if (!Array.isArray(body.colors) || body.colors.length === 0) return 'Al menos un color requerido';
  }
  if (!partial || body.stock !== undefined) {
    if (!body.stock || typeof body.stock !== 'object') return 'Stock requerido';
  }
  if (body.discountPercent !== undefined && body.discountPercent !== null) {
    if (typeof body.discountPercent !== 'number' || body.discountPercent < 0 || body.discountPercent > 100) {
      return 'Descuento inválido (0-100)';
    }
  }
  return null;
}

export function validateProduct(body: Record<string, unknown>): string | null {
  return validateProductFields(body, false);
}

export function validateProductUpdate(body: Record<string, unknown>): string | null {
  return validateProductFields(body, true);
}

export function validateCheckEmail(body: Record<string, unknown>): string | null {
  const { email } = body;
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return 'Email válido requerido';
  }
  return null;
}

export function validateRegister(body: Record<string, unknown>): string | null {
  const { email, nombre } = body;
  if (!email || typeof email !== 'string') return 'Email válido es requerido';
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 100) {
    return 'Nombre inválido (2-100 caracteres)';
  }
  return null;
}

export function validateProfileUpdate(body: Record<string, unknown>): string | null {
  const { nombre, phone, address } = body;

  if (nombre !== undefined) {
    if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 100) {
      return 'Nombre inválido (2-100 caracteres)';
    }
  }
  if (phone !== undefined) {
    if (typeof phone !== 'string' || phone.trim().length < 6 || phone.length > 20) {
      return 'Teléfono inválido (6-20 caracteres)';
    }
  }
  if (address !== undefined && address !== null) {
    if (typeof address !== 'object') return 'Dirección inválida';
    const addrErr = validateProfileAddressFields(address as Record<string, unknown>);
    if (addrErr) return addrErr;
  }
  return null;
}

export function validateContactMessage(body: Record<string, unknown>): string | null {
  const { clientName, message } = body;
  if (!clientName || typeof clientName !== 'string' || clientName.trim().length < 2 || clientName.length > 100) {
    return 'Nombre inválido (2-100 caracteres)';
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10 || message.length > 2000) {
    return 'Mensaje inválido (10-2000 caracteres)';
  }
  return null;
}

export function validateOrder(body: Record<string, unknown>): string | null {
  if (!Array.isArray(body.items) || body.items.length === 0) return 'Al menos un producto requerido';
  if (body.deliveryMethod !== 'domicilio') return 'Método de entrega inválido';

  if (!body.shippingAddress || typeof body.shippingAddress !== 'object') return 'Dirección de envío requerida';
  const addrErr = validateShippingAddressFields(body.shippingAddress as Record<string, unknown>);
  if (addrErr) return addrErr;

  for (const item of body.items) {
    if (!item || typeof item !== 'object') return 'Ítem de pedido inválido';
    const row = item as Record<string, unknown>;
    if (typeof row.productId !== 'string' || !row.productId.trim()) return 'productId requerido';
    if (typeof row.selectedSize !== 'string' || !row.selectedSize.trim()) return 'Talla requerida';
    if (typeof row.selectedColor !== 'string' || !row.selectedColor.trim()) return 'Color requerido';
    if (typeof row.quantity !== 'number' || !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 99) {
      return 'Cantidad inválida (1-99)';
    }
    // Precios y totales se calculan en servidor (anti-tampering)
    if ('price' in row || 'subtotal' in body || 'totalAmount' in body) {
      // Ignorados deliberadamente; no rechazamos para no romper clientes antiguos
    }
  }

  return null;
}
