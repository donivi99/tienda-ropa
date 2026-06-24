import type { Product } from '../types';
import { formatProductCategoryLabel } from './productFilters';

const GENERO_PATH: Record<Product['genero'], string> = {
  mujer: '/categoria-mujer',
  hombre: '/categoria-hombre',
  'niños': '/categoria-ninos',
};

const GENERO_LABEL: Record<Product['genero'], string> = {
  mujer: 'Mujer',
  hombre: 'Hombre',
  'niños': 'Niños',
};

export function getCategoryCollectionPath(genero: Product['genero']): string {
  return GENERO_PATH[genero];
}

export function getGeneroLabel(genero: Product['genero']): string {
  return GENERO_LABEL[genero];
}

export function formatCategoryLabel(category: string): string {
  return formatProductCategoryLabel(category);
}
