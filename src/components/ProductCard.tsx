import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { getColorStyle } from '../utils/colorMap';
import { hasActiveDiscount } from '../utils/productFilters';
import ProductPrice, { DiscountBadge, ProductCardMeta } from './ProductPrice';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const totalStock = Object.values(product.stock).reduce((sum, s) => sum + s, 0);
  const isOutOfStock = totalStock === 0;
  const onSale = hasActiveDiscount(product);

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[#2a2520] bg-[#11100e] shadow-[0_18px_50px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-1 hover:border-[#d4af37]/45 hover:shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
    >
      <div className="relative aspect-[3/4] shrink-0 overflow-hidden bg-[#1e1b18]">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/20" />

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full border border-[#d4af37] bg-[#0a0a0a] px-3 py-1 text-sm font-medium text-[#f5e6c8]">
              Agotado
            </span>
          </div>
        )}

        {onSale && (
          <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
            <DiscountBadge percent={product.discountPercent!} variant="solid" />
          </div>
        )}

        {!isOutOfStock && totalStock <= 5 && (
          <span className="absolute bottom-3 left-3 rounded-full border border-[#d4af37]/50 bg-[#0a0a0a]/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#d4af37] shadow-[0_4px_16px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:bottom-4 sm:left-4 sm:text-[10px]">
            Últimas unidades
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-[#2a2520] bg-[#11100e] p-4 pt-3.5">
        <ProductCardMeta genero={product.genero} tipo={product.tipo} category={product.category} />

        <h3 className="line-clamp-2 text-[1.02rem] font-medium leading-snug text-[#f5e6c8] transition-colors group-hover:text-white">
          {product.name}
        </h3>

        <ProductPrice
          price={product.price}
          discountPercent={product.discountPercent}
          size="sm"
          layout="card"
        />

        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-[#a89a82]">{product.description}</p>

        <div className="mt-auto flex gap-1.5 border-t border-[#2a2520]/80 pt-3">
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
