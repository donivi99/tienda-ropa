import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  setUserRole,
  ensureUserProfile,
} from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { getAdminDb, getAdminAuth } from '../config/firebase.js';
import { sanitizeAddress } from '../utils/validation.js';
import { isProtectedAdminEmail } from '../constants/admin.js';
import {
  validate,
  validateCheckEmail,
  validateRegister,
  validateProfileUpdate,
} from '../middleware/validate.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

const checkEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Inténtalo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/check-email', checkEmailLimiter, validate(validateCheckEmail), async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    try {
      await getAdminAuth().getUserByEmail(email.trim());
      res.json({ exists: true });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'auth/user-not-found') {
        res.json({ exists: false });
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('Error al verificar email:', err);
    res.status(500).json({ error: 'Error al verificar email' });
  }
});

router.post('/login', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email requerido' });
      return;
    }

    const profile = await ensureUserProfile(req.user!.uid, email);
    res.json(profile);
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.post('/register', authMiddleware, validate(validateRegister), async (req: AuthRequest, res) => {
  try {
    const { email, nombre } = req.body as { email: string; nombre: string };
    const role = isProtectedAdminEmail(email) ? 'admin' : 'user';
    const user = await registerUser(req.user!.uid, email, nombre.trim(), role);
    res.status(201).json(user);
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await getUserProfile(req.user!.uid);
    if (!profile) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(profile);
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.put('/me', authMiddleware, validate(validateProfileUpdate), async (req: AuthRequest, res) => {
  try {
    const { nombre, phone, address } = req.body;

    const profile = await updateUserProfile(req.user!.uid, {
      nombre: nombre !== undefined ? (nombre as string).trim() : undefined,
      phone: phone !== undefined ? (phone as string).trim() : undefined,
      address: address !== undefined ? sanitizeAddress(address as Record<string, unknown>) : undefined,
    });
    res.json(profile);
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

router.get('/users', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.put('/users/:uid/role', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }

    if (req.user!.uid === req.params.uid) {
      res.status(403).json({ error: 'No puedes cambiar tu propio rol' });
      return;
    }

    const targetDoc = await getAdminDb().collection('users').doc(req.params.uid as string).get();
    if (!targetDoc.exists) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const targetData = targetDoc.data();
    if (isProtectedAdminEmail(targetData?.email as string | undefined)) {
      console.warn(`Intento de cambiar rol del admin principal: uid=${req.user!.uid}, target=${req.params.uid}`);
      res.status(403).json({ error: 'No se puede cambiar el rol del administrador principal' });
      return;
    }

    await setUserRole(req.params.uid as string, role);
    res.json({ message: 'Rol actualizado' });
  } catch (err) {
    console.error('Error al actualizar rol:', err);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

export default router;
