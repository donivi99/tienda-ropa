import type { Response, NextFunction } from 'express';
import { getAdminAuth } from '../config/firebase.js';
import type { AuthRequest } from '../types/index.js';

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token no proporcionado' });
    return;
  }

  const token = header.split('Bearer ')[1];

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
