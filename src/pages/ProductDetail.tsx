import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';
import { useCart } from '../context/CartContext';
import type { Product } from '../types';
import { getEffectivePrice } from '../utils/colorMap';
import ProductPrice, { DiscountBadge } from '../components/ProductPrice';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    getDoc(doc(getFirebaseDb(), 'products', id))
      .then((snap) => {
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as Product);
        } else {
          setError('Producto no encontrado');
        }
      })
      .catch(() => setError('Error al cargar el producto'));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2a2520] border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  const stockForSize = selectedSize ? product.stock[selectedSize] ?? 0 : 0;
  const canAdd = selectedSize && selectedColor && stockForSize > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0],
      selectedSize,
      selectedColor,
      price: getEffectivePrice(product.price, product.discountPercent),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[#1e1b18]">
            <img
              src={product.images[currentImage]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {product.discountPercent != null && product.discountPercent > 0 && (
              <div className="absolute right-4 top-4">
                <DiscountBadge percent={product.discountPercent} variant="solid" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-16 h-20 rounded overflow-hidden border-2 ${
                    i === currentImage ? 'border-[#d4af37]' : 'border-[#2a2520]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-[#d4af37] uppercase tracking-widest">{product.category}</p>
              <span className="text-sm text-[#a89a82]">·</span>
              <p className="text-sm text-[#a89a82] capitalize">{product.genero}</p>
            </div>
            <h1 className="mt-1 text-3xl font-bold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>
              {product.name}
            </h1>
            <div className="mt-4 rounded-xl border border-[#2a2520] bg-[#141210] px-4 py-3">
              <ProductPrice
                price={product.price}
                discountPercent={product.discountPercent}
                size="lg"
                layout="inline"
              />
            </div>
          </div>

          <p className="text-[#a89a82]">{product.description}</p>

          <div>
            <h3 className="text-sm font-medium text-[#f5e6c8] mb-2 uppercase tracking-wider">Color</h3>
            <div className="flex gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                    selectedColor === color
                      ? 'border-[#d4af37] bg-[#d4af37] text-[#0a0a0a] font-bold'
                      : 'border-[#2a2520] text-[#f5e6c8] hover:border-[#d4af37]'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#f5e6c8] mb-2 uppercase tracking-wider">Talla</h3>
            <div className="flex gap-2">
              {product.sizes.map((size) => {
                const stock = product.stock[size] ?? 0;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    disabled={stock === 0}
                    className={`w-12 h-12 border rounded-lg text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? 'border-[#d4af37] bg-[#d4af37] text-[#0a0a0a]'
                        : stock === 0
                        ? 'border-[#1e1b18] text-[#2a2520] cursor-not-allowed'
                        : 'border-[#2a2520] text-[#f5e6c8] hover:border-[#d4af37]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {selectedSize && (
              <p className="text-xs text-[#a89a82] mt-1">
                {stockForSize > 0 ? `${stockForSize} unidades disponibles` : 'Sin stock'}
              </p>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors ${
              canAdd
                ? 'bg-[#d4af37] text-[#0a0a0a] hover:bg-[#b8962e]'
                : 'bg-[#1e1b18] text-[#2a2520] cursor-not-allowed'
            }`}
          >
            {added ? 'Agregado al carrito' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  );
}
