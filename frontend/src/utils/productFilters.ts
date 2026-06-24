import type { Product } from '../types';
import { getEffectivePrice } from './colorMap';

export function isProductActive(product: { isActive?: boolean }): boolean {
  return product.isActive !== false;
}

export type PrendaFilter = 'camiseta' | 'pantalon';

export type ProductCategory = 'camisetas' | 'pantalones';

const LEGACY_CATEGORY_MAP: Record<string, ProductCategory> = {
  'camisetas-cortas': 'camisetas',
  'camisetas-largas': 'camisetas',
  'pantalones-cortos': 'pantalones',
  'pantalones-largos': 'pantalones',
};

export function normalizeProductCategory(category: string): ProductCategory | string {
  if (LEGACY_CATEGORY_MAP[category]) return LEGACY_CATEGORY_MAP[category];
  if (category.startsWith('camisetas')) return 'camisetas';
  if (category.startsWith('pantalones')) return 'pantalones';
  return category;
}

export function productMatchesCategoryFilter(category: string, filter: string): boolean {
  if (!filter) return true;
  return normalizeProductCategory(category) === filter;
}

export function formatProductCategoryLabel(category: string): string {
  const normalized = normalizeProductCategory(category);
  if (normalized === 'camisetas') return 'Camisetas';
  if (normalized === 'pantalones') return 'Pantalones';
  return String(normalized).replace(/-/g, ' ');
}

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
