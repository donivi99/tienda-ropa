import 'dotenv/config';
import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App | null = null;

function getServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin: define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en backend/.env',
    );
  }

  return { projectId, clientEmail, privateKey };
}

function getApp(): App {
  if (!app) {
    app = initializeApp({
      credential: cert(getServiceAccount()),
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
