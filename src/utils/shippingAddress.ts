import type { ShippingAddress } from '../types';

export const SPAIN_CP_REGEX = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
export const NUMERO_REGEX = /^[\dA-Za-zºª\-/]{1,10}$/;

export type StreetAddressValue = Pick<
  ShippingAddress,
  'calle' | 'numero' | 'piso' | 'puerta' | 'portal' | 'escalera' | 'ciudad' | 'provincia' | 'codigoPostal' | 'referencias'
>;

export interface ProfileShippingSource {
  nombre?: string;
  phone?: string;
  address?: Partial<StreetAddressValue>;
}

export const EMPTY_SHIPPING_ADDRESS: ShippingAddress = {
  nombre: '',
  telefono: '',
  calle: '',
  numero: '',
  piso: '',
  puerta: '',
  portal: '',
  escalera: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
  referencias: '',
};

function readStreetFromProfile(address?: Partial<StreetAddressValue>): StreetAddressValue {
  return {
    calle: address?.calle ?? '',
    numero: address?.numero ?? '',
    piso: address?.piso ?? '',
    puerta: address?.puerta ?? '',
    portal: address?.portal ?? '',
    escalera: address?.escalera ?? '',
    ciudad: address?.ciudad ?? '',
    provincia: address?.provincia ?? '',
    codigoPostal: address?.codigoPostal ?? '',
    referencias: address?.referencias ?? '',
  };
}

export function profileToShippingAddress(profile: ProfileShippingSource | null | undefined): ShippingAddress {
  return {
    nombre: profile?.nombre ?? '',
    telefono: profile?.phone ?? '',
    ...readStreetFromProfile(profile?.address),
  };
}

export function mergeShippingFromProfile(
  current: ShippingAddress,
  profile: ProfileShippingSource | null | undefined,
): ShippingAddress {
  const fromProfile = profileToShippingAddress(profile);
  return {
    nombre: current.nombre || fromProfile.nombre,
    telefono: current.telefono || fromProfile.telefono,
    calle: current.calle || fromProfile.calle,
    numero: current.numero || fromProfile.numero,
    piso: current.piso || fromProfile.piso,
    puerta: current.puerta || fromProfile.puerta,
    portal: current.portal || fromProfile.portal,
    escalera: current.escalera || fromProfile.escalera,
    ciudad: current.ciudad || fromProfile.ciudad,
    provincia: current.provincia || fromProfile.provincia,
    codigoPostal: current.codigoPostal || fromProfile.codigoPostal,
    referencias: current.referencias || fromProfile.referencias,
  };
}

export function shippingAddressToProfileUpdate(address: ShippingAddress) {
  const normalized = normalizeShippingAddress(address);
  return {
    nombre: normalized.nombre,
    phone: normalized.telefono,
    address: {
      calle: normalized.calle,
      numero: normalized.numero,
      piso: normalized.piso,
      puerta: normalized.puerta,
      portal: normalized.portal,
      escalera: normalized.escalera,
      ciudad: normalized.ciudad,
      provincia: normalized.provincia,
      codigoPostal: normalized.codigoPostal,
      referencias: normalized.referencias,
    },
  };
}

export function isProfileShippingIncomplete(profile: ProfileShippingSource | null | undefined): boolean {
  return validateShippingAddress(profileToShippingAddress(profile)) !== null;
}

export function validateStreetAddress(value: StreetAddressValue): string | null {
  if (!value.calle.trim() || value.calle.trim().length < 3 || value.calle.length > 150) {
    return 'Calle inválida (3-150 caracteres)';
  }
  if (!value.numero.trim() || !NUMERO_REGEX.test(value.numero.trim())) {
    return 'Número inválido (1-10 caracteres)';
  }
  if (!value.ciudad.trim() || value.ciudad.trim().length < 2 || value.ciudad.length > 100) {
    return 'Ciudad inválida (2-100 caracteres)';
  }
  if (!value.provincia.trim() || value.provincia.trim().length < 2 || value.provincia.length > 100) {
    return 'Provincia inválida (2-100 caracteres)';
  }
  if (!SPAIN_CP_REGEX.test(value.codigoPostal.trim())) {
    return 'Código postal español inválido (5 dígitos)';
  }
  if (value.piso && value.piso.length > 10) return 'Piso demasiado largo (máx. 10 caracteres)';
  if (value.puerta && value.puerta.length > 10) return 'Puerta demasiado larga (máx. 10 caracteres)';
  if (value.portal && value.portal.length > 10) return 'Portal demasiado largo (máx. 10 caracteres)';
  if (value.escalera && value.escalera.length > 10) return 'Escalera demasiado larga (máx. 10 caracteres)';
  if (value.referencias && value.referencias.length > 300) {
    return 'Referencias demasiado largas (máx. 300 caracteres)';
  }
  return null;
}

export function validateShippingAddress(address: ShippingAddress): string | null {
  if (!address.nombre.trim() || address.nombre.trim().length < 2 || address.nombre.length > 100) {
    return 'Nombre inválido (2-100 caracteres)';
  }
  if (!address.telefono.trim() || address.telefono.trim().length < 6 || address.telefono.length > 20) {
    return 'Teléfono inválido (6-20 caracteres)';
  }
  return validateStreetAddress(address);
}

export function normalizeShippingAddress(address: ShippingAddress): ShippingAddress {
  const trimOptional = (value?: string) => value?.trim() || undefined;
  return {
    nombre: address.nombre.trim(),
    telefono: address.telefono.trim(),
    calle: address.calle.trim(),
    numero: address.numero.trim(),
    piso: trimOptional(address.piso),
    puerta: trimOptional(address.puerta),
    portal: trimOptional(address.portal),
    escalera: trimOptional(address.escalera),
    ciudad: address.ciudad.trim(),
    provincia: address.provincia.trim(),
    codigoPostal: address.codigoPostal.trim(),
    referencias: trimOptional(address.referencias),
  };
}
