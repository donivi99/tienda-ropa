import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Product } from '../../types';
import { MAIN_COLORS } from '../../utils/colorMap';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    discountPercent: 0,
    category: 'camisetas-cortas',
    genero: 'hombre' as 'mujer' | 'hombre' | 'niños',
    tipo: 'corto' as 'corto' | 'largo' | 'tirantes',
    images: [''],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [] as string[],
    stock: {} as Record<string, number>,
  });

  const fetchProducts = async () => {
    try {
      const data = await api.get<Product[]>('/api/products');
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
      category: product.category,
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
      category: 'camisetas-cortas',
      genero: 'hombre',
      tipo: 'corto',
      images: [''],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [],
      stock: {},
    });
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
          <h1 className="text-3xl font-semibold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>
            Productos
          </h1>
          <p className="mt-1 text-sm text-[#a89a82]">{products.length} productos</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); resetForm(); }}
          className="rounded-lg bg-[#d4af37] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] hover:bg-[#c9a432] transition-colors"
        >
          + Nuevo Producto
        </button>
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
                <div>
                  <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-[#f5e6c8] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                  >
                    <option value="camisetas-cortas">Camisetas Cortas</option>
                    <option value="camisetas-largas">Camisetas Largas</option>
                    <option value="pantalones-cortos">Pantalones Cortos</option>
                    <option value="pantalones-largos">Pantalones Largos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Género</label>
                  <select
                    value={form.genero}
                    onChange={(e) => setForm({ ...form, genero: e.target.value as 'mujer' | 'hombre' | 'niños' })}
                    className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-[#f5e6c8] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                  >
                    <option value="hombre">Hombre</option>
                    <option value="mujer">Mujer</option>
                    <option value="niños">Niños</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value as 'corto' | 'largo' | 'tirantes' })}
                    className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2.5 text-[#f5e6c8] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                  >
                    <option value="corto">Corto</option>
                    <option value="largo">Largo</option>
                    <option value="tirantes">Tirantes</option>
                  </select>
                </div>
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

      {filterColors.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#a89a82] uppercase tracking-wider">Filtrar por color:</span>
          {MAIN_COLORS.filter((c) => filterColors.includes(c.key)).map((c) => (
            <button
              key={c.key}
              onClick={() => setFilterColors(filterColors.filter((k) => k !== c.key))}
              className="flex items-center gap-1.5 rounded-full border border-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 text-xs text-[#f5e6c8] hover:bg-[#d4af37]/20 transition-colors"
            >
              <span
                className="h-3 w-3 rounded-full border border-[#2a2520]"
                style={{ backgroundColor: c.hex }}
              />
              {c.label}
              <span className="ml-0.5 text-[#a89a82]">×</span>
            </button>
          ))}
          <button
            onClick={() => setFilterColors([])}
            className="text-xs text-[#a89a82] hover:text-[#f5e6c8] transition-colors"
          >
            Limpiar
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[#a89a82] uppercase tracking-wider">Colores:</span>
        {MAIN_COLORS.map((c) => {
          const active = filterColors.includes(c.key);
          return (
            <button
              key={c.key}
              onClick={() => {
                setFilterColors(
                  active
                    ? filterColors.filter((k) => k !== c.key)
                    : [...filterColors, c.key]
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

      <div className="overflow-x-auto rounded-xl border border-[#2a2520]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2520] bg-[#141210]">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Producto</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Categoría</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Precio</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Estado</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#a89a82]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2520]">
            {products
              .filter((product) =>
                filterColors.length === 0 ||
                product.colors?.some((color) => filterColors.includes(color))
              )
              .map((product) => (
              <tr key={product.id} className="hover:bg-[#141210]/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.images[0] && (
                      <img src={product.images[0]} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="text-[#f5e6c8] font-medium">{product.name}</p>
                      <p className="text-xs text-[#a89a82]">{product.genero} · {product.tipo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#a89a82]">{product.category}</td>
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
                  <span className="rounded-full bg-[#d4af37]/10 px-2 py-1 text-xs text-[#d4af37]">Activo</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(product)} className="rounded-lg px-3 py-1.5 text-xs text-[#a89a82] hover:bg-[#2a2520] hover:text-[#f5e6c8] transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleToggleActive(product.id)} className="rounded-lg px-3 py-1.5 text-xs text-[#a89a82] hover:bg-[#2a2520] hover:text-[#f5e6c8] transition-colors">
                      Activar
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
