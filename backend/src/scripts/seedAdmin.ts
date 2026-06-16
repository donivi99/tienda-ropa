import 'dotenv/config';
import { getAdminAuth, getAdminDb } from '../config/firebase.js';

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_SEED_NAME || 'Administrador';

async function seedAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Faltan ADMIN_SEED_EMAIL o ADMIN_SEED_PASSWORD en backend/.env');
    process.exit(1);
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
        emailVerified: true,
      });
      console.log(`Usuario admin creado: ${userRecord.uid}`);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
        console.log(`Usuario admin ya existe: ${userRecord.uid}`);
      } else {
        throw err;
      }
    }

    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
    console.log('Custom claims asignados: role=admin');

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: ADMIN_EMAIL,
      nombre: ADMIN_NAME,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('Documento de usuario creado en Firestore');

    console.log('\n=== ADMIN CREADO ===');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log('Contraseña: [oculta]');
    console.log(`UID: ${userRecord.uid}`);
    console.log('Rol: admin');
    console.log('====================\n');
  } catch (err) {
    console.error('Error al crear admin:', err);
    process.exit(1);
  }

  process.exit(0);
}

seedAdmin();
