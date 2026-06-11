import 'dotenv/config';
import { getAdminDb } from '../config/firebase.js';
import { formatProductoId, getMaxProductoIdNumber } from '../utils/productoId.js';

const COUNTER_DOC = 'counters/products';
const BATCH_SIZE = 500;

async function migrateProductoIds() {
  const db = getAdminDb();
  const snapshot = await db.collection('products').get();
  const missing = snapshot.docs.filter((doc) => !doc.data().productoId);

  console.log(`Productos sin productoId: ${missing.length} de ${snapshot.size}`);

  if (missing.length === 0) {
    const max = await getMaxProductoIdNumber(db);
    await db.doc(COUNTER_DOC).set({ last: max }, { merge: true });
    console.log(`Contador sincronizado en ${max}. Nada que migrar.`);
    return;
  }

  let next = (await getMaxProductoIdNumber(db)) + 1;

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = missing.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      batch.update(doc.ref, { productoId: formatProductoId(next) });
      next += 1;
    }

    await batch.commit();
    console.log(`Asignados ${Math.min(i + BATCH_SIZE, missing.length)} / ${missing.length}`);
  }

  const finalMax = next - 1;
  await db.doc(COUNTER_DOC).set({ last: finalMax }, { merge: true });
  console.log(`Migración completada. Contador en ${finalMax}.`);
}

migrateProductoIds().catch((err) => {
  console.error(err);
  process.exit(1);
});
