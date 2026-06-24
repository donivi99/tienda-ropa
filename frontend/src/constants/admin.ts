export const PROTECTED_ADMIN_EMAIL = 'admin@tiendaropa.com';

export function isProtectedAdminEmail(email: string | undefined | null, serverAdminEmail?: string): boolean {
  if (!email?.trim()) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PROTECTED_ADMIN_EMAIL) return true;
  return !!serverAdminEmail && normalized === serverAdminEmail.trim().toLowerCase();
}

export function formatPendingOrdersLabel(count: number): string {
  return count === 1 ? '1 pedido pendiente' : `${count} pedidos pendientes`;
}
