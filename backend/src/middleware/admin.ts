import type { Response, NextFunction } from 'express';
import { getAdminAuth, getAdminDb } from '../config/firebase.js';
import type { AuthRequest } from '../types/index.js';

export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (req.user.role === 'admin') {
    next();
    return;
  }

  try {
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      res.status(403).json({ error: 'Acceso denegado. Se requiere rol admin' });
      return;
    }

    const auth = getAdminAuth();
    await auth.setCustomUserClaims(req.user.uid, { role: 'admin' });
    req.user.role = 'admin';
    next();
  } catch (err) {
    console.error('Error al verificar permisos admin:', err);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
}
