import type { Request } from 'express';

export interface AuthUser {
  uid: string;
  email: string | null;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  discountPercent?: number;
  category: string;
  genero: 'mujer' | 'hombre' | 'niños';
  tipo: 'corto' | 'largo' | 'tirantes';
  images: string[];
  sizes: string[];
  colors: string[];
  stock: Record<string, number>;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  image: string;
}

export interface ShippingAddress {
  nombre: string;
  telefono: string;
  calle: string;
  numero: string;
  piso?: string;
  puerta?: string;
  portal?: string;
  escalera?: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  referencias?: string;
}

export interface OrderItemInput {
  productId: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface OrderInput {
  items: OrderItemInput[];
  shippingAddress: ShippingAddress;
  deliveryMethod: 'domicilio';
}

export type OrderStatus =
  | 'pendiente_pago'
  | 'pagado'
  | 'enviado'
  | 'entregado'
  | 'cancelado'
  | 'pago_fallido'
  | 'reembolsado'
  | 'reembolso_pendiente';

export type RefundPendingReason = 'stock_insufficient' | 'order_canceled';

export interface StockAdjustment {
  productId: string;
  name: string;
  selectedSize: string;
  requestedQuantity: number;
  availableQuantity: number;
  appliedQuantity: number;
}

export interface OrderQuantitySummary {
  requestedTotal: number;
  appliedTotal: number;
}

export const SHIPPING_FEE = 4.99;
