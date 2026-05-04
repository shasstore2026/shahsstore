import HeroBanner from "@/components/HeroBanner";
import ProductCard from "@/components/ProductCard";
import {
  getHomepageContent,
  getFeaturedProducts,
  getShirtStyles,
  getHeroBanner,
} from "@/lib/products";
import Link from "next/link";
import { Product } from "@/types";

export default async function HomePage() {
  const [content, featuredProducts, shirtStyles, banner] = await Promise.all([
    getHomepageContent(),
    getFeaturedProducts(),
    getShirtStyles(),
    getHeroBanner(),
  ]);

  const visibleStyles = shirtStyles.slice(0, 4);
  const hasMore = shirtStyles.length > 4;

  return (
    <div className="bg-[#FAFAF8]">
      {banner && <HeroBanner banner={banner} />}

      {/* Shirt Styles Section — dynamic */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs tracking-[0.4em] text-stone-400 uppercase mb-3">
            Explore
          </p>
          <h2
            className="text-3xl md:text-5xl text-stone-900 font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Shop Shirts by Style
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {visibleStyles.map((style) => (
            <Link
              key={style.id}
              href={`/products?category=${encodeURIComponent(style.name)}`} // ← fixed ✅
              className="group relative overflow-hidden"
            >
              <div className="relative h-72 bg-stone-100 overflow-hidden">
                <img
                  src={style.image}
                  alt={style.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3
                    className="text-white text-lg font-light tracking-wide"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {style.name}
                  </h3>
                  <p className="text-stone-300 text-xs tracking-widest mt-1 group-hover:text-white transition-colors">
                    {style.description} →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-block border border-stone-300 text-stone-500 px-10 py-3 text-xs tracking-[0.3em] uppercase hover:border-stone-700 hover:text-stone-900 transition-all duration-300"
            >
              See All Styles ({shirtStyles.length})
            </Link>
          </div>
        )}
      </section>

      {/* Featured Shirts */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-12 md:pb-24">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8 md:mb-12">
          <div>
            <p className="text-xs tracking-[0.4em] text-stone-400 uppercase mb-3">
              Handpicked
            </p>
            <h2
              className="text-3xl md:text-5xl text-stone-900 font-light"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Featured Shirts
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs tracking-[0.2em] uppercase text-stone-400 hover:text-stone-800 transition-colors border-b border-stone-300 pb-0.5"
          >
            View All Shirts
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p
              className="text-stone-400 font-light text-lg"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              No featured shirts yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featuredProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Marquee Banner — dynamic */}
      <section className="bg-stone-900 text-white py-5 overflow-hidden">
        <div className="flex gap-16 whitespace-nowrap animate-marquee text-xs tracking-[0.3em] uppercase font-light">
          {Array(6)
            .fill(content.marquee_items)
            .flat()
            .map((text: string, i: number) => (
              <span key={i} className="text-stone-400">
                {text} &nbsp; ✦
              </span>
            ))}
        </div>
      </section>

      {/* Why Shasstore */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="text-center mb-10 md:mb-16">
          <p className="text-xs tracking-[0.4em] text-stone-400 uppercase mb-3">
            Why Shasstore
          </p>
          <h2
            className="text-3xl md:text-5xl text-stone-900 font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {content.why_title}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {[
            { icon: "🧵", title: "Premium Fabrics", desc: "Each shirt uses hand-selected cotton, linen, and blended fabrics sourced for comfort and longevity." },
            { icon: "📐", title: "Precision Tailoring", desc: "Every cut is engineered for the Indian physique — slim, regular, and relaxed fits available." },
            { icon: "✦", title: "Timeless Design", desc: "We don't chase trends. Our shirts are built to look sharp year after year, occasion after occasion." },
          ].map((item) => (
            <div key={item.title} className="text-center border border-stone-100 bg-white p-10 hover:shadow-md transition-shadow duration-300">
              <div className="text-4xl mb-5">{item.icon}</div>
              <h3 className="text-xl text-stone-900 font-light mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {item.title}
              </h3>
              <p className="text-stone-500 text-sm font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section — dynamic */}
      <section className="bg-[#F5F0E8] py-16 md:py-32 text-center px-4">
        <p className="text-xs tracking-[0.4em] text-stone-400 uppercase mb-5">
          The Shasstore Promise
        </p>
        <h2
          className="text-3xl md:text-5xl lg:text-6xl text-stone-900 font-light mb-6 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {content.cta_title}
        </h2>
        <p className="text-stone-500 font-light max-w-lg mx-auto mb-10 leading-relaxed text-sm md:text-base">
          {content.cta_subtitle}
        </p>
        <Link
          href="/products"
          className="inline-block bg-stone-900 text-white px-12 py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all duration-300"
        >
          {content.cta_button_text}
        </Link>
      </section>
    </div>
  );
}
