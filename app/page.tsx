import HeroBanner from "@/components/HeroBanner";
import ProductCard from "@/components/ProductCard";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import {
  getHomepageContent,
  getFeaturedProducts,
  getCategories,
  getHeroBanner,
} from "@/lib/products";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";

export default async function HomePage() {
  const [content, featuredProducts, categories, banner] = await Promise.all([
    getHomepageContent(),
    getFeaturedProducts(),
    getCategories(),
    getHeroBanner(),
  ]);

  const visibleCategories = categories.slice(0, 4);

  return (
    <div className="bg-[var(--color-shas-bg)]">
      {banner && <HeroBanner banner={banner} />}

      {/* ────────────────────────────────────────────────────────────
          1. USP marquee strip
          ──────────────────────────────────────────────────────────── */}
      {content.show_usp_strip && content.marquee_items.length > 0 && (
        <section className="bg-[var(--color-shas-plum)] text-white/85 py-4 overflow-hidden">
          <div className="marquee-row text-[0.65rem] tracking-[0.4em] uppercase font-light">
            {Array(4)
              .fill(content.marquee_items)
              .flat()
              .map((text: string, i: number) => (
                <span key={i} className="flex items-center gap-3">
                  <span className="text-[var(--color-shas-rose)]">✦</span>
                  <span>{text}</span>
                </span>
              ))}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
          2. Shop by Category
          ──────────────────────────────────────────────────────────── */}
      {content.show_categories && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-28">
          <div className="text-center mb-12 md:mb-16 reveal">
            <span className="divider-rose mb-5">Shop by Category</span>
            <h2 className="font-display text-4xl md:text-6xl text-[var(--color-shas-plum)] font-light leading-tight max-w-2xl mx-auto">
              For every <em className="text-[var(--color-shas-rose)]">moment</em> of you
            </h2>
          </div>

          {visibleCategories.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[var(--color-shas-line-strong)]">
              <p className="font-display italic text-2xl text-[var(--color-shas-rose)]">
                Categories will appear here once added in the admin
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {visibleCategories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="group relative overflow-hidden reveal"
                  style={{ ['--reveal-delay' as string]: `${idx * 0.08}s` }}
                >
                  <div className="relative h-[20rem] md:h-[26rem] bg-[var(--color-shas-cream)] overflow-hidden img-zoom-wrap">
                    {cat.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--color-shas-blush)] to-[var(--color-shas-cream)] flex items-end p-6">
                        <p className="font-display text-3xl text-[var(--color-shas-plum)] italic opacity-60">
                          {cat.name}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-shas-plum)]/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                      <h3 className="font-display text-white text-2xl md:text-3xl font-light leading-tight">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-white/80 text-xs md:text-sm tracking-wide mt-1.5 line-clamp-1 group-hover:text-[var(--color-shas-blush)] transition-colors">
                          {cat.description}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-2 text-[0.65rem] text-[var(--color-shas-blush)] tracking-[0.3em] uppercase mt-3 group-hover:gap-3 transition-all">
                        Discover →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Always show the "See all" CTA — even with ≤4 categories, users
              expect a way into the dedicated collection page. */}
          <div className="text-center mt-10 md:mt-14">
            <Link href="/collection" className="btn-rose-outline">
              See All Categories ({categories.length})
            </Link>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
          3. Just Arrived / Featured pieces
          ──────────────────────────────────────────────────────────── */}
      {content.show_featured && (
        <section className="bg-[var(--color-shas-cream)]/40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-28">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10 md:mb-14">
              <div>
                <span className="divider-rose mb-4">Just Arrived</span>
                <h2 className="font-display text-3xl md:text-5xl text-[var(--color-shas-plum)] font-light">
                  Pieces we&apos;re loving right now
                </h2>
              </div>
              <Link href="/products" className="link-underline text-[0.7rem] tracking-[0.3em] uppercase">
                View Everything →
              </Link>
            </div>

            {featuredProducts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[var(--color-shas-line-strong)] bg-white/40">
                <p className="font-display italic text-2xl text-[var(--color-shas-rose)] mb-2">
                  Featured pieces will appear here
                </p>
                <p className="text-sm text-[var(--color-shas-muted)]">
                  Mark a product as featured in the admin to see it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-7">
                {featuredProducts.map((product: Product, idx) => (
                  <div key={product.id} className="reveal" style={{ ['--reveal-delay' as string]: `${idx * 0.08}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
          4. Editorial spotlight (Story)
          ──────────────────────────────────────────────────────────── */}
      {content.show_story && (content.story_title || content.story_image) && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="relative order-2 md:order-1 reveal">
            <div className="relative aspect-[4/5] overflow-hidden img-zoom-wrap shadow-[0_20px_60px_-20px_rgba(62,31,42,0.3)]">
              {content.story_image ? (
                <Image
                  src={content.story_image}
                  alt={content.story_title || "Our story"}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-shas-blush)] to-[var(--color-shas-cream)] flex items-center justify-center">
                  <p className="font-display italic text-2xl text-[var(--color-shas-rose)]">Add a story image</p>
                </div>
              )}
            </div>
            <div className="hidden md:block absolute -right-6 -bottom-8 w-44 h-44 bg-[var(--color-shas-blush)] -z-10" />
            <div className="hidden md:block absolute -left-6 -top-8 w-24 h-24 border-2 border-[var(--color-shas-rose)] -z-10" />
          </div>

          <div className="order-1 md:order-2 reveal" style={{ ['--reveal-delay' as string]: '0.15s' }}>
            {content.story_eyebrow && (
              <span className="divider-rose mb-5">{content.story_eyebrow}</span>
            )}
            {content.story_title && (
              <h2 className="font-display text-3xl md:text-5xl text-[var(--color-shas-plum)] font-light leading-[1.1] mb-6">
                {content.story_title}
              </h2>
            )}
            {content.story_subtitle && (
              <p className="text-[var(--color-shas-muted)] text-base font-light leading-relaxed mb-4 max-w-lg">
                {content.story_subtitle}
              </p>
            )}
            {content.story_paragraph && (
              <p className="text-[var(--color-shas-muted)] text-sm font-light leading-relaxed mb-8 max-w-lg italic">
                {content.story_paragraph}
              </p>
            )}
            {content.story_cta_text && (
              <div className="flex gap-3 flex-wrap">
                <Link href={content.story_cta_link || "/products"} className="btn-plum">
                  {content.story_cta_text}
                </Link>
                <Link href="/company#about" className="link-underline text-[0.7rem] tracking-[0.3em] uppercase pt-3">
                  Read more →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
          5. Lookbook
          ──────────────────────────────────────────────────────────── */}
      {content.show_lookbook && content.lookbook_images.length > 0 && (
        <section className="bg-[var(--color-shas-plum)] text-white py-16 md:py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10 md:mb-16 reveal">
              {content.lookbook_eyebrow && (
                <span className="divider-rose text-[var(--color-shas-blush)] mb-4">
                  {content.lookbook_eyebrow}
                </span>
              )}
              {content.lookbook_title && (
                <h2 className="font-display text-3xl md:text-5xl text-white font-light">
                  {content.lookbook_title}
                </h2>
              )}
              {content.lookbook_subtitle && (
                <p className="text-white/60 mt-3 max-w-md mx-auto text-sm font-light">
                  {content.lookbook_subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-6 grid-rows-2 gap-3 md:gap-5 h-[440px] md:h-[640px]">
              {content.lookbook_images.slice(0, 4).map((item, idx) => {
                const layout = [
                  "col-span-3 row-span-2",
                  "col-span-3 row-span-1",
                  "col-span-2 row-span-1",
                  "col-span-1 row-span-1",
                ][idx];
                return (
                  <Link
                    key={idx}
                    href={item.link || "/products"}
                    className={`${layout} relative overflow-hidden img-zoom-wrap reveal`}
                    style={{ ['--reveal-delay' as string]: `${idx * 0.08}s` }}
                  >
                    <Image
                      src={item.image}
                      alt={item.label || `Look ${idx + 1}`}
                      fill
                      sizes={idx === 0 ? "(max-width: 768px) 50vw, 50vw" : "(max-width: 768px) 33vw, 33vw"}
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    {item.label && (
                      <span className="absolute bottom-3 md:bottom-5 left-4 md:left-5 text-white text-xs tracking-[0.3em] uppercase">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
          6. From our customers — testimonials
          ──────────────────────────────────────────────────────────── */}
      {content.show_testimonials && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-28">
          <div className="text-center mb-12 md:mb-16 reveal">
            {content.testimonials_eyebrow && (
              <span className="divider-rose mb-4">{content.testimonials_eyebrow}</span>
            )}
            {content.testimonials_title && (
              <h2 className="font-display text-3xl md:text-5xl text-[var(--color-shas-plum)] font-light">
                {content.testimonials_title}
              </h2>
            )}
          </div>

          <TestimonialsCarousel items={content.testimonials} />
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
          7. Instagram strip
          ──────────────────────────────────────────────────────────── */}
      {content.show_instagram && content.instagram_images.length > 0 && (
        <section className="border-t border-[var(--color-shas-line)] bg-[var(--color-shas-cream)]/40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-20">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8 md:mb-10">
              <div>
                {content.instagram_eyebrow && (
                  <span className="divider-rose mb-3">{content.instagram_eyebrow}</span>
                )}
                {content.instagram_title && (
                  <h2 className="font-display text-2xl md:text-4xl text-[var(--color-shas-plum)] font-light">
                    {content.instagram_title}
                  </h2>
                )}
              </div>
              {content.instagram_profile_url && (
                <a
                  href={content.instagram_profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-[0.7rem] tracking-[0.3em] uppercase"
                >
                  Follow Us →
                </a>
              )}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
              {content.instagram_images.slice(0, 6).map((src, i) => (
                <a
                  key={i}
                  href={content.instagram_profile_url || "#"}
                  target={content.instagram_profile_url ? "_blank" : undefined}
                  rel={content.instagram_profile_url ? "noopener noreferrer" : undefined}
                  className="relative aspect-square overflow-hidden img-zoom-wrap reveal group"
                  style={{ ['--reveal-delay' as string]: `${i * 0.05}s` }}
                >
                  <Image
                    src={src}
                    alt={`Instagram post ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 16vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[var(--color-shas-plum)]/0 group-hover:bg-[var(--color-shas-plum)]/40 transition-colors duration-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
          8. Closing CTA
          ──────────────────────────────────────────────────────────── */}
      {content.show_closing_cta && (content.closing_cta_title || content.closing_cta_subtitle) && (
        <section className="relative bg-[var(--color-shas-blush)] py-16 md:py-32 text-center px-4 overflow-hidden">
          <div aria-hidden className="absolute -top-12 -left-12 w-72 h-72 rounded-full bg-[var(--color-shas-rose)]/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/40 blur-3xl" />

          <div className="relative z-10 reveal">
            {content.closing_cta_eyebrow && (
              <span className="divider-rose mb-5">{content.closing_cta_eyebrow}</span>
            )}
            {(content.closing_cta_title || content.closing_cta_title_accent) && (
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-[var(--color-shas-plum)] font-light mb-6 leading-[1.05] max-w-3xl mx-auto">
                {content.closing_cta_title}
                {content.closing_cta_title_accent && (
                  <em className="text-[var(--color-shas-rose)]"> {content.closing_cta_title_accent}</em>
                )}
              </h2>
            )}
            {content.closing_cta_subtitle && (
              <p className="text-[var(--color-shas-plum)]/70 font-light max-w-lg mx-auto mb-10 leading-relaxed text-sm md:text-base">
                {content.closing_cta_subtitle}
              </p>
            )}
            <div className="flex justify-center gap-3 flex-wrap">
              {content.closing_cta_primary_text && (
                <Link href={content.closing_cta_primary_link || "/products"} className="btn-plum">
                  {content.closing_cta_primary_text}
                </Link>
              )}
              {content.closing_cta_secondary_text && (
                <Link href={content.closing_cta_secondary_link || "/help"} className="btn-rose-outline">
                  {content.closing_cta_secondary_text}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
