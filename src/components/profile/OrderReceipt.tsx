import { useRef, useState } from 'react';
import type { CartItem, ShippingAddress } from '../../types';
import { STORE_EMAIL, STORE_NAME } from '../../constants/store';
import { formatDateTime, formatEuro, formatStreetLine } from '../../utils/orderUi';

export interface OrderReceiptData {
  id: string;
  items: CartItem[];
  subtotal?: number;
  shippingFee?: number;
  total: number;
  shippingAddress: ShippingAddress;
  createdAt: string;
  paidAt?: string | null;
  paymentMethod?: string | null;
  stripePaymentIntentId?: string | null;
  paypalCaptureId?: string | null;
  userEmail?: string;
  userName?: string;
}

interface OrderReceiptProps {
  order: OrderReceiptData;
  onClose: () => void;
}

function paymentMethodLabel(method?: string | null): string {
  if (method === 'stripe') return 'Tarjeta (Stripe)';
  if (method === 'paypal') return 'PayPal';
  if (!method) return '—';
  return method;
}

function paymentReference(referenceId?: string | null): string {
  if (!referenceId) return '—';
  if (referenceId.length <= 12) return referenceId;
  return `…${referenceId.slice(-12)}`;
}

export default function OrderReceipt({ order, onClose }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const customerName =
    order.shippingAddress?.nombre || order.userName || 'Cliente';
  const customerEmail = order.userEmail || '—';

  const handleExportPdf = async () => {
    const element = receiptRef.current;
    if (!element) return;

    setExporting(true);
    setExportError('');

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename: `recibo-${order.id.slice(0, 8)}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } catch {
      setExportError('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl border border-[#2a2520] bg-[#141210] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-receipt-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#2a2520] px-6 py-4">
          <h2 id="order-receipt-title" className="font-heading text-lg font-bold text-[#f5e6c8]">
            Mi recibo
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar recibo"
            className="rounded-lg p-1.5 text-[#a89a82] transition-colors hover:bg-[#2a2520] hover:text-[#f5e6c8]"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div
            ref={receiptRef}
            className="rounded-xl bg-[#faf8f4] p-6 text-[#1a1714] shadow-inner"
          >
            <header className="border-b border-[#e8e0d0] pb-4">
              <p className="font-heading text-xl font-bold tracking-wide text-[#0a0a0a]">
                {STORE_NAME}
              </p>
              {STORE_EMAIL && (
                <p className="mt-1 text-xs text-[#5c5348]">{STORE_EMAIL}</p>
              )}
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a7d6a]">
                Comprobante de compra
              </p>
            </header>

            <section className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#5c5348]">Nº pedido</span>
                <span className="break-all text-right font-mono text-xs font-medium">{order.id}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#5c5348]">Fecha pedido</span>
                <span className="text-right">{formatDateTime(order.createdAt)}</span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#5c5348]">Fecha de pago</span>
                  <span className="text-right">{formatDateTime(order.paidAt)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-[#5c5348]">Cliente</span>
                <span className="text-right">{customerName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#5c5348]">Email</span>
                <span className="break-all text-right text-xs">{customerEmail}</span>
              </div>
            </section>

            <section className="mt-4 border-t border-[#e8e0d0] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8a7d6a]">
                Dirección de envío
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                {formatStreetLine(order.shippingAddress)}
                <br />
                {order.shippingAddress.codigoPostal} {order.shippingAddress.ciudad},{' '}
                {order.shippingAddress.provincia}
              </p>
            </section>

            <section className="mt-4 border-t border-[#e8e0d0] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a7d6a]">
                Productos
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8e0d0] text-left text-[0.65rem] uppercase tracking-wider text-[#8a7d6a]">
                    <th className="pb-2 pr-2">Artículo</th>
                    <th className="pb-2 px-1 text-center">Ud.</th>
                    <th className="pb-2 pl-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`} className="border-b border-[#f0ebe3]">
                      <td className="py-2 pr-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-[#8a7d6a]">
                          Talla {item.selectedSize}
                          {item.selectedColor ? ` · ${item.selectedColor}` : ''}
                        </p>
                      </td>
                      <td className="py-2 px-1 text-center tabular-nums">{item.quantity}</td>
                      <td className="py-2 pl-2 text-right tabular-nums font-medium">
                        {formatEuro(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mt-4 space-y-1.5 border-t border-[#e8e0d0] pt-4 text-sm">
              {order.subtotal != null && (
                <div className="flex justify-between text-[#5c5348]">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatEuro(order.subtotal)}</span>
                </div>
              )}
              {order.shippingFee != null && (
                <div className="flex justify-between text-[#5c5348]">
                  <span>Envío</span>
                  <span className="tabular-nums">{formatEuro(order.shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#e8e0d0] pt-2 text-base font-bold">
                <span>Total pagado</span>
                <span className="tabular-nums">{formatEuro(order.total)}</span>
              </div>
            </section>

            <section className="mt-4 border-t border-[#e8e0d0] pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#5c5348]">Método de pago</span>
                <span>{paymentMethodLabel(order.paymentMethod)}</span>
              </div>
              <div className="mt-1 flex justify-between gap-4">
                <span className="text-[#5c5348]">Referencia</span>
                <span className="font-mono text-xs">
                  {paymentReference(
                    order.paymentMethod === 'paypal'
                      ? order.paypalCaptureId
                      : order.stripePaymentIntentId,
                  )}
                </span>
              </div>
            </section>

            <p className="mt-6 text-[0.65rem] leading-relaxed text-[#8a7d6a]">
              Documento acreditativo de la compra. IVA incluido en los precios. No constituye factura.
            </p>
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t border-[#2a2520] px-6 py-4">
          {exportError && (
            <p className="text-center text-sm text-red-400" role="status">
              {exportError}
            </p>
          )}
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExportPdf()}
            className="w-full rounded-lg bg-[#d4af37] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#0a0a0a] transition-colors hover:bg-[#b8962e] disabled:opacity-50"
          >
            {exporting ? 'Generando PDF…' : 'Guardar PDF'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-[#2a2520] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-[#f5e6c8] transition-colors hover:border-[#d4af37]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
