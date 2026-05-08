import ProductCard from "@/components/ProductCard";
import { getProducts, getCategories } from "@/lib/products";
import { Product } from "@/types";
import Link from "next/link";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; fit?: string; fabric?: string; occasion?: string }>;
}) {
  const params = await searchParams;
  const [allProducts, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  // Active category — from any query param
  const cat = params.fit ?? params.fabric ?? params.occasion ?? params.category;

  // Filter products
  const filtered: Product[] = cat
    ? allProducts.filter((p) => p.category.toLowerCase() === cat.toLowerCase())
    : allProducts;

  // Page title
  const activeCat = categories.find(
    (c) => c.name.toLowerCase() === cat?.toLowerCase()
  );
  const pageTitle = cat ? (activeCat?.name ?? cat) : "The Collection";
  const pageSub = cat
    ? activeCat?.description ?? "A handpicked edit, refreshed often."
    : "Every piece, hand-curated for you.";

  return (
    <div className="bg-[var(--color-shas-bg)] min-h-screen">
      {/* Editorial header */}
      <div className="relative bg-[var(--color-shas-cream)] pt-24 md:pt-36 pb-10 md:pb-16 px-4 md:px-8 overflow-hidden">
        {/* Soft mesh */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 12% 80%, #F4D9CF 0%, transparent 40%),
              radial-gradient(circle at 88% 20%, #E8DDD0 0%, transparent 35%)
            `,
          }}
        />
        <p
          aria-hidden
          className="font-italiana absolute top-12 right-6 md:right-16 text-[6rem] md:text-[10rem] text-[var(--color-shas-rose)]/15 leading-none select-none pointer-events-none hidden sm:block"
        >
          ✦
        </p>

        <div className="relative max-w-7xl mx-auto">
          <span className="divider-rose mb-4">Curated Edit</span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-[var(--color-shas-plum)] font-light leading-[1.05]">
            {pageTitle}
          </h1>
          <p className="text-[var(--color-shas-muted)] mt-3 md:mt-4 max-w-xl text-sm md:text-base font-light">
            {pageSub}
          </p>
          <p className="mt-4 md:mt-6 text-xs tracking-[0.3em] uppercase text-[var(--color-shas-muted)]">
            {filtered.length} {filtered.length === 1 ? "Piece" : "Pieces"}
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="border-b border-[var(--color-shas-line)] bg-[var(--color-shas-bg)]/95 backdrop-blur-md sticky z-30 top-[calc(76px+var(--top-bar-height,0px))] md:top-[calc(94px+var(--top-bar-height,0px))]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-3 md:gap-4 overflow-x-auto py-3">
          <Link
            href="/products"
            className={`px-5 py-2 text-[0.7rem] tracking-[0.25em] uppercase font-medium whitespace-nowrap rounded-full border transition-all duration-300 ${
              !cat
                ? "border-[var(--color-shas-plum)] bg-[var(--color-shas-plum)] text-white"
                : "border-[var(--color-shas-line-strong)] text-[var(--color-shas-muted)] hover:border-[var(--color-shas-rose)] hover:text-[var(--color-shas-rose)]"
            }`}
          >
            All
          </Link>

          {categories.map((c) => {
            const isActive = cat?.toLowerCase() === c.name.toLowerCase();
            return (
              <Link
                key={c.id}
                href={`/products?category=${encodeURIComponent(c.name)}`}
                className={`px-5 py-2 text-[0.7rem] tracking-[0.25em] uppercase font-medium whitespace-nowrap rounded-full border transition-all duration-300 ${
                  isActive
                    ? "border-[var(--color-shas-plum)] bg-[var(--color-shas-plum)] text-white"
                    : "border-[var(--color-shas-line-strong)] text-[var(--color-shas-muted)] hover:border-[var(--color-shas-rose)] hover:text-[var(--color-shas-rose)]"
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display italic text-3xl text-[var(--color-shas-rose)] mb-3">
              Nothing here yet.
            </p>
            <p className="text-sm text-[var(--color-shas-muted)] max-w-sm mx-auto mb-6 font-light">
              We&apos;re still styling this drop. Browse the full edit while we get this category ready.
            </p>
            <Link href="/products" className="link-underline text-xs tracking-[0.3em] uppercase">
              View Everything →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-7">
            {filtered.map((product: Product, i) => (
              <div key={product.id} className="reveal" style={{ ['--reveal-delay' as string]: `${(i % 8) * 0.06}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
