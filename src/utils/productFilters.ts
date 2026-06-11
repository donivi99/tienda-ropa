import type { Product } from '../types';
import { getEffectivePrice } from './colorMap';

export type PrendaFilter = 'camiseta' | 'pantalon';

export function productMatchesPrenda(category: string, prenda: PrendaFilter): boolean {
  if (prenda === 'camiseta') return category.startsWith('camisetas');
  return category.startsWith('pantalones');
}

export function hasActiveDiscount(product: Product): boolean {
  return product.discountPercent != null && product.discountPercent > 0;
}

export function getProductSalePrice(product: Product): number {
  return getEffectivePrice(product.price, product.discountPercent);
}
