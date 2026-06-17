import type { OrderStatus } from '../types/index.js';

const ADMIN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pendiente_pago: ['cancelado'],
  pago_fallido: ['cancelado'],
  reembolsado: ['cancelado'],
  reembolso_pendiente: ['cancelado'],
  pagado: ['enviado', 'entregado', 'cancelado'],
  enviado: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};

export function isAdminOrderTransitionAllowed(
  current: string | undefined,
  next: OrderStatus,
): boolean {
  if (!current) return false;
  const allowed = ADMIN_TRANSITIONS[current as OrderStatus];
  return Boolean(allowed?.includes(next));
}

export function getAdminAllowedStatuses(current: string | undefined): OrderStatus[] {
  if (!current) return [];
  return ADMIN_TRANSITIONS[current as OrderStatus] ?? [];
}

export function isAdminCancelWithStockRestore(previousStatus: string | undefined): boolean {
  return previousStatus === 'pagado' || previousStatus === 'enviado';
}
