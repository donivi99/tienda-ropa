function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 pb-28 lg:pb-8">
      <div className="mb-6 h-4 w-64 rounded bg-[#1e1b18]" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-[3/4] rounded-[1.5rem] bg-[#141210]" />
        <div className="space-y-4">
          <div className="h-3 w-40 rounded bg-[#1e1b18]" />
          <div className="h-10 w-3/4 rounded bg-[#1e1b18]" />
          <div className="h-8 w-32 rounded bg-[#1e1b18]" />
          <div className="space-y-2 pt-4">
            <div className="h-3 w-full rounded bg-[#141210]" />
            <div className="h-3 w-full rounded bg-[#141210]" />
            <div className="h-3 w-2/3 rounded bg-[#141210]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailSkeleton;
