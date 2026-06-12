import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';
import type { Product } from '../types';
import ProductGrid from '../components/ProductGrid';
import { isProductActive } from '../utils/productFilters';

export default function Home() {
  return <HomeLanding />;
}

const FEATURED_LIMIT = 8;

function HomeLanding() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const db = getFirebaseDb();
        const snapshot = await getDocs(query(collection(db, 'products'), orderBy('price', 'asc'), limit(FEATURED_LIMIT * 3)));
        const active = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
          .filter(isProductActive)
          .slice(0, FEATURED_LIMIT);
        setFeatured(active);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <>
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40 z-10" />
        <div className="absolute right-0 top-0 h-full w-full bg-[radial-gradient(ellipse_at_right,_rgba(212,175,55,0.08)_0%,_transparent_60%)]" />

        <div className="relative z-20 mx-auto flex h-full max-w-[1600px] items-center px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/8 px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.34em] text-[#d4af37] backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4af37]" />
              Nueva Colección 2026
            </div>

            <h1 className="text-5xl font-semibold leading-[1.05] text-[#f5e6c8] sm:text-6xl lg:text-7xl xl:text-[5.5rem]" style={{ fontFamily: '"Bodoni Moda", serif' }}>
              Moda con<br />
              <span className="text-[#d4af37]">carácter</span>,<br />
              sin ruido.
            </h1>

            <p className="max-w-md text-base leading-7 text-[#a89a82] sm:text-lg">
              Prendas seleccionadas para personas que saben lo que quieren vestir. Calidad, diseño y estilo en cada pieza.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/categoria-mujer"
                className="rounded-full bg-[#d4af37] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.28em] text-[#0a0a0a] transition-all hover:bg-[#c9a432] hover:shadow-[0_0_40px_rgba(212,175,55,0.25)]"
              >
                Explorar Mujer
              </Link>
              <Link
                to="/categoria-hombre"
                className="rounded-full border border-[#f5e6c8]/20 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.28em] text-[#f5e6c8] transition-all hover:border-[#d4af37] hover:text-[#d4af37]"
              >
                Explorar Hombre
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-[#a89a82]">
            <span>Scroll</span>
            <div className="h-10 w-px bg-gradient-to-b from-[#d4af37] to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <Link
            to="/categoria-mujer"
            className="group relative overflow-hidden rounded-[2rem] border border-white/8 bg-[#141210] transition-all duration-500 hover:border-[#d4af37]/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/8 via-transparent to-[#f5e6c8]/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative flex min-h-[340px] flex-col justify-between p-8 lg:min-h-[420px] lg:p-10">
              <div>
                <span className="inline-block rounded-full border border-[#d4af37]/20 bg-[#141210]/80 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-[#d4af37]">
                  Colección
                </span>
              </div>
              <div>
                <h2 className="text-4xl font-semibold text-[#f5e6c8] sm:text-5xl lg:text-6xl" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                  Mujer
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#a89a82]">
                  Siluetas elegantes, tejidos selectos y una estética que habla por sí sola.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-[#d4af37] transition-all group-hover:gap-3">
                  Descubrir
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/categoria-hombre"
            className="group relative overflow-hidden rounded-[2rem] border border-white/8 bg-[#141210] transition-all duration-500 hover:border-[#d4af37]/30"
          >
            <div className="absolute inset-0 bg-gradient-to-bl from-[#d4af37]/8 via-transparent to-[#a89a82]/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative flex min-h-[340px] flex-col justify-between p-8 lg:min-h-[420px] lg:p-10">
              <div>
                <span className="inline-block rounded-full border border-[#d4af37]/20 bg-[#141210]/80 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-[#d4af37]">
                  Colección
                </span>
              </div>
              <div>
                <h2 className="text-4xl font-semibold text-[#f5e6c8] sm:text-5xl lg:text-6xl" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                  Hombre
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#a89a82]">
                  Estilo sobrio, prendas versátiles y una propuesta visual limpia y premium.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-[#d4af37] transition-all group-hover:gap-3">
                  Descubrir
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="rounded-[2rem] border border-white/8 bg-gradient-to-r from-[#141210] via-[#1a1714] to-[#141210] px-8 py-12 sm:px-12 lg:px-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-3">
              <p className="text-[0.65rem] uppercase tracking-[0.34em] text-[#d4af37]">Por qué elegirnos</p>
              <h2 className="text-2xl font-semibold text-[#f5e6c8] sm:text-3xl" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                Hecho para durar
              </h2>
            </div>

            <div className="hidden h-16 w-px bg-[#2a2520] lg:block" />

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-4">
              {[
                { num: '160+', label: 'Productos' },
                { num: '5k+', label: 'Clientes' },
                { num: '4.9', label: 'Valoración' },
                { num: '48h', label: 'Envío' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-semibold text-[#d4af37] sm:text-3xl">{s.num}</p>
                  <p className="mt-1 text-[0.62rem] uppercase tracking-[0.28em] text-[#a89a82]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.34em] text-[#d4af37]">Selección</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#f5e6c8] sm:text-4xl" style={{ fontFamily: '"Bodoni Moda", serif' }}>
              Lo más vendido
            </h2>
          </div>
          <Link
            to="/categoria-destacados"
            className="hidden items-center gap-2 text-xs uppercase tracking-[0.26em] text-[#a89a82] transition-colors hover:text-[#d4af37] sm:inline-flex"
          >
            Ver todo
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
          </div>
        ) : (
          <ProductGrid products={featured} />
        )}

        <div className="mt-10 text-center sm:hidden">
          <Link
            to="/categoria-destacados"
            className="inline-flex items-center gap-2 rounded-full border border-[#2a2520] px-6 py-3 text-xs uppercase tracking-[0.26em] text-[#a89a82] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            Ver todos los productos
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 pb-20 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#11100e]">
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
              <p className="text-[0.65rem] uppercase tracking-[0.34em] text-[#d4af37]">Edición limitada</p>
              <h2 className="mt-4 text-3xl font-semibold text-[#f5e6c8] sm:text-4xl" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                Essentials de temporada
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#a89a82]">
                Prendas básicas elevadas con tejidos premium y acabados que marcan la diferencia. Piezas que no pasan de moda y que combinan con todo.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/categoria-mujer"
                  className="rounded-full bg-[#d4af37] px-7 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-[#0a0a0a] transition-all hover:bg-[#c9a432]"
                >
                  Mujer
                </Link>
                <Link
                  to="/categoria-hombre"
                  className="rounded-full border border-[#f5e6c8]/20 px-7 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-[#f5e6c8] transition-all hover:border-[#d4af37] hover:text-[#d4af37]"
                >
                  Hombre
                </Link>
              </div>
            </div>
            <div className="relative min-h-[300px] bg-gradient-to-br from-[#d4af37]/10 via-[#141210] to-[#f5e6c8]/5 lg:min-h-[400px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-semibold text-[#d4af37]/20" style={{ fontFamily: '"Bodoni Moda", serif' }}>TR</p>
                  <p className="mt-2 text-[0.6rem] uppercase tracking-[0.4em] text-[#a89a82]/40">tiendaRopa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
