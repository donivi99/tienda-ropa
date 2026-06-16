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

export interface ProductBase {
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
  isActive?: boolean;
}
