import { useEffect, useMemo, useState } from 'react';
import { AdminSelect } from '../../components/admin/AdminSelect';
import { api } from '../../services/api';
import type { Product } from '../../types';
import { MAIN_COLORS, productMatchesColorFilters } from '../../utils/colorMap';
import { isProductActive, productMatchesCategoryFilter, normalizeProductCategory, formatProductCategoryLabel } from '../../utils/productFilters';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas las categorías' },
  { value: 'camisetas', label: 'Camisetas' },
  { value: 'pantalones', label: 'Pantalones' },
] as const;

const FORM_CATEGORY_OPTIONS = [
  { value: 'camisetas', label: 'Camisetas' },
  { value: 'pantalones', label: 'Pantalones' },
];

const GENERO_OPTIONS = [
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'niños', label: 'Niños' },
];

const GENERO_FILTER_OPTIONS = [{ value: '', label: 'Todos' }, ...GENERO_OPTIONS];

const TIPO_OPTIONS = [
  { value: 'corto', label: 'Corto' },
  { value: 'largo', label: 'Largo' },
  { value: 'tirantes', label: 'Tirantes' },
];

const TIPO_FILTER_OPTIONS = [{ value: '', label: 'Todos' }, ...TIPO_OPTIONS];

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function sortSizes(sizes: string[]) {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProductoId, setFilterProductoId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGenero, setFilterGenero] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    discountPercent: 0,
    category: 'camisetas',
    genero: 'hombre' as 'mujer' | 'hombre' | 'niños',
    tipo: 'corto' as 'corto' | 'largo' | 'tirantes',
    images: [''],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [] as string[],
    stock: {} as Record<string, number>,
  });

  const fetchProducts = async () => {
    try {
      const data = await api.get<Product[]>('/api/admin/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        ...form,
        discountPercent: form.discountPercent || 0,
        images: form.images.filter(Boolean),
        colors: form.colors.filter(Boolean),
      };

      if (editing) {
        await api.put(`/api/products/${editing.id}`, body);
      } else {
        await api.post('/api/products', body);
      }

      setShowForm(false);
      setEditing(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPercent: product.discountPercent || 0,
      category: normalizeProductCategory(product.category) as 'camisetas' | 'pantalones',
      genero: product.genero,
      tipo: product.tipo,
      images: product.images.length > 0 ? product.images : [''],
      sizes: product.sizes,
      colors: product.colors.length > 0 ? product.colors : [],
      stock: product.stock,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.put(`/api/products/${id}/active`);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: 0,
      discountPercent: 0,
      category: 'camisetas',
      genero: 'hombre',
      tipo: 'corto',
      images: [''],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [],
      stock: {},
    });
  };

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach((p) => p.sizes?.forEach((s) => sizes.add(s)));
    return sortSizes(Array.from(sizes));
  }, [products]);

  const sizeFilterOptions = useMemo(
    () => [{ value: '', label: 'Todas' }, ...availableSizes.map((size) => ({ value: size, label: size }))],
    [availableSizes]
  );

  const categoryFilterOptions = useMemo(
    () => CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    []
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterProductoId.trim() !== '' ||
    filterCategory !== '' ||
    filterGenero !== '' ||
    filterTipo !== '' ||
    filterSize !== '' ||
    filterColors.length > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterProductoId('');
    setFilterCategory('');
    setFilterGenero('');
    setFilterTipo('');
    setFilterSize('');
    setFilterColors([]);
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const productoIdQ = filterProductoId.trim().toLowerCase();

    return products.filter((p) => {
      if (productoIdQ) {
        const code = p.productoId?.toLowerCase() ?? '';
        if (!code.includes(productoIdQ)) return false;
      }
      if (q) {
        const inName = p.name.toLowerCase().includes(q);
        const inDesc = p.description.toLowerCase().includes(q);
        if (!inName && !inDesc) return false;
      }
      if (filterCategory && !productMatchesCategoryFilter(p.category, filterCategory)) return false;
      if (filterGenero && p.genero !== filterGenero) return false;
      if (filterTipo && p.tipo !== filterTipo) return false;
      if (filterSize && !p.sizes?.includes(filterSize)) return false;
      if (filterColors.length > 0 && !productMatchesColorFilters(p.colors, filterColors)) return false;
      return true;
    });
  }, [products, searchQuery, filterProductoId, filterCategory, filterGenero, filterTipo, filterSize, filterColors]);

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedProducts.has(p.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchActivate = async () => {
    const ids = products
      .filter((p) => selectedProducts.has(p.id) && !isProductActive(p))
      .map((p) => p.id);
    await Promise.allSettled(ids.map((id) => api.put(`/api/products/${id}/active`)));
    setSelectedProducts(new Set());
    fetchProducts();
  };

  const handleBatchDeactivate = async () => {
    const ids = products
      .filter((p) => selectedProducts.has(p.id) && isProductActive(p))
      .map((p) => p.id);
    await Promise.allSettled(ids.map((id) => api.put(`/api/products/${id}/active`)));
    setSelectedProducts(new Set());
    fetchProducts();
  };

  const handleBatchDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedProducts.size} productos?`)) return;
    const ids = Array.from(selectedProducts);
    await Promise.allSettled(ids.map((id) => api.delete(`/api/products/${id}`)));
    setSelectedProducts(new Set());
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[#f5e6c8]">
            Productos
          </h1>
          <p className="mt-1 text-sm text-[#a89a82]">
            {filteredProducts.length === products.length
              ? `${products.length} productos`
              : `${filteredProducts.length} de ${products.length} productos`}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); resetForm(); }}
          className="rounded-lg bg-[#d4af37] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] hover:bg-[#c9a432] transition-colors"
        >
          + Nuevo Producto
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-[#2a2520] bg-[#141210] p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
              Buscar por nombre
            </label>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre o descripción..."
              className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-sm text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
              Producto ID
            </label>
            <input
              type="search"
              value={filterProductoId}
              onChange={(e) => setFilterProductoId(e.target.value)}
              placeholder="TR-000001..."
              className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-sm text-[#f5e6c8] font-mono placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <AdminSelect
            label="Categoría"
            value={filterCategory}
            onChange={setFilterCategory}
            options={categoryFilterOptions}
          />
          <AdminSelect
            label="Género"
            value={filterGenero}
            onChange={setFilterGenero}
            options={GENERO_FILTER_OPTIONS}
          />
          <AdminSelect
            label="Tipo"
            value={filterTipo}
            onChange={setFilterTipo}
            options={TIPO_FILTER_OPTIONS}
          />
          <AdminSelect
            label="Talla"
            value={filterSize}
            onChange={setFilterSize}
            options={sizeFilterOptions}
          />
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/20 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {MAIN_COLORS.map((c) => {
              const active = filterColors.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setFilterColors(
                      active ? filterColors.filter((k) => k !== c.key) : [...filterColors, c.key]
                    );
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all border ${
                    active
                      ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f5e6c8]'
                      : 'border-[#2a2520] bg-[#1e1b18] text-[#a89a82] hover:border-[#d4af37]/50'
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-[#2a2520]"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#2a2520] bg-[#141210] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#f5e6c8]">
                {editing ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-[#a89a82] hover:text-[#f5e6c8]">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Nombre</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-[#f5e6c8] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Precio</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-[#f5e6c8] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Descuento %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-[#f5e6c8] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              {form.price > 0 && form.discountPercent > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#a89a82]">Precio final:</span>
                  <span className="text-[#d4af37] font-bold">${(form.price - (form.price * form.discountPercent / 100)).toFixed(2)}</span>
                  <span className="text-[#a89a82]">(-{form.discountPercent}%)</span>
                </div>
              )}

              <div>
                <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-[#f5e6c8] focus:ring-2 focus:ring-[#d4af37] focus:outline-none resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <AdminSelect
                  label="Categoría"
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v })}
                  options={FORM_CATEGORY_OPTIONS}
                />
                <AdminSelect
                  label="Género"
                  value={form.genero}
                  onChange={(v) => setForm({ ...form, genero: v as 'mujer' | 'hombre' | 'niños' })}
                  options={GENERO_OPTIONS}
                />
                <AdminSelect
                  label="Tipo"
                  value={form.tipo}
                  onChange={(v) => setForm({ ...form, tipo: v as 'corto' | 'largo' | 'tirantes' })}
                  options={TIPO_OPTIONS}
                />
              </div>

              <div>
                <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">URLs de Imágenes</label>
                {form.images.map((img, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={img}
                      onChange={(e) => {
                        const images = [...form.images];
                        images[i] = e.target.value;
                        setForm({ ...form, images });
                      }}
                      placeholder="https://..."
                      className="flex-1 bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-[#f5e6c8] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                    />
                    {form.images.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-300">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, images: [...form.images, ''] })} className="text-xs text-[#d4af37] hover:text-[#f5e6c8]">
                  + Añadir imagen
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Tallas</label>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          const sizes = form.sizes.includes(size)
                            ? form.sizes.filter((s) => s !== size)
                            : [...form.sizes, size];
                          const stock = { ...form.stock };
                          if (!form.sizes.includes(size)) {
                            stock[size] = 0;
                          } else {
                            delete stock[size];
                          }
                          setForm({ ...form, sizes, stock });
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          form.sizes.includes(size)
                            ? 'bg-[#d4af37] text-[#0a0a0a]'
                            : 'bg-[#1e1b18] border border-[#2a2520] text-[#a89a82] hover:border-[#d4af37]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Stock por talla</label>
                  <div className="flex flex-wrap gap-3">
                    {form.sizes.map((size) => (
                      <div key={size} className="flex items-center gap-1.5">
                        <span className="text-xs text-[#a89a82] w-6">{size}</span>
                        <input
                          type="number"
                          min={0}
                          value={form.stock[size] ?? 0}
                          onChange={(e) => {
                            const stock = { ...form.stock };
                            stock[size] = Math.max(0, parseInt(e.target.value) || 0);
                            setForm({ ...form, stock });
                          }}
                          className="w-16 bg-[#1e1b18] border border-[#2a2520] rounded-lg px-2 py-1.5 text-[#f5e6c8] text-center text-xs focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Colores</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {MAIN_COLORS.map((c) => {
                    const selected = form.colors.includes(c.key);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => {
                          const colors = selected
                            ? form.colors.filter((k) => k !== c.key)
                            : [...form.colors, c.key];
                          setForm({ ...form, colors });
                        }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all border ${
                          selected
                            ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f5e6c8] shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                            : 'border-[#2a2520] bg-[#1e1b18] text-[#a89a82] hover:border-[#d4af37]/50 hover:bg-[#1e1b18]/80'
                        }`}
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-[#2a2520] shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                {form.colors.length > 0 && (
                  <p className="text-xs text-[#a89a82] mt-1.5">Seleccionados: {form.colors.join(', ')}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 rounded-lg bg-[#d4af37] py-3 text-sm font-semibold uppercase tracking-wider text-[#0a0a0a] hover:bg-[#c9a432] transition-colors">
                  {editing ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg border border-[#2a2520] px-6 py-3 text-sm text-[#a89a82] hover:text-[#f5e6c8] transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#2a2520]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2520] bg-[#141210]">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-[#2a2520] bg-[#1e1b18] text-[#d4af37] focus:ring-[#d4af37] focus:ring-offset-0 cursor-pointer accent-[#d4af37]"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Producto</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Categoría</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Precio</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Estado</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#a89a82]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2520]">
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-[#f5e6c8] font-medium">No hay productos que coincidan</p>
                  <p className="mt-1 text-sm text-[#a89a82]">
                    {hasActiveFilters
                      ? 'Prueba a ajustar los filtros o limpiarlos.'
                      : 'Aún no hay productos en el catálogo.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 text-xs uppercase tracking-wider text-[#d4af37] hover:text-[#f5e6c8] transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </td>
              </tr>
            )}
            {filteredProducts.map((product) => {
              const active = isProductActive(product);
              return (
              <tr
                key={product.id}
                className={`transition-colors ${
                  !active
                    ? 'border-l-2 border-l-[#5f574d] bg-[#1a1714]/90 opacity-80 hover:opacity-95'
                    : selectedProducts.has(product.id)
                      ? 'bg-[#d4af37]/5 hover:bg-[#d4af37]/8'
                      : 'hover:bg-[#141210]/50'
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleSelectProduct(product.id)}
                    className="h-4 w-4 rounded border-[#2a2520] bg-[#1e1b18] text-[#d4af37] focus:ring-[#d4af37] focus:ring-offset-0 cursor-pointer accent-[#d4af37]"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.images[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className={`h-10 w-10 rounded-lg object-cover ${!active ? 'grayscale-[0.35] opacity-70' : ''}`}
                      />
                    )}
                    <div>
                      <p className={`font-medium ${active ? 'text-[#f5e6c8]' : 'text-[#a89a82]'}`}>{product.name}</p>
                      <p className="text-xs text-[#a89a82] capitalize">{product.genero} · {product.tipo}</p>
                      <p
                        className="mt-0.5 font-mono text-[0.65rem] text-[#5f574d]"
                        title={product.productoId ?? 'Sin productoId'}
                      >
                        {product.productoId ?? '—'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#a89a82]">{formatProductCategoryLabel(product.category)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {product.discountPercent ? (
                      <>
                        <span className="text-[#a89a82] line-through">${product.price.toFixed(2)}</span>
                        <span className="text-[#d4af37] font-bold">${(product.price - (product.price * product.discountPercent / 100)).toFixed(2)}</span>
                        <span className="text-xs text-green-400">-{product.discountPercent}%</span>
                      </>
                    ) : (
                      <span className="text-[#d4af37]">${product.price.toFixed(2)}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(product.id)}
                    aria-pressed={active}
                    aria-label={active ? 'Desactivar producto' : 'Activar producto'}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors ${
                      active
                        ? 'border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20'
                        : 'border border-[#5f574d]/50 bg-[#1e1b18] text-[#a89a82] hover:border-[#a89a82]/60 hover:text-[#f5e6c8]'
                    }`}
                  >
                    {active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(product)} className="rounded-lg px-3 py-1.5 text-xs text-[#a89a82] hover:bg-[#2a2520] hover:text-[#f5e6c8] transition-colors">
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(product.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? 'text-[#a89a82] hover:bg-[#2a2520] hover:text-[#f5e6c8]'
                          : 'border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10'
                      }`}
                    >
                      {active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating action bar */}
      {selectedProducts.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-[#2a2520] bg-[#141210] px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <span className="text-sm font-medium text-[#f5e6c8]">
            <span className="text-[#d4af37]">{selectedProducts.size}</span> seleccionados
          </span>
          <div className="h-6 w-px bg-[#2a2520]" />
          <button
            onClick={handleBatchActivate}
            className="rounded-lg px-4 py-2 text-xs font-medium text-[#f5e6c8] hover:bg-[#2a2520] transition-colors"
          >
            Activar
          </button>
          <button
            onClick={handleBatchDeactivate}
            className="rounded-lg px-4 py-2 text-xs font-medium text-[#a89a82] hover:bg-[#2a2520] hover:text-[#f5e6c8] transition-colors"
          >
            Desactivar
          </button>
          <button
            onClick={handleBatchDelete}
            className="rounded-lg px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-900/20 transition-colors"
          >
            Eliminar
          </button>
          <div className="h-6 w-px bg-[#2a2520]" />
          <button
            onClick={() => setSelectedProducts(new Set())}
            className="rounded-lg px-3 py-2 text-xs text-[#a89a82] hover:text-[#f5e6c8] transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
