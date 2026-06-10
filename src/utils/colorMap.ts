export const COLOR_MAP: Record<string, string> = {
  negro: '#2d2d2d',
  blanco: '#f4f0e8',
  gris: '#8f8f8f',
  'gris claro': '#c8c8c8',
  'gris oscuro': '#5d5d5d',
  azul: '#53b8ff',
  'azul marino': '#1d3557',
  'azul claro': '#89CFF0',
  'azul medio': '#4A90D9',
  'azul oscuro': '#003153',
  'azul rey': '#2a6fdb',
  verde: '#5fcf80',
  'verde oliva': '#6b7d3a',
  'verde oscuro': '#006400',
  'verde botella': '#1f4d3a',
  'verde claro': '#90EE90',
  rojo: '#ff4d4d',
  rosa: '#f4a2df',
  'rosa palo': '#f6d6e7',
  borgoña: '#722f37',
  burdeos: '#6B1D1D',
  beige: '#d8c39a',
  crema: '#efe2c1',
  champagne: '#F7E7CE',
  khaki: '#C3B091',
  marrón: '#8b5a2b',
  lila: '#C8A2C8',
  morado: '#b77cff',
  amarillo: '#fff06a',
  naranja: '#ffb35c',
  caqui: '#c4b57a',
  multicolor: 'linear-gradient(135deg, #ffe66d 0%, #ff7aa2 35%, #59c6ff 70%, #5dd39e 100%)',
};

export const COMPOUND_COLORS: Record<string, [string, string]> = {
  'azul/blanco': ['#53b8ff', '#f4f0e8'],
  'azul/crema': ['#53b8ff', '#efe2c1'],
  'azul/negro': ['#53b8ff', '#2d2d2d'],
  'azul/rojo': ['#53b8ff', '#ff4d4d'],
  'gris/blanco': ['#8f8f8f', '#f4f0e8'],
  'negro/blanco': ['#2d2d2d', '#f4f0e8'],
  'rosa/azul': ['#f4a2df', '#53b8ff'],
  'rosa/lila': ['#f4a2df', '#C8A2C8'],
  'rojo/blanco': ['#ff4d4d', '#f4f0e8'],
  'verde/gris': ['#5fcf80', '#8f8f8f'],
  'verde/negro': ['#5fcf80', '#2d2d2d'],
};

export const COLOR_FAMILIES = [
  { name: 'Neutros', colors: ['negro', 'blanco', 'gris', 'gris claro', 'gris oscuro'] },
  { name: 'Azules', colors: ['azul', 'azul marino', 'azul claro', 'azul medio', 'azul oscuro', 'azul rey'] },
  { name: 'Verdes', colors: ['verde', 'verde oliva', 'verde oscuro', 'verde botella', 'verde claro'] },
  { name: 'Rojos y Rosas', colors: ['rojo', 'rosa', 'rosa palo', 'borgoña', 'burdeos'] },
  { name: 'Tierra', colors: ['beige', 'crema', 'champagne', 'khaki', 'marrón'] },
  { name: 'Otros', colors: ['lila', 'morado', 'amarillo', 'naranja', 'caqui'] },
];

export function getColorStyle(colorName: string): React.CSSProperties {
  const key = colorName.toLowerCase();
  const value = COLOR_MAP[key];
  if (!value) return { backgroundColor: '#d4af37' };
  if (value.startsWith('linear-gradient')) return { background: value };
  return { backgroundColor: value };
}

export function isCompoundColor(colorName: string): boolean {
  return colorName.toLowerCase() in COMPOUND_COLORS;
}

export function getCompoundColors(colorName: string): [string, string] | null {
  return COMPOUND_COLORS[colorName.toLowerCase()] ?? null;
}
