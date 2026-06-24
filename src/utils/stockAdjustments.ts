import type { CartItem, ShippingAddress } from '../types';

export interface StockAdjustment {
  productId: string;
  name: string;
  selectedSize: string;
  requestedQuantity: number;
  availableQuantity: number;
  appliedQuantity: number;
}

export interface OrderQuantitySummary {
  requestedTotal: number;
  appliedTotal: number;
}

export interface SyncPaymentResponse {
  order: {
    id: string;
    items: CartItem[];
    subtotal: number;
    shippingFee: number;
    total: number;
    shippingAddress: ShippingAddress;
  };
  adjustments: StockAdjustment[];
  quantitySummary?: OrderQuantitySummary;
}

/** @deprecated Usar SyncPaymentResponse + endpoints por proveedor */
export interface PreparePaymentResponse extends SyncPaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export function hasStockQuantityChanges(
  adjustments: StockAdjustment[],
  quantitySummary?: OrderQuantitySummary,
): boolean {
  return (
    adjustments.length > 0 ||
    (quantitySummary != null && quantitySummary.requestedTotal !== quantitySummary.appliedTotal)
  );
}

export function formatStockAdjustmentConfirmMessage(
  adjustments: StockAdjustment[],
  quantitySummary?: OrderQuantitySummary,
): string {
  const lines: string[] = ['El stock ha cambiado desde que creaste este pedido.'];

  if (quantitySummary && quantitySummary.requestedTotal !== quantitySummary.appliedTotal) {
    lines.push(
      `Vas a comprar ${quantitySummary.appliedTotal} prenda(s) en lugar de las ${quantitySummary.requestedTotal} que pediste.`,
    );
  }

  for (const adjustment of adjustments) {
    if (adjustment.appliedQuantity === 0) {
      lines.push(
        `${adjustment.name} (talla ${adjustment.selectedSize}): pediste ${adjustment.requestedQuantity}, pero ya no queda stock.`,
      );
    } else if (adjustment.requestedQuantity !== adjustment.appliedQuantity) {
      lines.push(
        `${adjustment.name} (talla ${adjustment.selectedSize}): pediste ${adjustment.requestedQuantity}, ahora quedan ${adjustment.availableQuantity}; actualizado a ${adjustment.appliedQuantity}.`,
      );
    }
  }

  lines.push('', '¿Quieres continuar con el pago?');
  return lines.join('\n');
}
