import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  getProductsByUser,
} from '../services/productService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { validate, validateProduct } from '../middleware/validate.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { genero, tipo, category } = req.query;
    const products = await getAllProducts({
      genero: genero as string,
      tipo: tipo as string,
      category: category as string,
    });
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/my-products', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const products = await getProductsByUser(req.user!.uid);
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id as string);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

router.post('/', authMiddleware, adminMiddleware, validate(validateProduct), async (req: AuthRequest, res) => {
  try {
    const product = await createProduct(req.body, req.user!.uid);
    res.status(201).json(product);
  } catch {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const product = await updateProduct(req.params.id as string, req.body);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const deleted = await deleteProduct(req.params.id as string);
    if (!deleted) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json({ message: 'Producto eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

router.put('/:id/active', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await toggleProductActive(req.params.id as string);
    if (!result) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

export default router;
