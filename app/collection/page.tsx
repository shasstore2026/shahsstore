import Link from "next/link";
import { getCategories } from "@/lib/products";

export const metadata = {
  title: "The Collection — Shasstore",
  description: "Browse the curated edit by category — dresses, jewellery, and beyond.",
};

export default async function CollectionPage() {
  const categories = await getCategories();

  return (
    <div className="bg-[var(--color-shas-bg)] min-h-screen">
      {/* Editorial header */}
      <div className="relative bg-[var(--color-shas-cream)] pt-28 md:pt-40 pb-12 md:pb-20 px-4 md:px-8 overflow-hidden">
        {/* Soft mesh */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-70 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 14% 80%, #F4D9CF 0%, transparent 42%),
              radial-gradient(circle at 86% 22%, #E8DDD0 0%, transparent 38%),
              radial-gradient(circle at 50% 50%, #F5EFE6 0%, transparent 60%)
            `,
          }}
        />
        <p
          aria-hidden
          className="font-italiana absolute top-16 right-6 md:right-16 text-[7rem] md:text-[12rem] text-[var(--color-shas-rose)]/15 leading-none select-none pointer-events-none hidden sm:block"
        >
          ✦
        </p>

        <div className="relative max-w-7xl mx-auto text-center">
          <span className="divider-rose mb-5">The Collection</span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-[var(--color-shas-plum)] font-light leading-[1.05]">
            Shop by <em className="text-[var(--color-shas-rose)]">category</em>
          </h1>
          <p className="text-[var(--color-shas-muted)] mt-4 md:mt-5 max-w-xl mx-auto text-sm md:text-base font-light">
            From hand-finished dresses to jewellery designed to be passed down — every piece is chosen with care.
          </p>
          <p className="mt-5 md:mt-7 text-xs tracking-[0.3em] uppercase text-[var(--color-shas-muted)]">
            {categories.length} {categories.length === 1 ? "Category" : "Categories"}
          </p>
        </div>
      </div>

      {/* Category cards */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {categories.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[var(--color-shas-line-strong)]">
            <p className="font-display italic text-2xl text-[var(--color-shas-rose)] mb-2">
              Categories coming soon
            </p>
            <p className="text-sm text-[var(--color-shas-muted)] max-w-sm mx-auto font-light">
              Add categories from the admin panel to see them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group relative overflow-hidden reveal"
                style={{ ['--reveal-delay' as string]: `${(idx % 6) * 0.06}s` }}
              >
                <div className="relative h-[22rem] md:h-[28rem] bg-[var(--color-shas-cream)] overflow-hidden img-zoom-wrap">
                  {cat.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* No image → editorial gradient with the category name as the visual */
                    <div className="w-full h-full bg-gradient-to-br from-[var(--color-shas-blush)] via-[var(--color-shas-cream)] to-white flex items-center justify-center p-8 relative">
                      <p
                        aria-hidden
                        className="font-italiana absolute -bottom-6 -right-2 text-[10rem] text-[var(--color-shas-rose)]/15 leading-none select-none pointer-events-none"
                      >
                        ✦
                      </p>
                      <p className="font-display italic text-4xl md:text-5xl text-[var(--color-shas-plum)]/70 text-center leading-tight relative z-10">
                        {cat.name}
                      </p>
                    </div>
                  )}

                  {/* Bottom gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-shas-plum)]/75 via-[var(--color-shas-plum)]/15 to-transparent" />

                  {/* Card label */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-7">
                    <p className="text-[var(--color-shas-blush)] text-[0.65rem] tracking-[0.4em] uppercase mb-2 opacity-90">
                      Edit {String(cat.display_order).padStart(2, "0")}
                    </p>
                    <h2 className="font-display text-white text-3xl md:text-4xl font-light leading-tight">
                      {cat.name}
                    </h2>
                    {cat.description && (
                      <p className="text-white/85 text-sm mt-2 line-clamp-2 group-hover:text-[var(--color-shas-blush)] transition-colors">
                        {cat.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-2 text-[0.7rem] text-[var(--color-shas-blush)] tracking-[0.3em] uppercase mt-4 group-hover:gap-3 transition-all">
                      Shop the edit →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Soft below-grid CTA back to flat product list */}
        <div className="mt-14 md:mt-20 text-center">
          <p className="font-display italic text-xl text-[var(--color-shas-muted)] mb-4">
            Or wander through the entire collection
          </p>
          <Link href="/products" className="btn-rose-outline">
            View Every Piece
          </Link>
        </div>
      </div>
    </div>
  );
}
