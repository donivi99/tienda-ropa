const ALLOWED_ADDRESS_KEYS = [
  'calle',
  'numero',
  'piso',
  'puerta',
  'portal',
  'escalera',
  'ciudad',
  'provincia',
  'codigoPostal',
  'referencias',
] as const;

const ADDRESS_MAX: Record<(typeof ALLOWED_ADDRESS_KEYS)[number], number> = {
  calle: 150,
  numero: 10,
  piso: 10,
  puerta: 10,
  portal: 10,
  escalera: 10,
  ciudad: 100,
  provincia: 100,
  codigoPostal: 5,
  referencias: 300,
};

const OPTIONAL_ADDRESS_KEYS = new Set(['piso', 'puerta', 'portal', 'escalera', 'referencias']);

export const SPAIN_CP_REGEX = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
const NUMERO_REGEX = /^[\dA-Za-zºª\-/]{1,10}$/;

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

export function validateProfileAddressFields(address: Record<string, unknown>): string | null {
  const genericErr = validateAddressFields(address);
  if (genericErr) return genericErr;

  if (address.calle !== undefined && address.calle !== null && address.calle !== '') {
    if (typeof address.calle !== 'string' || address.calle.trim().length < 3) {
      return 'Calle inválida (mínimo 3 caracteres)';
    }
  }
  if (address.numero !== undefined && address.numero !== null && address.numero !== '') {
    if (typeof address.numero !== 'string' || !NUMERO_REGEX.test(address.numero.trim())) {
      return 'Número inválido';
    }
  }
  if (address.ciudad !== undefined && address.ciudad !== null && address.ciudad !== '') {
    if (typeof address.ciudad !== 'string' || address.ciudad.trim().length < 2) {
      return 'Ciudad inválida (mínimo 2 caracteres)';
    }
  }
  if (address.provincia !== undefined && address.provincia !== null && address.provincia !== '') {
    if (typeof address.provincia !== 'string' || address.provincia.trim().length < 2) {
      return 'Provincia inválida (mínimo 2 caracteres)';
    }
  }
  if (address.codigoPostal !== undefined && address.codigoPostal !== null && address.codigoPostal !== '') {
    if (typeof address.codigoPostal !== 'string' || !SPAIN_CP_REGEX.test(address.codigoPostal.trim())) {
      return 'Código postal inválido';
    }
  }

  for (const key of ALLOWED_ADDRESS_KEYS) {
    if (OPTIONAL_ADDRESS_KEYS.has(key)) continue;
    const value = address[key];
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
      if (key === 'numero' && address.calle) return 'Número requerido';
    }
  }

  return null;
}

export function validateShippingAddressFields(addr: Record<string, unknown>): string | null {
  if (!addr.nombre || typeof addr.nombre !== 'string' || addr.nombre.trim().length < 2) {
    return 'Nombre requerido';
  }
  if (!addr.telefono || typeof addr.telefono !== 'string' || addr.telefono.trim().length < 6) {
    return 'Teléfono inválido';
  }
  if (!addr.calle || typeof addr.calle !== 'string' || addr.calle.trim().length < 3) {
    return 'Calle requerida';
  }
  if (!addr.numero || typeof addr.numero !== 'string' || !NUMERO_REGEX.test(addr.numero.trim())) {
    return 'Número requerido';
  }
  if (!addr.ciudad || typeof addr.ciudad !== 'string' || addr.ciudad.trim().length < 2) {
    return 'Ciudad requerida';
  }
  if (!addr.provincia || typeof addr.provincia !== 'string' || addr.provincia.trim().length < 2) {
    return 'Provincia requerida';
  }
  if (!addr.codigoPostal || typeof addr.codigoPostal !== 'string') {
    return 'Código postal requerido';
  }
  if (!SPAIN_CP_REGEX.test((addr.codigoPostal as string).trim())) {
    return 'Código postal español inválido';
  }

  return validateAddressFields(addr);
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
