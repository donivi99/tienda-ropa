import 'dotenv/config';
import { getAdminDb } from '../config/firebase.js';
import { generateProductoId } from '../services/productoIdService.js';
import { SEED_PRODUCTS, prepareSeedProduct } from '../data/seedProductsData.js';
import type { ProductInput } from '../types/index.js';

const BATCH_SIZE = 500;

async function seedProducts() {
  const db = getAdminDb();
  const collectionRef = db.collection('products');
  const now = new Date().toISOString();

  console.log(`Sembrando ${SEED_PRODUCTS.length} productos...`);

  for (let i = 0; i < SEED_PRODUCTS.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = SEED_PRODUCTS.slice(i, i + BATCH_SIZE);

    for (let j = 0; j < chunk.length; j++) {
      const productoId = await generateProductoId();
      const prepared = prepareSeedProduct(chunk[j] as Omit<ProductInput, 'productoId'>, i + j, productoId);
      const ref = collectionRef.doc();
      batch.set(ref, {
        ...prepared,
        createdBy: 'seed-script',
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
    console.log(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${Math.min(i + BATCH_SIZE, SEED_PRODUCTS.length)} / ${SEED_PRODUCTS.length}`);
  }

  console.log(`\n=== ${SEED_PRODUCTS.length} productos creados correctamente ===\n`);
  process.exit(0);
}

seedProducts().catch((err) => {
  console.error('Error al sembrar productos:', err);
  process.exit(1);
});
