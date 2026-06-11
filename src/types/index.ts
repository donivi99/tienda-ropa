export interface Product {
  id: string;
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

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  price: number;
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

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  deliveryMethod: 'domicilio';
  status: 'pagado' | 'enviado' | 'entregado' | 'cancelado';
  createdAt: Date;
}

export const SHIPPING_FEE = 4.99;

export interface CreatorMessage {
  id: string;
  clientName: string;
  email: string;
  message: string;
  customRequest: boolean;
  createdAt: Date;
}
