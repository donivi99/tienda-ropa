import { getAdminDb } from '../config/firebase.js';
import { formatProductoId, getMaxProductoIdNumber } from '../utils/productoId.js';

const COUNTER_DOC = 'counters/products';

async function ensureProductoIdCounter(): Promise<void> {
  const db = getAdminDb();
  const counterRef = db.doc(COUNTER_DOC);
  const snap = await counterRef.get();

  if (snap.exists && typeof snap.data()?.last === 'number') return;

  const max = await getMaxProductoIdNumber(db);
  await counterRef.set({ last: max }, { merge: true });
}

export async function generateProductoId(): Promise<string> {
  const db = getAdminDb();
  const counterRef = db.doc(COUNTER_DOC);

  await ensureProductoIdCounter();

  return db.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const last = counterSnap.data()?.last as number;
    const next = last + 1;
    const productoId = formatProductoId(next);
    tx.update(counterRef, { last: next });
    return productoId;
  });
}
