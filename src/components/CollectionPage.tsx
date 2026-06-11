import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query, startAfter, where, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { Product } from '../types';
import { productMatchesColorFilters } from '../utils/colorMap';
import { getProductSalePrice, hasActiveDiscount, productMatchesPrenda } from '../utils/productFilters';
import { getFirebaseDb } from '../config/firebase';
import ProductGrid from './ProductGrid';
import FilterSidebar, { type Filters } from './FilterSidebar';

const PAGE_SIZE = 50;

const DEFAULT_FILTERS: Filters = {
  prenda: [],
  tipo: [],
  sizes: [],
  colors: [],
  soloDescuento: false,
  priceRange: [0, 999],
};

function getPageMeta(category: 'mujer' | 'hombre' | 'niños') {
  if (category === 'mujer') {
    return {
      eyebrow: 'Colección femenina',
      title: 'Mujer',
      description: 'Piezas con silueta, textura y presencia para un armario más refinado.',
      accent: 'from-[#d4af37]/25 via-[#f5e6c8]/8 to-transparent',
      metric: 'Selección curada',
    };
  }
  if (category === 'niños') {
    return {
      eyebrow: 'Colección infantil',
      title: 'Niños',
      description: 'Prendas cómodas y resistentes para el día a día, con colores vivos y tejidos suaves.',
      accent: 'from-[#d4af37]/20 via-[#5fcf80]/10 to-transparent',
      metric: 'Mini estilos',
    };
  }
  return {
    eyebrow: 'Colección masculina',
    title: 'Hombre',
    description: 'Una lectura más sobria y contemporánea, con prendas versátiles y premium.',
    accent: 'from-[#d4af37]/20 via-[#a89a82]/10 to-transparent',
    metric: 'Estilo esencial',
  };
}

interface CollectionPageProps {
  category: 'mujer' | 'hombre' | 'niños';
}

