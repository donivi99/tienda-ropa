import { Router } from 'express';
import { registerUser, getUserProfile, updateUserProfile, getAllUsers, setUserRole } from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    if (!email || !password || !nombre) {
      res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
      return;
    }
    const user = await registerUser(email, password, nombre);
    res.status(201).json(user);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'auth/email-already-exists') {
      res.status(400).json({ error: 'Este email ya está registrado' });
    } else {
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
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
  } catch {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.put('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { nombre, phone, address } = req.body;
    const profile = await updateUserProfile(req.user!.uid, { nombre, phone, address });
    res.json(profile);
  } catch {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

router.get('/users', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

export default router;
