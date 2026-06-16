import 'dotenv/config';
import { getAdminDb } from '../config/firebase.js';
import { needsCategoryMigration, normalizeProductCategory } from '../utils/productCategory.js';

const BATCH_SIZE = 500;

async function migrateCategories() {
  const db = getAdminDb();
  const snapshot = await db.collection('products').get();

  const toMigrate = snapshot.docs.filter((doc) => {
    const category = doc.data().category as string | undefined;
    return category && needsCategoryMigration(category);
  });

  console.log(`Productos con categoría legacy: ${toMigrate.length} de ${snapshot.size}`);

  if (toMigrate.length === 0) {
    console.log('Nada que migrar.');
    process.exit(0);
    return;
  }

  for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = toMigrate.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      const category = doc.data().category as string;
      batch.update(doc.ref, {
        category: normalizeProductCategory(category),
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
    console.log(`Migrados ${Math.min(i + BATCH_SIZE, toMigrate.length)} / ${toMigrate.length}`);
  }

  console.log('\n=== Migración de categorías completada ===\n');
  process.exit(0);
}

migrateCategories().catch((err) => {
  console.error('Error al migrar categorías:', err);
  process.exit(1);
});
