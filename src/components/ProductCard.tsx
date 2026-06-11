import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { getColorStyle, getEffectivePrice } from '../utils/colorMap';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const totalStock = Object.values(product.stock).reduce((sum, s) => sum + s, 0);
  const isOutOfStock = totalStock === 0;

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group block rounded-[1.5rem] overflow-hidden border border-[#2a2520] bg-[#11100e] shadow-[0_18px_50px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-1 hover:border-[#d4af37]/45 hover:shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#1e1b18]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/88 via-[#0a0a0a]/15 to-transparent" />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="rounded-full border border-[#d4af37] bg-[#0a0a0a] px-3 py-1 text-sm font-medium text-[#f5e6c8]">
              Agotado
            </span>
          </div>
        )}
        {!isOutOfStock && totalStock <= 5 && (
          <span className="absolute left-4 top-4 rounded-full bg-[#d4af37] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#0a0a0a] shadow-lg shadow-black/20">
            Últimas unidades
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-[#f5e6c8]">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#f5e6c8]/90 backdrop-blur-md">
              {product.genero}
            </span>
            <div className="flex items-center gap-2">
              {product.discountPercent ? (
                <>
                  <span className="text-xs text-[#a89a82] line-through">${product.price.toFixed(2)}</span>
                  <span className="text-lg font-semibold text-[#d4af37]">${getEffectivePrice(product.price, product.discountPercent).toFixed(2)}</span>
                </>
              ) : (
                <span className="text-lg font-semibold text-[#d4af37]">${product.price.toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex rounded-full border border-[#2a2520] bg-[#141210] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-[#d4af37]">
            {product.category}
          </span>
          <span className="text-xs capitalize tracking-wide text-[#a89a82]">{product.tipo}</span>
        </div>
        <h3 className="text-[1.02rem] leading-tight font-medium text-[#f5e6c8] group-hover:text-white transition-colors">
          {product.name}
        </h3>
        <p className="max-h-12 overflow-hidden text-sm leading-6 text-[#a89a82]">
          {product.description}
        </p>
        <div className="flex gap-1 mt-2">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color}
              className="h-3.5 w-3.5 rounded-full border border-[#2a2520] shadow-sm shadow-black/20"
              title={color}
              style={getColorStyle(color)}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}
