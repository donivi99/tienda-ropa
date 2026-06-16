import { DiscountBadge } from '../ProductPrice';
import { optimizeImageUrl } from '../../config/cloudinary';

interface ProductGalleryProps {
  images: string[];
  name: string;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  discountPercent?: number;
  isOutOfStock?: boolean;
  lowStock?: boolean;
}

export default function ProductGallery({
  images,
  name,
  currentIndex,
  onIndexChange,
  discountPercent,
  isOutOfStock,
  lowStock,
}: ProductGalleryProps) {
  const hasMultiple = images.length > 1;
  const showDiscount = discountPercent != null && discountPercent > 0;

  const goPrev = () => onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  const goNext = () => onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1);

  return (
    <div className="space-y-4">
      <div className="group relative aspect-[3/4] overflow-hidden rounded-[1.5rem] border border-[#2a2520] bg-[#1e1b18] shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
        <img
          src={optimizeImageUrl(images[currentIndex], 800)}
          srcSet={`${optimizeImageUrl(images[currentIndex], 480)} 480w, ${optimizeImageUrl(images[currentIndex], 800)} 800w, ${optimizeImageUrl(images[currentIndex], 1200)} 1200w`}
          sizes="(max-width: 1024px) 100vw, 50vw"
          alt={name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-[#0a0a0a]/15" />

        {showDiscount && (
          <div className="absolute right-4 top-4">
            <DiscountBadge percent={discountPercent} variant="solid" />
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="rounded-full border border-[#d4af37] bg-[#0a0a0a] px-4 py-1.5 text-sm font-medium uppercase tracking-wider text-[#f5e6c8]">
              Agotado
            </span>
          </div>
        )}

        {!isOutOfStock && lowStock && (
          <span className="absolute bottom-4 left-4 rounded-full border border-[#d4af37]/50 bg-[#0a0a0a]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37] backdrop-blur-sm">
            Últimas unidades
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-[#2a2520]/80 bg-[#0a0a0a]/75 p-2 text-[#f5e6c8] opacity-0 backdrop-blur-sm transition-opacity hover:border-[#d4af37]/50 group-hover:opacity-100 focus:opacity-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[#2a2520]/80 bg-[#0a0a0a]/75 p-2 text-[#f5e6c8] opacity-0 backdrop-blur-sm transition-opacity hover:border-[#d4af37]/50 group-hover:opacity-100 focus:opacity-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIndexChange(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === currentIndex}
              className={`h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                i === currentIndex
                  ? 'border-[#d4af37] ring-2 ring-[#d4af37]/25'
                  : 'border-[#2a2520] opacity-75 hover:border-[#d4af37]/50 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
