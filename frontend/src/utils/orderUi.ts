import type { ShippingAddress } from '../types';

export const ORDER_STATUS_TONES: Record<string, string> = {
  pendiente_pago: 'border-[#a89a82]/40 bg-[#2a2520] text-[#c9bfb0]',
  pagado: 'border-[#d4af37]/45 bg-[#d4af37]/14 text-[#e8c96a]',
  enviado: 'border-[#6a9fb5]/40 bg-[#4a7080]/20 text-[#9ec4d4]',
  entregado: 'border-[#6b9e7a]/40 bg-[#4a7058]/20 text-[#a8d4b4]',
  cancelado: 'border-[#b87a7a]/40 bg-[#704848]/20 text-[#d4a8a8]',
  pago_fallido: 'border-[#b87a7a]/40 bg-[#704848]/20 text-[#d4a8a8]',
  reembolsado: 'border-[#b87a7a]/40 bg-[#704848]/20 text-[#d4a8a8]',
  reembolso_pendiente: 'border-[#c9a227]/40 bg-[#705820]/20 text-[#e8c96a]',
};

const STATUS_LABELS: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  pago_fallido: 'Pago fallido',
  reembolsado: 'Reembolsado',
  reembolso_pendiente: 'Reembolso pendiente',
};

export function statusBadgeClass(status: string) {
  return ORDER_STATUS_TONES[status] ?? 'border-[#2a2520] bg-[#1e1b18] text-[#a89a82]';
}

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatEuro(amount: number) {
  return `${amount.toFixed(2)} €`;
}

export function shortOrderId(id: string) {
  return id.length > 8 ? `#${id.slice(0, 8)}…` : `#${id}`;
}

export function formatStreetLine(addr: Pick<ShippingAddress, 'calle' | 'numero'>): string {
  const calle = addr.calle?.trim() ?? '';
  const numero = addr.numero?.trim() ?? '';
  if (calle && numero) return `${calle}, ${numero}`;
  return calle || numero;
}

export function formatAddressDetails(
  addr: Pick<ShippingAddress, 'portal' | 'escalera' | 'piso' | 'puerta'>
): string | null {
  const parts: string[] = [];
  if (addr.portal?.trim()) parts.push(`Portal ${addr.portal.trim()}`);
  if (addr.escalera?.trim()) parts.push(`Esc. ${addr.escalera.trim()}`);
  if (addr.piso?.trim()) parts.push(`Piso ${addr.piso.trim()}`);
  if (addr.puerta?.trim()) parts.push(`Puerta ${addr.puerta.trim()}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function formatAddress(addr: ShippingAddress) {
  const lines = [
    `${addr.nombre} · ${addr.telefono}`,
    formatStreetLine(addr),
  ];
  const details = formatAddressDetails(addr);
  if (details) lines.push(details);
  lines.push(`${addr.codigoPostal} ${addr.ciudad}, ${addr.provincia}`);
  if (addr.referencias?.trim()) lines.push(addr.referencias.trim());
  return lines.join('\n');
}
