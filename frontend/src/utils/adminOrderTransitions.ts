export const ADMIN_ORDER_STATUS_LABELS: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  pago_fallido: 'Pago fallido',
  reembolsado: 'Reembolsado',
  reembolso_pendiente: 'Reembolso pendiente',
};

const ADMIN_TRANSITIONS: Record<string, string[]> = {
  pendiente_pago: ['cancelado'],
  pago_fallido: ['cancelado'],
  reembolsado: ['cancelado'],
  reembolso_pendiente: ['cancelado'],
  pagado: ['enviado', 'entregado', 'cancelado'],
  enviado: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};

export function getAdminAllowedStatuses(current: string): string[] {
  return ADMIN_TRANSITIONS[current] ?? [];
}

/** Opciones del desplegable admin: estado actual + transiciones permitidas. */
export function getAdminStatusSelectOptions(current: string): { value: string; label: string }[] {
  const allowed = getAdminAllowedStatuses(current);
  const values = new Set([current, ...allowed]);
  return [...values].map((value) => ({
    value,
    label: ADMIN_ORDER_STATUS_LABELS[value] ?? value,
  }));
}

export function adminStatusLabel(status: string): string {
  return ADMIN_ORDER_STATUS_LABELS[status] ?? status;
}
