const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

export function collectProductSizes(products: { sizes?: string[] }[]): string[] {
  const sizes = new Set<string>();
  products.forEach((p) => p.sizes?.forEach((s) => sizes.add(s)));
  return sortSizes(Array.from(sizes));
}
