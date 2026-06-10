import { Router } from 'express';
import {
  createOrder,
  getOrdersByUser,
  getOrderById,
  cancelOrder,
} from '../services/orderService.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, validateOrder } from '../middleware/validate.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.post('/', authMiddleware, validate(validateOrder), async (req: AuthRequest, res) => {
  try {
    const order = await createOrder(
      req.user!.uid,
      req.user!.email!,
      req.body.userName || 'Usuario',
      req.body
    );
    res.status(201).json(order);
  } catch {
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const orders = await getOrdersByUser(req.user!.uid);
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const order = await getOrderById(req.params.id as string, req.user!.uid);
    if (!order) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

router.put('/:id/cancel', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await cancelOrder(req.params.id as string, req.user!.uid);
    if (!result) {
      res.status(404).json({ error: 'Pedido no encontrado o no se puede cancelar' });
      return;
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error al cancelar pedido' });
  }
});

export default router;
