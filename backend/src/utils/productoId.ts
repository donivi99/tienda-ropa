const PREFIX = 'TR';
const PAD = 6;

export function formatProductoId(seq: number): string {
  return `${PREFIX}-${String(seq).padStart(PAD, '0')}`;
}

export function parseProductoIdNumber(code: string): number | null {
  if (!code.startsWith(`${PREFIX}-`)) return null;
  const n = parseInt(code.slice(PREFIX.length + 1), 10);
  return Number.isNaN(n) ? null : n;
}

export async function getMaxProductoIdNumber(
  db: FirebaseFirestore.Firestore
): Promise<number> {
  const snapshot = await db.collection('products').get();
  let max = 0;

  for (const doc of snapshot.docs) {
    const code = doc.data().productoId as string | undefined;
    if (!code) continue;
    const n = parseProductoIdNumber(code);
    if (n !== null && n > max) max = n;
  }

  return max;
}
