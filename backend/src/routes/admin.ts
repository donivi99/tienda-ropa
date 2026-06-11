import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { getAllUsers } from '../services/authService.js';
import { getAllOrders, updateOrderStatus, getDashboardStats, getOrderById } from '../services/orderService.js';
import { toggleProductActive } from '../services/productService.js';

const router = Router();

router.get('/dashboard', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
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

router.get('/orders', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

router.get('/orders/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const order = await getOrderById(req.params.id as string);
    if (!order) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

router.put('/orders/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pagado', 'enviado', 'entregado', 'cancelado'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Estado inválido' });
      return;
    }
    const result = await updateOrderStatus(req.params.id as string, status);
    if (!result) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

router.put('/products/:id/active', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await toggleProductActive(req.params.id as string);
    if (!result) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error al cambiar estado del producto' });
  }
});

export default router;
