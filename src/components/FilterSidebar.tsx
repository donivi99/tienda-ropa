import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Product } from '../types';
import {
  COLOR_FAMILIES,
  getColorStyle,
  getCompoundColors,
  isCompoundColor,
} from '../utils/colorMap';

export interface Filters {
  tipo: string[];
  sizes: string[];
  colors: string[];
  priceRange: [number, number];
}

interface FilterSidebarProps {
  products: Product[];
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
  activeFiltersCount: number;
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-white/6 py-5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left group/section"
      >
        <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-[#f5e6c8] group-hover/section:text-[#d4af37] transition-colors">
          {title}
        </h3>
        <span
          className={`text-lg leading-none text-[#a89a82] transition-transform duration-300 ${
            open ? 'rotate-0' : '-rotate-45'
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

function SolidSwatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  const style = getColorStyle(color);

  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      className="group/swatch relative flex flex-col items-center gap-1.5"
    >
      <span
        className={`h-8 w-8 rounded-full border-2 transition-all duration-200 shadow-sm ${
          selected
            ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30 ring-offset-2 ring-offset-[#12100e] scale-110'
            : 'border-white/15 hover:border-white/40 hover:scale-105'
        }`}
        style={style}
      />
      <span
        className={`text-[0.6rem] leading-tight text-center max-w-[52px] truncate transition-colors ${
          selected ? 'text-[#d4af37]' : 'text-[#a89a82] group-hover/swatch:text-[#f5e6c8]'
        }`}
      >
        {color}
      </span>
    </button>
  );
}

function CompoundSwatch({
  colorName,
  selected,
  onClick,
}: {
  colorName: string;
  selected: boolean;
  onClick: () => void;
}) {
  const colors = getCompoundColors(colorName);
  if (!colors) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={colorName}
      className="group/swatch relative flex flex-col items-center gap-1.5"
    >
      <span
        className={`relative h-8 w-10 overflow-hidden rounded-full border-2 transition-all duration-200 shadow-sm ${
          selected
            ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30 ring-offset-2 ring-offset-[#12100e] scale-110'
            : 'border-white/15 hover:border-white/40 hover:scale-105'
        }`}
      >
        <span
          className="absolute inset-y-0 left-0 w-1/2"
          style={{ backgroundColor: colors[0] }}
        />
        <span
          className="absolute inset-y-0 right-0 w-1/2"
          style={{ backgroundColor: colors[1] }}
        />
      </span>
      <span
        className={`text-[0.6rem] leading-tight text-center max-w-[60px] truncate transition-colors ${
          selected ? 'text-[#d4af37]' : 'text-[#a89a82] group-hover/swatch:text-[#f5e6c8]'
        }`}
      >
        {colorName}
      </span>
    </button>
  );
}

export default function FilterSidebar({
  products,
  filters,
  onFilterChange,
  onReset,
  activeFiltersCount,
}: FilterSidebarProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<null | 'min' | 'max'>(null);

  const availableTipos = useMemo(
    () => Array.from(new Set(products.map((p) => p.tipo).filter(Boolean))).sort(),
    [products]
  );

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach((p) => p.sizes?.forEach((s) => sizes.add(s)));
    return Array.from(sizes).sort();
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => p.colors?.forEach((c) => colors.add(c)));
    return Array.from(colors).sort();
  }, [products]);

  const priceStats = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 100 };
    const prices = products.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const toggleArrayFilter = (key: 'tipo' | 'sizes' | 'colors', value: string) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: next });
  };

  const tipoLabels: Record<string, string> = {
    corto: 'Corto',
    largo: 'Largo',
    tirantes: 'Tirantes',
  };

  const normalizedMin = Math.min(Math.max(filters.priceRange[0], priceStats.min), priceStats.max);
  const normalizedMax = Math.min(Math.max(filters.priceRange[1], priceStats.min), priceStats.max);
  const rangeWidth = Math.max(priceStats.max - priceStats.min, 1);
  const leftPct = ((normalizedMin - priceStats.min) / rangeWidth) * 100;
  const rightPct = 100 - ((normalizedMax - priceStats.min) / rangeWidth) * 100;

  const valueFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return priceStats.min;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(priceStats.min + ratio * (priceStats.max - priceStats.min));
  }, [priceStats.max, priceStats.min]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const value = valueFromClientX(event.clientX);
      if (dragging === 'min') {
        onFilterChange({
          ...filters,
          priceRange: [Math.min(value, normalizedMax), normalizedMax],
        });
      }
      if (dragging === 'max') {
        onFilterChange({
          ...filters,
          priceRange: [normalizedMin, Math.max(value, normalizedMin)],
        });
      }
    };

    const onUp = () => setDragging(null);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, filters, normalizedMax, normalizedMin, onFilterChange, priceStats.max, priceStats.min, valueFromClientX]);

  const solidColors = useMemo(
    () => availableColors.filter((c) => !isCompoundColor(c)),
    [availableColors]
  );

  const compoundColors = useMemo(
    () => availableColors.filter((c) => isCompoundColor(c)),
    [availableColors]
  );

  return (
    <aside className="w-full shrink-0 lg:w-[360px] xl:w-[390px]">
      <div className="sticky top-24 rounded-[1.75rem] border border-white/8 bg-[#12100e]/95 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.34em] text-[#d4af37]">
              Filtros
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#f5e6c8]">Refinar colección</h2>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/8 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#d4af37] transition-all hover:bg-[#d4af37]/15"
            >
              Limpiar ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFiltersCount > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.tipo.map((t) => (
              <span
                key={`tipo-${t}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/8 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-[#d4af37]"
              >
                {tipoLabels[t] || t}
                <button
                  onClick={() => toggleArrayFilter('tipo', t)}
                  className="ml-0.5 rounded-full hover:bg-[#d4af37]/20 p-0.5 transition-colors"
                >
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {filters.sizes.map((s) => (
              <span
                key={`size-${s}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/8 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-[#d4af37]"
              >
                Talla {s}
                <button
                  onClick={() => toggleArrayFilter('sizes', s)}
                  className="ml-0.5 rounded-full hover:bg-[#d4af37]/20 p-0.5 transition-colors"
                >
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {filters.colors.map((c) => (
              <span
                key={`color-${c}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/8 px-2.5 py-1 text-[0.65rem] tracking-[0.12em] text-[#d4af37]"
              >
                {c}
                <button
                  onClick={() => toggleArrayFilter('colors', c)}
                  className="ml-0.5 rounded-full hover:bg-[#d4af37]/20 p-0.5 transition-colors"
                >
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {normalizedMin > priceStats.min || normalizedMax < priceStats.max ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/8 px-2.5 py-1 text-[0.65rem] tracking-[0.12em] text-[#d4af37]">
                {normalizedMin}€ — {normalizedMax}€
                <button
                  onClick={() => onFilterChange({ ...filters, priceRange: [priceStats.min, priceStats.max] })}
                  className="ml-0.5 rounded-full hover:bg-[#d4af37]/20 p-0.5 transition-colors"
                >
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ) : null}
          </div>
        )}

        {/* Tipo - Pill buttons */}
        <CollapsibleSection title="Tipo">
          <div className="flex flex-wrap gap-2">
            {availableTipos.map((tipo) => {
              const active = filters.tipo.includes(tipo);
              return (
                <button
                  key={tipo}
                  onClick={() => toggleArrayFilter('tipo', tipo)}
                  className={`rounded-full px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-200 ${
                    active
                      ? 'bg-[#d4af37] text-[#0a0a0a] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                      : 'border border-[#2a2520] text-[#a89a82] hover:border-[#d4af37]/50 hover:text-[#f5e6c8]'
                  }`}
                >
                  {tipoLabels[tipo] || tipo}
                </button>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* Talla - Square grid buttons */}
        <CollapsibleSection title="Talla">
          <div className="grid grid-cols-5 gap-2">
            {availableSizes.map((size) => {
              const active = filters.sizes.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => toggleArrayFilter('sizes', size)}
                  className={`flex h-10 items-center justify-center rounded-lg text-xs font-medium tracking-wider transition-all duration-200 ${
                    active
                      ? 'border-2 border-[#d4af37] bg-[#d4af37]/8 text-[#d4af37] shadow-[0_0_16px_rgba(212,175,55,0.15)]'
                      : 'border border-[#2a2520] text-[#a89a82] hover:border-[#d4af37]/40 hover:text-[#f5e6c8]'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* Color - Large swatches grouped by family */}
        <CollapsibleSection title="Color">
          <div className="space-y-4">
            {/* Solid colors by family */}
            {COLOR_FAMILIES.map((family) => {
              const familyColors = family.colors.filter((c) =>
                solidColors.some((sc) => sc.toLowerCase() === c)
              );
              if (familyColors.length === 0) return null;

              return (
                <div key={family.name}>
                  <p className="mb-2 text-[0.6rem] uppercase tracking-[0.28em] text-[#5f574d]">
                    {family.name}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {familyColors.map((color) => {
                      const realName = solidColors.find(
                        (sc) => sc.toLowerCase() === color
                      )!;
                      return (
                        <SolidSwatch
                          key={color}
                          color={realName}
                          selected={filters.colors.includes(realName)}
                          onClick={() => toggleArrayFilter('colors', realName)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Compound colors */}
            {compoundColors.length > 0 && (
              <div>
                <p className="mb-2 text-[0.6rem] uppercase tracking-[0.28em] text-[#5f574d]">
                  Combinados
                </p>
                <div className="flex flex-wrap gap-3">
                  {compoundColors.map((color) => (
                    <CompoundSwatch
                      key={color}
                      colorName={color}
                      selected={filters.colors.includes(color)}
                      onClick={() => toggleArrayFilter('colors', color)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Precio - Slider */}
        <CollapsibleSection title="Precio">
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs text-[#a89a82]">
              <span className="font-medium text-[#f5e6c8]">{normalizedMin}€</span>
              <span className="text-[0.6rem] uppercase tracking-wider">—</span>
              <span className="font-medium text-[#f5e6c8]">{normalizedMax}€</span>
            </div>

            <div ref={trackRef} className="relative h-8 select-none">
              <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#2a2520]" />
              <div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#a8841f] via-[#d4af37] to-[#f5e6c8]"
                style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
              />
              <button
                type="button"
                aria-label="Precio mínimo"
                className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#f5e6c8]/60 bg-[#d4af37] shadow-[0_0_0_4px_rgba(212,175,55,0.12)] transition-shadow hover:shadow-[0_0_0_6px_rgba(212,175,55,0.2)]"
                style={{ left: `${leftPct}%` }}
                onPointerDown={() => setDragging('min')}
              />
              <button
                type="button"
                aria-label="Precio máximo"
                className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#f5e6c8]/60 bg-[#d4af37] shadow-[0_0_0_4px_rgba(212,175,55,0.12)] transition-shadow hover:shadow-[0_0_0_6px_rgba(212,175,55,0.2)]"
                style={{ left: `${100 - rightPct}%` }}
                onPointerDown={() => setDragging('max')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#5f574d]">
                  €
                </span>
                <input
                  type="number"
                  value={normalizedMin}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val <= normalizedMax)
                      onFilterChange({ ...filters, priceRange: [val, normalizedMax] });
                  }}
                  className="w-full rounded-xl border border-[#2a2520] bg-[#141210] py-2 pl-7 pr-3 text-sm text-[#f5e6c8] outline-none transition-colors placeholder:text-[#5f574d] focus:border-[#d4af37]"
                  placeholder="Mín"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#5f574d]">
                  €
                </span>
                <input
                  type="number"
                  value={normalizedMax}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= normalizedMin)
                      onFilterChange({ ...filters, priceRange: [normalizedMin, val] });
                  }}
                  className="w-full rounded-xl border border-[#2a2520] bg-[#141210] py-2 pl-7 pr-3 text-sm text-[#f5e6c8] outline-none transition-colors placeholder:text-[#5f574d] focus:border-[#d4af37]"
                  placeholder="Máx"
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </aside>
  );
}