export default function CollectionPage({ category }: CollectionPageProps) {
  const pageMeta = getPageMeta(category);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const db = getFirebaseDb();
        const q = query(collection(db, 'products'), where('genero', '==', category), limit(PAGE_SIZE));
        const snapshot = await getDocs(q);
        if (cancelled) return;

        const newProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

        setAllProducts(newProducts);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setFilters(DEFAULT_FILTERS);
      } catch (err) {
        if (!cancelled) {
          setError('Error al cargar productos');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [category]);

  const loadMoreProducts = useCallback(async () => {
    if (!lastDoc) return;

    setLoading(true);
    setError('');

    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'products'),
        where('genero', '==', category),
        limit(PAGE_SIZE),
        startAfter(lastDoc)
      );

      const snapshot = await getDocs(q);
      const newProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

      setAllProducts((prev) => [...prev, ...newProducts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, lastDoc]);

  const priceStats = useMemo(() => {
    if (allProducts.length === 0) return { min: 0, max: 100 };
    const prices = allProducts.map((p) => getProductSalePrice(p));
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (filters.prenda.length > 0) {
      result = result.filter((p) =>
        filters.prenda.some((prenda) => productMatchesPrenda(p.category, prenda))
      );
    }
    if (filters.tipo.length > 0) result = result.filter((p) => filters.tipo.includes(p.tipo || ''));
    if (filters.sizes.length > 0) result = result.filter((p) => p.sizes?.some((s) => filters.sizes.includes(s)));
    if (filters.colors.length > 0) {
      result = result.filter((p) => productMatchesColorFilters(p.colors, filters.colors));
    }
    if (filters.soloDescuento) {
      result = result.filter((p) => hasActiveDiscount(p));
    }
    if (filters.priceRange[0] > priceStats.min || filters.priceRange[1] < priceStats.max) {
      result = result.filter((p) => {
        const price = getProductSalePrice(p);
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    return result.sort((a, b) => getProductSalePrice(a) - getProductSalePrice(b));
  }, [allProducts, filters, priceStats]);

  const activeFiltersCount =
    filters.prenda.length +
    filters.tipo.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.soloDescuento ? 1 : 0) +
    (filters.priceRange[0] > priceStats.min || filters.priceRange[1] < priceStats.max ? 1 : 0);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters({
      ...newFilters,
      priceRange: [
        newFilters.priceRange[0] === 0 ? priceStats.min : newFilters.priceRange[0],
        newFilters.priceRange[1] === 999 ? priceStats.max : newFilters.priceRange[1],
      ],
    });
  };

  const handleResetFilters = () => {
    setFilters({
      prenda: [],
      tipo: [],
      sizes: [],
      colors: [],
      soloDescuento: false,
      priceRange: [priceStats.min, priceStats.max],
    });
  };

  return (
    <div className="relative overflow-hidden">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b ${pageMeta.accent}`} />
      <div className="pointer-events-none absolute right-[-8rem] top-24 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[-10rem] top-48 h-80 w-80 rounded-full bg-[#f5e6c8]/5 blur-3xl" />

      <div className="relative mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 lg:py-10">
        <section className="mb-10 rounded-[2rem] border border-white/8 bg-[#11100e]/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#d4af37]/20 bg-[#141210]/80 px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] text-[#d4af37]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />
              {pageMeta.eyebrow}
            </div>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold text-[#f5e6c8] sm:text-5xl lg:text-6xl" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                {pageMeta.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#a89a82] sm:text-lg">{pageMeta.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-[#2a2520] bg-[#141210] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#f5e6c8]">
                {pageMeta.metric}
              </span>
              <span className="rounded-full border border-[#2a2520] bg-[#141210] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#a89a82]">
                Filtros avanzados
              </span>
              <span className="rounded-full border border-[#2a2520] bg-[#141210] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#a89a82]">
                Edición curada
              </span>
            </div>
          </div>
        </section>

        {error && <div className="mb-6 rounded-2xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-[#a89a82]">
            <span>{filteredProducts.length} productos encontrados</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full border border-[#d4af37]/20 bg-[#141210] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#d4af37]">
                {activeFiltersCount} filtros activos
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-[#a89a82]">
            <span className="rounded-full border border-[#2a2520] bg-[#141210] px-3 py-2">Precio desde {priceStats.min}€</span>
            <span className="rounded-full border border-[#2a2520] bg-[#141210] px-3 py-2">Hasta {priceStats.max}€</span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)] lg:items-start 2xl:gap-12">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar
              products={allProducts}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div>

          <div className="space-y-8">
            <ProductGrid products={filteredProducts} />

            {loading && (
              <div className="py-10 text-center">
                <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
              </div>
            )}

            {hasMore && !loading && (
              <div className="text-center">
                <button
                  onClick={() => loadMoreProducts()}
                  className="rounded-full border border-[#2a2520] bg-[#141210] px-7 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-[#f5e6c8] transition-all hover:border-[#d4af37] hover:text-[#d4af37]"
                >
                  Cargar más
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile floating filter button */}
      <button
        onClick={() => setMobileFiltersOpen(true)}
        className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-[#141210]/95 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d4af37] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all hover:bg-[#1a1714] hover:shadow-[0_8px_40px_rgba(212,175,55,0.15)]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filtros
        {activeFiltersCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37] text-[0.6rem] font-bold text-[#0a0a0a]">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Mobile bottom sheet overlay */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex flex-col rounded-t-[2rem] border-t border-white/10 bg-[#12100e] shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-10 rounded-full bg-[#2a2520]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f5e6c8]">Filtros</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-full p-1.5 text-[#a89a82] hover:bg-white/5 hover:text-[#f5e6c8] transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto overscroll-contain p-5" style={{ maxHeight: 'calc(85vh - 140px)' }}>
                <FilterSidebar
                  products={allProducts}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleResetFilters}
                  activeFiltersCount={activeFiltersCount}
                />
              </div>

              {/* Apply button */}
              <div className="border-t border-white/8 p-4">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full rounded-xl bg-[#d4af37] py-3.5 text-xs font-semibold uppercase tracking-[0.26em] text-[#0a0a0a] transition-colors hover:bg-[#c9a432]"
                >
                  Ver {filteredProducts.length} productos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
