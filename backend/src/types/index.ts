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

export interface OrderInput {
  items: {
    productId: string;
    name: string;
    price: number;
    size: string;
    color: string;
    quantity: number;
    image: string;
  }[];
  shippingAddress: {
    calle: string;
    ciudad: string;
    codigoPostal: string;
  };
  paymentMethod: string;
}
