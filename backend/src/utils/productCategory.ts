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

export function needsCategoryMigration(category: string): boolean {
  return category in LEGACY_CATEGORY_MAP;
}
