import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let app: App | null = null;

function getApp(): App {
  if (!app) {
    const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

    app = initializeApp({
      credential: cert(serviceAccount),
    });
  }
  return app;
}

export function getAdminAuth() {
  return getAuth(getApp());
}

export function getAdminDb() {
  return getFirestore(getApp());
}
