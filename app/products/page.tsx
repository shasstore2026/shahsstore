import ProductCard from "@/components/ProductCard";
import { getProducts, getProductsByCategory, getShirtStyles } from "@/lib/products";
import { Product } from "@/types";
import Link from "next/link";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; fit?: string; fabric?: string; occasion?: string }>;
}) {
  const params = await searchParams;
  const [allProducts, shirtStyles] = await Promise.all([
    getProducts(),
    getShirtStyles(),
  ]);

  // Active category — from any query param
  const cat = params.fit ?? params.fabric ?? params.occasion ?? params.category;

  // Filter products by matching category name against shirt style names
  const filtered: Product[] = cat
    ? allProducts.filter((p) => p.category.toLowerCase() === cat.toLowerCase())
    : allProducts;

  // Page title — use matching shirt style name or fallback
  const activeStyle = shirtStyles.find(
    (s) => s.name.toLowerCase() === cat?.toLowerCase()
  );
  const pageTitle = cat ? (activeStyle?.name ?? cat) : "All Men's Shirts";

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      {/* Page Header */}
      <div className="bg-[#F5F0E8] pt-20 md:pt-32 pb-8 md:pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.4em] text-stone-400 uppercase mb-3">
            Men&apos;s Shirts
          </p>
          <h1
            className="text-3xl md:text-5xl text-stone-900 font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Filter Tabs — dynamic from shirt_styles. Top offset matches the
          actual navbar height (76px mobile / 94px desktop after the
          Shasstore/Fashion two-line wordmark) so the bar pins flush below it. */}
      <div className="border-b border-stone-200 bg-white sticky z-40 top-[calc(76px+var(--top-bar-height,0px))] md:top-[calc(94px+var(--top-bar-height,0px))]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-4 md:gap-8 overflow-x-auto">

          {/* All Shirts tab — always first */}
          <Link
            href="/products"
            className={`py-4 text-xs tracking-[0.2em] uppercase font-medium whitespace-nowrap border-b-2 transition-all duration-300 ${
              !cat
                ? "border-[#c8b89a] text-[#c8b89a]"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            All Shirts
          </Link>

          {/* Dynamic tabs from shirt_styles table */}
          {shirtStyles.map((style) => {
            const isActive = cat?.toLowerCase() === style.name.toLowerCase();
            return (
              <Link
                key={style.id}
                href={`/products?category=${encodeURIComponent(style.name)}`}
                className={`py-4 text-xs tracking-[0.2em] uppercase font-medium whitespace-nowrap border-b-2 transition-all duration-300 ${
                  isActive
                    ? "border-[#c8b89a] text-[#c8b89a]"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                {style.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-14">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p
              className="text-stone-400 text-lg font-light"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              No shirts found in this category.
            </p>
            <Link
              href="/products"
              className="text-xs tracking-widest uppercase text-stone-500 underline underline-offset-4 mt-4 inline-block hover:text-stone-900 transition-colors"
            >
              View All Shirts
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
              {filtered.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
