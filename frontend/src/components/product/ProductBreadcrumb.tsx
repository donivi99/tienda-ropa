import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { formatCategoryLabel, getCategoryCollectionPath, getGeneroLabel } from '../../utils/productRoutes';

interface ProductBreadcrumbProps {
  product: Product;
}

export default function ProductBreadcrumb({ product }: ProductBreadcrumbProps) {
  const collectionPath = getCategoryCollectionPath(product.genero);
  const generoLabel = getGeneroLabel(product.genero);
  const categoryLabel = formatCategoryLabel(product.category);

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs uppercase tracking-[0.16em] text-[#a89a82]">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link to="/" className="transition-colors hover:text-[#f5e6c8]">
            Inicio
          </Link>
        </li>
        <li aria-hidden className="text-[#3d3830]">/</li>
        <li>
          <Link to={collectionPath} className="transition-colors hover:text-[#f5e6c8]">
            {generoLabel}
          </Link>
        </li>
        <li aria-hidden className="text-[#3d3830]">/</li>
        <li>
          <Link to={collectionPath} className="transition-colors hover:text-[#f5e6c8] capitalize">
            {categoryLabel}
          </Link>
        </li>
        <li aria-hidden className="text-[#3d3830]">/</li>
        <li className="truncate text-[#d4af37]/90 max-w-[12rem] sm:max-w-xs" aria-current="page">
          {product.name}
        </li>
      </ol>
    </nav>
  );
}
