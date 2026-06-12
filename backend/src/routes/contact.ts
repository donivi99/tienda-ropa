import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { createCreatorMessage } from '../services/contactService.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados mensajes. Inténtalo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const authReq = req as AuthRequest;
    return authReq.user?.uid ?? req.ip ?? 'anonymous';
  },
});

router.post('/', authMiddleware, contactLimiter, async (req: AuthRequest, res) => {
  try {
    const { clientName, message, customRequest } = req.body;

    if (!clientName || typeof clientName !== 'string' || clientName.trim().length < 2 || clientName.length > 100) {
      res.status(400).json({ error: 'Nombre inválido (2-100 caracteres)' });
      return;
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.length > 2000) {
      res.status(400).json({ error: 'Mensaje inválido (10-2000 caracteres)' });
      return;
    }

    const email = req.user?.email;
    if (!email) {
      res.status(400).json({ error: 'El usuario no tiene email asociado' });
      return;
    }

    const result = await createCreatorMessage(req.user!.uid, {
      clientName,
      email,
      message,
      customRequest: Boolean(customRequest),
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
});

export default router;
