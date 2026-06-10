import type { Response, NextFunction } from 'express';
import { getAdminDb } from '../config/firebase.js';
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

  try {
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      res.status(403).json({ error: 'Acceso denegado. Se requiere rol admin' });
      return;
    }

    req.user.role = 'admin';
    next();
  } catch {
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
}
