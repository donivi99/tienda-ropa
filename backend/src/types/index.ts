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
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  referencias?: string;
}

export interface OrderInput {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  deliveryMethod: 'domicilio';
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
}

export const SHIPPING_FEE = 4.99;
