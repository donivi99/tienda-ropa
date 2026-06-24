import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';
import { useCart } from '../context/CartContext';
import type { Product } from '../types';
import { getEffectivePrice } from '../utils/colorMap';
import { isProductActive } from '../utils/productFilters';
import ProductBreadcrumb from '../components/product/ProductBreadcrumb';
import ProductDetailSkeleton from '../components/product/ProductDetailSkeleton';
import ProductGallery from '../components/product/ProductGallery';
import ProductPurchasePanel, { AddToCartButton } from '../components/product/ProductPurchasePanel';
import ProductPrice from '../components/ProductPrice';

function getCtaHint(selectedColor: string, selectedSize: string, stockForSize: number): string {
  if (!selectedColor && !selectedSize) return 'Selecciona color y talla';
  if (!selectedColor) return 'Selecciona un color';
  if (!selectedSize) return 'Selecciona una talla';
  if (stockForSize <= 0) return 'Sin stock en esta talla';
  return 'Agregar al carrito';
}

function ProductJsonLd({ product }: { product: Product }) {
  const price = getEffectivePrice(product.price, product.discountPercent);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.productoId ?? product.id,
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'EUR',
      availability:
        Object.values(product.stock).some((s) => s > 0)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd)
          .replace(/</g, '\\u003c')
          .replace(/>/g, '\\u003e')
          .replace(/&/g, '\\u0026'),
      }}
    />
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem, items } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setProduct(null);
    setError('');
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setCurrentImage(0);

    getDoc(doc(getFirebaseDb(), 'products', id))
      .then((snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Product;
          if (!isProductActive(data)) {
            setError('Este producto no está disponible en la tienda');
            return;
          }
          setProduct(data);
        } else {
          setError('Producto no encontrado');
        }
      })
      .catch(() => setError('Error al cargar el producto'));
  }, [id]);

  const totalStock = useMemo(
    () => (product ? Object.values(product.stock).reduce((sum, s) => sum + s, 0) : 0),
    [product],
  );

  const stockForSize = product && selectedSize ? product.stock[selectedSize] ?? 0 : 0;

  const inCartQuantity = useMemo(() => {
    if (!product || !selectedSize || !selectedColor) return 0;
    return (
      items.find(
        (item) =>
          item.productId === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor,
      )?.quantity ?? 0
    );
  }, [items, product, selectedSize, selectedColor]);

  const maxQuantity = Math.max(0, stockForSize - inCartQuantity);

  useEffect(() => {
    if (maxQuantity <= 0) {
      setQuantity(1);
      return;
    }
    setQuantity((current) => Math.min(Math.max(1, current), maxQuantity));
  }, [maxQuantity, selectedSize, selectedColor]);

  const canAdd = !!(product && selectedSize && selectedColor && maxQuantity > 0);
  const ctaHint = getCtaHint(selectedColor, selectedSize, stockForSize);

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setQuantity(1);
  };

  const handleQuantityChange = (next: number) => {
    if (maxQuantity <= 0) return;
    setQuantity(Math.min(Math.max(1, next), maxQuantity));
  };

  const handleAdd = () => {
    if (!product || !canAdd) return;
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[currentImage] ?? product.images[0],
      selectedSize,
      selectedColor,
      price: getEffectivePrice(product.price, product.discountPercent),
      quantity,
      maxStock: stockForSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-2xl border border-[#2a2520] bg-[#141210] p-8">
          <p className="text-red-300">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm uppercase tracking-wider text-[#d4af37] hover:text-[#f5e6c8] transition-colors"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return <ProductDetailSkeleton />;
  }

  const lowStock = totalStock > 0 && totalStock <= 5;

  return (
    <>
      <ProductJsonLd product={product} />
      <div className="mx-auto max-w-7xl px-4 py-8 pb-28 lg:pb-12">
        <ProductBreadcrumb product={product} />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery
              images={product.images}
              name={product.name}
              currentIndex={currentImage}
              onIndexChange={setCurrentImage}
              discountPercent={product.discountPercent}
              isOutOfStock={totalStock === 0}
              lowStock={lowStock}
            />
          </div>

          <ProductPurchasePanel
            product={product}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            stockForSize={stockForSize}
            totalStock={totalStock}
            quantity={quantity}
            maxQuantity={maxQuantity}
            canAdd={canAdd}
            added={added}
            ctaHint={ctaHint}
            onSizeChange={handleSizeChange}
            onColorChange={handleColorChange}
            onQuantityChange={handleQuantityChange}
            onAdd={handleAdd}
          />
        </div>
      </div>

      {/* Barra fija móvil */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#2a2520] bg-[#0a0a0a]/95 p-4 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="min-w-0 shrink-0">
            <ProductPrice
              price={product.price}
              discountPercent={product.discountPercent}
              size="sm"
              layout="card"
            />
          </div>
          <AddToCartButton
            className="flex-1"
            canAdd={canAdd}
            added={added}
            ctaHint={ctaHint}
            onAdd={handleAdd}
          />
        </div>
      </div>
    </>
  );
}
