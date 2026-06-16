export const PROTECTED_ADMIN_EMAIL = 'admin@tiendaropa.com';

export function isProtectedAdminEmail(email: string | undefined | null): boolean {
  if (!email?.trim()) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PROTECTED_ADMIN_EMAIL) return true;
  const envEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  return !!envEmail && normalized === envEmail;
}

export function getProtectedAdminEmail(): string {
  return process.env.ADMIN_SEED_EMAIL?.trim() || PROTECTED_ADMIN_EMAIL;
}
