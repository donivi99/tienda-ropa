import type { Product } from '../types';
import ProductCard from './ProductCard';

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-white/8 bg-[#12100e] px-6 py-16 text-center shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
        <p className="text-lg text-[#f5e6c8]">No se encontraron productos.</p>
        <p className="mt-2 text-sm text-[#a89a82]">Prueba con otro filtro o amplía la franja de precio.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-7">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
