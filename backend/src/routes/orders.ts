import { Router } from 'express';
import {
  createOrder,
  getOrdersByUser,
  getOrderById,
  cancelOrder,
} from '../services/orderService.js';
import { releaseStripePaymentForOrder } from '../services/paymentService.js';
import { isOrderPaymentReleasable } from '../utils/stripePayment.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, validateOrder } from '../middleware/validate.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.post('/', authMiddleware, validate(validateOrder), async (req: AuthRequest, res) => {
  try {
    if (!req.user?.email) {
      res.status(400).json({ error: 'El usuario no tiene email asociado' });
      return;
    }

    const order = await createOrder(
      req.user!.uid,
      req.user.email,
      req.body.userName || 'Usuario',
      req.body
    );
    res.status(201).json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear pedido';
    res.status(500).json({ error: message });
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
    const orderId = req.params.id as string;
    const result = await cancelOrder(orderId, req.user!.uid);
    if (!result) {
      res.status(404).json({ error: 'Pedido no encontrado o no se puede cancelar' });
      return;
    }
    if (isOrderPaymentReleasable(result.previousStatus)) {
      await releaseStripePaymentForOrder(orderId);
    }
    res.json({ id: result.id, status: result.status });
  } catch {
    res.status(500).json({ error: 'Error al cancelar pedido' });
  }
});

export default router;
