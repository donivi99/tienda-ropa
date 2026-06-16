import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { createCreatorMessage } from '../services/contactService.js';
import { validate, validateContactMessage } from '../middleware/validate.js';
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

router.post('/', authMiddleware, contactLimiter, validate(validateContactMessage), async (req: AuthRequest, res) => {
  try {
    const { clientName, message, customRequest } = req.body as {
      clientName: string;
      message: string;
      customRequest?: boolean;
    };

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
