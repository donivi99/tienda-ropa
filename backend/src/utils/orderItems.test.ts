import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { OrderItem } from '../types/index.js';
import {
  computeAppliedQuantity,
  syncSingleOrderItemWithStock,
  type StockSyncProduct,
} from './orderItems.js';

function baseItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    productId: 'prod-1',
    name: 'Camiseta',
    price: 19.99,
    selectedSize: 'M',
    selectedColor: 'Negro',
    quantity: 3,
    image: '',
    ...overrides,
  };
}

function baseProduct(overrides: Partial<StockSyncProduct> = {}): StockSyncProduct {
  return {
    name: 'Camiseta',
    price: 19.99,
    discountPercent: 0,
    images: ['https://example.com/img.jpg'],
    sizes: ['M'],
    colors: ['Negro'],
    stock: { M: 5 },
    isActive: true,
    ...overrides,
  };
}

describe('computeAppliedQuantity', () => {
  it('returns requested quantity when stock is enough', () => {
    assert.equal(computeAppliedQuantity(3, 5), 3);
  });

  it('returns available stock when partial', () => {
    assert.equal(computeAppliedQuantity(3, 1), 1);
  });

  it('returns 0 when no stock', () => {
    assert.equal(computeAppliedQuantity(3, 0), 0);
  });
});

describe('syncSingleOrderItemWithStock', () => {
  it('keeps quantity when stock is sufficient', () => {
    const result = syncSingleOrderItemWithStock(baseItem(), baseProduct());
    assert.equal(result.item?.quantity, 3);
    assert.equal(result.adjustment, null);
  });

  it('adjusts quantity to nearest available stock', () => {
    const result = syncSingleOrderItemWithStock(baseItem({ quantity: 3 }), baseProduct({ stock: { M: 1 } }));
    assert.equal(result.item?.quantity, 1);
    assert.deepEqual(result.adjustment, {
      productId: 'prod-1',
      name: 'Camiseta',
      selectedSize: 'M',
      requestedQuantity: 3,
      availableQuantity: 1,
      appliedQuantity: 1,
    });
  });

  it('removes item when stock is zero', () => {
    const result = syncSingleOrderItemWithStock(baseItem({ quantity: 2 }), baseProduct({ stock: { M: 0 } }));
    assert.equal(result.item, null);
    assert.equal(result.adjustment?.appliedQuantity, 0);
  });

  it('throws when product is missing', () => {
    assert.throws(
      () => syncSingleOrderItemWithStock(baseItem(), null),
      /no encontrado/,
    );
  });

  it('throws when product is inactive', () => {
    assert.throws(
      () => syncSingleOrderItemWithStock(baseItem(), baseProduct({ isActive: false })),
      /no disponible/,
    );
  });

  it('throws when size is invalid', () => {
    assert.throws(
      () => syncSingleOrderItemWithStock(baseItem({ selectedSize: 'XL' }), baseProduct()),
      /Talla no válida/,
    );
  });

  it('recalculates price from current product data', () => {
    const result = syncSingleOrderItemWithStock(
      baseItem({ price: 10 }),
      baseProduct({ price: 20, discountPercent: 50 }),
    );
    assert.equal(result.item?.price, 10);
  });
});
