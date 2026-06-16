import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { getAdminUsersWithStats, getAdminUserDetail } from '../services/authService.js';
import { getAllOrders, updateOrderStatus, getDashboardStats, getOrderById } from '../services/orderService.js';
import { toggleProductActive, getAllProductsAdmin } from '../services/productService.js';
import { getProtectedAdminEmail } from '../constants/admin.js';

const router = Router();

router.get('/dashboard', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const cursor = req.query.cursor as string | undefined;
    const result = await getAdminUsersWithStats(
      limit || cursor ? { limit, cursor } : undefined
    );
    res.json({ ...result, adminEmail: getProtectedAdminEmail() });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.get('/users/:uid', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await getAdminUserDetail(req.params.uid as string);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

router.get('/products', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const products = await getAllProductsAdmin();
    res.json(products);
  } catch (err) {
    console.error('Error al obtener productos admin:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const cursor = req.query.cursor as string | undefined;
    const result = await getAllOrders({ limit, cursor });
    res.json(result);
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
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
  } catch (err) {
    console.error('Error al obtener pedido:', err);
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
  } catch (err) {
    console.error('Error al actualizar pedido:', err);
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
  } catch (err) {
    console.error('Error al cambiar estado del producto:', err);
    res.status(500).json({ error: 'Error al cambiar estado del producto' });
  }
});

export default router;
