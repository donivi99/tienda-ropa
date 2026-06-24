import { getEffectivePrice } from '../utils/colorMap';
import { formatProductCategoryLabel } from '../utils/productFilters';

interface ProductPriceProps {
  price: number;
  discountPercent?: number;
  /** sm = tarjeta catálogo, lg = ficha de producto */
  size?: 'sm' | 'lg';
  /** card = fila horizontal en tarjeta; inline = ficha de producto con badge */
  layout?: 'card' | 'inline';
  className?: string;
}

export function DiscountBadge({
  percent,
  variant = 'solid',
  className = '',
}: {
  percent: number;
  variant?: 'solid' | 'soft';
  className?: string;
}) {
  const styles =
    variant === 'solid'
      ? 'border border-[#d4af37]/80 bg-[#0a0a0a] text-[#d4af37] shadow-[0_4px_20px_rgba(0,0,0,0.55)] ring-1 ring-black/40'
      : 'border border-[#d4af37]/35 bg-[#141210] text-[#d4af37]';

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.24em] backdrop-blur-sm ${styles} ${className}`}
    >
      −{percent}%
    </span>
  );
}

export default function ProductPrice({
  price,
  discountPercent,
  size = 'sm',
  layout = 'inline',
  className = '',
}: ProductPriceProps) {
  const hasDiscount = discountPercent != null && discountPercent > 0;
  const salePrice = getEffectivePrice(price, discountPercent);

  const saleClass =
    size === 'lg'
      ? 'text-2xl font-bold text-[#d4af37] sm:text-3xl'
      : 'text-[1.125rem] font-semibold leading-none text-[#d4af37]';

  const originalClass =
    size === 'lg'
      ? 'text-base text-[#5f574d] line-through sm:text-lg'
      : 'text-sm text-[#5f574d] line-through';

  if (!hasDiscount) {
    return (
      <p className={`${saleClass} tabular-nums ${className}`} aria-label={`Precio ${price.toFixed(2)} euros`}>
        {price.toFixed(2)}€
      </p>
    );
  }

  if (layout === 'card') {
    return (
      <div
        className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 ${className}`}
        aria-label={`Precio rebajado ${salePrice.toFixed(2)} euros, antes ${price.toFixed(2)} euros`}
      >
        <span className={`${saleClass} tabular-nums`}>{salePrice.toFixed(2)}€</span>
        <span className={`${originalClass} tabular-nums`}>{price.toFixed(2)}€</span>
      </div>
    );
  }

  return (
    <div
      className={`flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 ${className}`}
      aria-label={`Precio rebajado ${salePrice.toFixed(2)} euros, antes ${price.toFixed(2)} euros, descuento ${discountPercent} por ciento`}
    >
      <span className={`${saleClass} tabular-nums`}>{salePrice.toFixed(2)}€</span>
      <span className={`${originalClass} tabular-nums`}>{price.toFixed(2)}€</span>
      <DiscountBadge percent={discountPercent} variant="soft" />
    </div>
  );
}

function formatCategoryLabel(category: string) {
  return formatProductCategoryLabel(category);
}

export function ProductCardMeta({
  genero,
  tipo,
  category,
  className = '',
}: {
  genero: string;
  tipo: string;
  category: string;
  className?: string;
}) {
  return (
    <p
      className={`text-[0.65rem] uppercase leading-[1.6] tracking-[0.16em] text-[#a89a82] ${className}`}
    >
      <span className="text-[#f5e6c8]/75">{genero}</span>
      <span aria-hidden className="mx-1.5 text-[#3d3830]">·</span>
      <span>{tipo}</span>
      <span aria-hidden className="mx-1.5 text-[#3d3830]">·</span>
      <span className="text-[#d4af37]/75">{formatCategoryLabel(category)}</span>
    </p>
  );
}
