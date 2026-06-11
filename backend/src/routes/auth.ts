import { Router } from 'express';
import { registerUser, getUserProfile, updateUserProfile, getAllUsers, setUserRole } from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { getAdminAuth } from '../config/firebase.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CP_REGEX = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;

router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ error: 'Email válido requerido' });
      return;
    }
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

router.post('/register', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { email, nombre } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email válido es requerido' });
      return;
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 100) {
      res.status(400).json({ error: 'Nombre inválido (2-100 caracteres)' });
      return;
    }
    const user = await registerUser(req.user!.uid, email, nombre.trim());
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

router.put('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { nombre, phone, address } = req.body;

    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.trim().length < 6) {
        res.status(400).json({ error: 'Teléfono inválido (mínimo 6 caracteres)' });
        return;
      }
    }

    if (address !== undefined && address !== null) {
      if (typeof address !== 'object') {
        res.status(400).json({ error: 'Dirección inválida' });
        return;
      }
      if (address.calle && (typeof address.calle !== 'string' || address.calle.trim().length < 3)) {
        res.status(400).json({ error: 'Calle inválida (mínimo 3 caracteres)' });
        return;
      }
      if (address.ciudad && (typeof address.ciudad !== 'string' || address.ciudad.trim().length < 2)) {
        res.status(400).json({ error: 'Ciudad inválida (mínimo 2 caracteres)' });
        return;
      }
      if (address.provincia && (typeof address.provincia !== 'string' || address.provincia.trim().length < 2)) {
        res.status(400).json({ error: 'Provincia inválida (mínimo 2 caracteres)' });
        return;
      }
      if (address.codigoPostal && (typeof address.codigoPostal !== 'string' || !CP_REGEX.test(address.codigoPostal.trim()))) {
        res.status(400).json({ error: 'Código postal inválido' });
        return;
      }
    }

    const profile = await updateUserProfile(req.user!.uid, { nombre, phone, address });
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

router.put('/users/:uid/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Rol inválido' });
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
