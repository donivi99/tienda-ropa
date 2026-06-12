const ALLOWED_ADDRESS_KEYS = ['calle', 'ciudad', 'provincia', 'codigoPostal', 'referencias'] as const;

const ADDRESS_MAX: Record<(typeof ALLOWED_ADDRESS_KEYS)[number], number> = {
  calle: 200,
  ciudad: 100,
  provincia: 100,
  codigoPostal: 5,
  referencias: 300,
};

export function sanitizeAddress(
  address: Record<string, unknown> | null | undefined
): Record<string, string> | undefined {
  if (!address || typeof address !== 'object') return undefined;

  const result: Record<string, string> = {};
  for (const key of ALLOWED_ADDRESS_KEYS) {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim();
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function validateAddressFields(address: Record<string, unknown>): string | null {
  for (const key of ALLOWED_ADDRESS_KEYS) {
    const value = address[key];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string') return 'Dirección inválida';
    const max = ADDRESS_MAX[key];
    if (value.length > max) return `${key} demasiado largo (máx. ${max} caracteres)`;
  }
  return null;
}

export function isAllowedHttpsUrl(url: unknown): boolean {
  if (url === undefined || url === null || url === '') return true;
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
