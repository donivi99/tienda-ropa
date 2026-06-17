/** Precio de venta con descuento; debe coincidir con la lógica del frontend (getEffectivePrice). */
export function getEffectivePrice(price: number, discountPercent?: number): number {
  if (!discountPercent || discountPercent <= 0) return price;
  return Math.round((price - (price * discountPercent) / 100) * 100) / 100;
}

/** Convierte euros a céntimos para Stripe (entero, sin floats). */
export function eurosToStripeCents(amount: number): number {
  return Math.round(amount * 100);
}
