import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasStockQuantityChanges,
  formatStockAdjustmentConfirmMessage,
} from './stockAdjustments';

describe('hasStockQuantityChanges', () => {
  it('returns true when adjustments exist', () => {
    assert.equal(
      hasStockQuantityChanges([
        {
          productId: 'p1',
          name: 'Camiseta',
          selectedSize: 'M',
          requestedQuantity: 3,
          availableQuantity: 1,
          appliedQuantity: 1,
        },
      ]),
      true,
    );
  });

  it('returns true when quantity summary differs', () => {
    assert.equal(hasStockQuantityChanges([], { requestedTotal: 3, appliedTotal: 1 }), true);
  });

  it('returns false when nothing changed', () => {
    assert.equal(hasStockQuantityChanges([], { requestedTotal: 2, appliedTotal: 2 }), false);
  });
});

describe('formatStockAdjustmentConfirmMessage', () => {
  it('includes total garment summary', () => {
    const message = formatStockAdjustmentConfirmMessage(
      [
        {
          productId: 'p1',
          name: 'Camiseta',
          selectedSize: 'M',
          requestedQuantity: 3,
          availableQuantity: 1,
          appliedQuantity: 1,
        },
      ],
      { requestedTotal: 3, appliedTotal: 1 },
    );

    assert.match(message, /las 3 que pediste/);
    assert.match(message, /1 prenda/);
    assert.match(message, /Camiseta/);
  });
});
