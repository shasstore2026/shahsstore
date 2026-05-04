import Link from "next/link";
import type { HeroBanner } from "@/lib/products";

export default function HeroBanner({ banner }: { banner: HeroBanner }) {
  return (
    <section className="relative md:min-h-screen bg-[#F5F0E8] overflow-hidden flex items-center">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, #e8ddd0 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #f0e8dc 0%, transparent 50%)`,
        }}
      />

      <div
        className="relative max-w-7xl mx-auto px-4 md:px-8 w-full pt-20 md:pt-24 pb-16 md:pb-0 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 items-center md:min-h-screen"
      >
        {/* Left Content */}
        <div>
          <p className="text-xs tracking-[0.4em] text-stone-400 uppercase mb-4 md:mb-8">
            {banner.season_label}
          </p>
          <h1
            className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-stone-900 leading-[1.05] mb-4 md:mb-8"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
          >
            {banner.headline_line1}
            <br />
            {banner.headline_line2}
            <br />
            <em className="text-stone-500">{banner.headline_italic}</em>
          </h1>
          <p className="text-stone-500 text-sm md:text-base font-light leading-relaxed mb-6 md:mb-10 max-w-md">
            {banner.subtext}
          </p>
         <div className="flex gap-5 flex-wrap">
  <Link
    href="/products"
    className="bg-stone-900 text-white px-10 py-4 text-xs tracking-[0.25em] uppercase font-medium hover:bg-stone-700 transition-all duration-300"
  >
    Shop the Collection
  </Link>
</div>


          {/* Stats */}
          <div className="flex gap-6 md:gap-10 mt-6 md:mt-16 pt-6 md:pt-10 border-t border-stone-200">
            {[
              [banner.stat1_value, banner.stat1_label],
              [banner.stat2_value, banner.stat2_label],
              [banner.stat3_value, banner.stat3_label],
            ].map(([val, label]) => (
              <div key={label}>
                <p className="text-xl font-light text-stone-900"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {val}
                </p>
                <p className="text-xs text-stone-400 tracking-widest uppercase mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — image block */}
        <div className="relative">
          {/* Desktop layout */}
          <div className="relative hidden md:block h-[600px] w-full">
            <div className="absolute right-0 top-0 w-4/5 h-[520px] bg-stone-200 overflow-hidden">
              {banner.main_image ? (
                <img
                  src={banner.main_image}
                  alt="Premium men's shirt"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                  <p className="text-stone-400 text-xs tracking-widest uppercase">No image set</p>
                </div>
              )}
            </div>
            <div className="absolute left-0 bottom-0 w-2/5 h-52 bg-[#e8ddd0] flex items-end p-6">
              <div>
                <p className="text-xs text-stone-500 tracking-widest uppercase mb-1">
                  {banner.accent_card_badge}
                </p>
                <p className="text-stone-800 font-light"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem" }}>
                  {banner.accent_card_title}
                </p>
                <p className="text-stone-500 text-sm mt-1">{banner.accent_card_price}</p>
                <Link
                  href={banner.accent_card_link}
                  className="text-xs text-stone-600 underline underline-offset-4 mt-2 inline-block hover:text-stone-900 transition-colors"
                >
                  View →
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden">
            <div className="relative w-full h-[300px] sm:h-[380px] bg-stone-200 overflow-hidden">
              {banner.main_image ? (
                <img
                  src={banner.main_image}
                  alt="Premium men's shirt"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                  <p className="text-stone-400 text-xs tracking-widest uppercase">No image set</p>
                </div>
              )}
            </div>
            <div className="bg-[#e8ddd0] p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-stone-500 tracking-widest uppercase mb-1">
                  {banner.accent_card_badge}
                </p>
                <p className="text-stone-800 font-light"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>
                  {banner.accent_card_title}
                </p>
                <p className="text-stone-500 text-sm mt-1">{banner.accent_card_price}</p>
              </div>
              <Link
                href={banner.accent_card_link}
                className="text-xs text-stone-600 underline underline-offset-4 hover:text-stone-900 transition-colors whitespace-nowrap"
              >
                View →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2">
        <span className="text-xs tracking-[0.3em] uppercase text-stone-400">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-stone-400 to-transparent" />
      </div>
    </section>
  );
}
