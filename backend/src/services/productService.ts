import { getAdminDb } from '../config/firebase.js';
import type { ProductInput } from '../types/index.js';

export async function getAllProducts(filters?: {
  genero?: string;
  tipo?: string;
  category?: string;
}) {
  const db = getAdminDb();
  let query: FirebaseFirestore.Query = db.collection('products');

  if (filters?.genero) query = query.where('genero', '==', filters.genero);
  if (filters?.tipo) query = query.where('tipo', '==', filters.tipo);
  if (filters?.category) query = query.where('category', '==', filters.category);

  const snapshot = await query.orderBy('price', 'asc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getProductById(id: string) {
  const db = getAdminDb();
  const doc = await db.collection('products').doc(id).get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function createProduct(data: ProductInput, createdBy: string) {
  const db = getAdminDb();
  const docRef = await db.collection('products').add({
    ...data,
    isActive: true,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { id: docRef.id, ...data };
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  const db = getAdminDb();
  const docRef = db.collection('products').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) return null;

  await docRef.update({
    ...data,
    updatedAt: new Date().toISOString(),
  });

  return { id, ...doc.data(), ...data };
}

export async function deleteProduct(id: string) {
  const db = getAdminDb();
  const docRef = db.collection('products').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) return false;

  await docRef.delete();
  return true;
}

export async function toggleProductActive(id: string) {
  const db = getAdminDb();
  const docRef = db.collection('products').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) return null;

  const current = doc.data()?.isActive ?? true;
  await docRef.update({
    isActive: !current,
    updatedAt: new Date().toISOString(),
  });

  return { id, isActive: !current };
}

export async function getProductsByUser(uid: string) {
  const db = getAdminDb();
  const snapshot = await db
    .collection('products')
    .where('createdBy', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
