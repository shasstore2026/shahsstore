import ProductCard from "@/components/ProductCard";
import Breadcrumb from "@/components/Breadcrumb";
import { getProducts, getCategories } from "@/lib/products";
import { Product } from "@/types";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; fit?: string; fabric?: string; occasion?: string }>;
}) {
  const params = await searchParams;

  // Active category — from any query param
  const cat = params.fit ?? params.fabric ?? params.occasion ?? params.category;

  // No category? There's no flat "all products" view — send them to the
  // category-card page where they pick what to browse.
  if (!cat) redirect("/collection");

  const [allProducts, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  // Filter products to the chosen category
  const filtered: Product[] = allProducts.filter(
    (p) => p.category.toLowerCase() === cat.toLowerCase()
  );

  // Page title — the category name itself
  const activeCat = categories.find(
    (c) => c.name.toLowerCase() === cat.toLowerCase()
  );
  const pageTitle = activeCat?.name ?? cat;
  const pageSub = activeCat?.description ?? "A handpicked edit, refreshed often.";

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
          <Breadcrumb
            className="mb-5"
            items={[
              { label: "Home", href: "/" },
              { label: "Category", href: "/collection" },
              { label: pageTitle },
            ]}
          />

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-[var(--color-shas-plum)] font-light leading-[1.05]">
            {pageTitle}
          </h1>
          <p className="text-[var(--color-shas-muted)] mt-3 md:mt-4 max-w-xl text-sm md:text-base font-light">
            {pageSub}
          </p>
        </div>
      </div>

      {/* Product Grid (chip filter strip removed — browsing by category now happens via /collection) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display italic text-3xl text-[var(--color-shas-rose)] mb-3">
              Nothing here yet.
            </p>
            <p className="text-sm text-[var(--color-shas-muted)] max-w-sm mx-auto mb-6 font-light">
              We&apos;re still styling this drop. Try another category while we get this one ready.
            </p>
            <Link href="/collection" className="btn-rose-outline">
              Browse Categories
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
