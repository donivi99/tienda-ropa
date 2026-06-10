export interface Product {
  id: string;
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

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  shippingAddress: {
    calle: string;
    ciudad: string;
    codigoPostal: string;
  };
  status: 'pagado' | 'enviado' | 'entregado';
  createdAt: Date;
}

export interface CreatorMessage {
  id: string;
  clientName: string;
  email: string;
  message: string;
  customRequest: boolean;
  createdAt: Date;
}
