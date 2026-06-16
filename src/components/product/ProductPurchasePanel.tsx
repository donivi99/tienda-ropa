import type { Product } from '../../types';
import { getColorStyle } from '../../utils/colorMap';
import ProductPrice, { ProductCardMeta } from '../ProductPrice';
import ProductTrustBadges from './ProductTrustBadges';

interface ProductPurchasePanelProps {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  stockForSize: number;
  totalStock: number;
  canAdd: boolean;
  added: boolean;
  ctaHint: string;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onAdd: () => void;
  showDescription?: boolean;
  compact?: boolean;
}

export default function ProductPurchasePanel({
  product,
  selectedSize,
  selectedColor,
  stockForSize,
  totalStock,
  canAdd,
  added,
  ctaHint,
  onSizeChange,
  onColorChange,
  onAdd,
  showDescription = true,
  compact = false,
}: ProductPurchasePanelProps) {
  const isOutOfStock = totalStock === 0;

  return (
    <div className={`space-y-6 ${compact ? '' : 'lg:sticky lg:top-24 lg:self-start'}`}>
      <div className="space-y-3">
        <ProductCardMeta genero={product.genero} tipo={product.tipo} category={product.category} />
        <h1
          className="text-3xl font-bold leading-tight text-[#f5e6c8] md:text-4xl"
          style={{ fontFamily: '"Bodoni Moda", serif' }}
        >
          {product.name}
        </h1>
        {product.productoId && (
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#a89a82]">
            Ref. {product.productoId}
          </p>
        )}
        <ProductPrice
          price={product.price}
          discountPercent={product.discountPercent}
          size="lg"
          layout="inline"
        />
      </div>

      {showDescription && (
        <div className="border-t border-[#2a2520] pt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
            Descripción
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-[#a89a82]">{product.description}</p>
        </div>
      )}

      <fieldset className="border-t border-[#2a2520] pt-6" disabled={isOutOfStock}>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5e6c8]">
          Color
          {selectedColor && (
            <span className="ml-2 font-normal normal-case tracking-normal text-[#a89a82]">
              — {selectedColor}
            </span>
          )}
        </legend>
        <div className="flex flex-wrap gap-3">
          {product.colors.map((color) => {
            const selected = selectedColor === color;
            return (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                aria-label={`Color ${color}`}
                aria-pressed={selected}
                title={color}
                className={`rounded-full p-0.5 transition-all ${
                  selected
                    ? 'ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#0a0a0a]'
                    : 'ring-1 ring-[#2a2520] hover:ring-[#d4af37]/50'
                }`}
              >
                <span
                  className="block h-9 w-9 rounded-full border border-[#2a2520]/80 shadow-sm"
                  style={getColorStyle(color)}
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-t border-[#2a2520] pt-6" disabled={isOutOfStock}>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5e6c8]">
          Talla
        </legend>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((size) => {
            const stock = product.stock[size] ?? 0;
            const unavailable = stock === 0;
            const selected = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => onSizeChange(size)}
                disabled={unavailable}
                aria-label={unavailable ? `Talla ${size}, agotada` : `Talla ${size}`}
                aria-pressed={selected}
                className={`min-w-[3rem] rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  selected
                    ? 'border-[#d4af37] bg-[#d4af37] text-[#0a0a0a]'
                    : unavailable
                      ? 'cursor-not-allowed border-[#1e1b18] text-[#3d3830] line-through'
                      : 'border-[#2a2520] text-[#f5e6c8] hover:border-[#d4af37]/60'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
        {selectedSize && (
          <p
            className={`mt-2 text-xs ${
              stockForSize <= 0
                ? 'text-red-400'
                : stockForSize <= 5
                  ? 'text-amber-400'
                  : 'text-[#a89a82]'
            }`}
          >
            {stockForSize <= 0
              ? 'Sin stock en esta talla'
              : stockForSize <= 5
                ? `¡Solo quedan ${stockForSize}!`
                : `${stockForSize} unidades disponibles`}
          </p>
        )}
      </fieldset>

      <div className={compact ? '' : 'hidden lg:block'}>
        <AddToCartButton canAdd={canAdd} added={added} ctaHint={ctaHint} onAdd={onAdd} />
        {!compact && (
          <div className="mt-6">
            <ProductTrustBadges />
          </div>
        )}
      </div>
    </div>
  );
}

export function AddToCartButton({
  canAdd,
  added,
  ctaHint,
  onAdd,
  className = '',
}: {
  canAdd: boolean;
  added: boolean;
  ctaHint: string;
  onAdd: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all ${
          canAdd
            ? 'bg-[#d4af37] text-[#0a0a0a] hover:bg-[#b8962e] hover:shadow-[0_8px_30px_rgba(212,175,55,0.25)]'
            : 'cursor-not-allowed bg-[#1e1b18] text-[#5f574d]'
        }`}
      >
        {added ? (
          <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Agregado al carrito
          </>
        ) : canAdd ? (
          'Agregar al carrito'
        ) : (
          ctaHint
        )}
      </button>
    </div>
  );
}
