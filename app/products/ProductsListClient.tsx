"use client";
import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";

type SortKey = "newest" | "price_asc" | "price_desc" | "featured" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",     label: "Newest" },
  { value: "featured",   label: "Featured" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name",       label: "Name: A–Z" },
];

/**
 * Client-side filter + sort for a single category's product list.
 *
 * Why client-side: we already fetch the whole (small) category list on
 * the server. Filtering with React state keeps the UX snappy and avoids
 * a server round-trip per click. If the catalog ever grows past a few
 * hundred per category we can move to URL-driven server filtering.
 */
export default function ProductsListClient({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>("newest");
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Sizes available in this category (top sizes + bottom sizes).
  // Skip jewellery's "One Size" since filtering on it is meaningless.
  const allSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.sizes.forEach((s) => set.add(s));
      (p.bottom_sizes ?? []).forEach((s) => set.add(s));
    });
    set.delete("One Size");
    return [...set];
  }, [products]);

  const hasSizeFilter = allSizes.length > 1;

  // Always derive max price for the on-sale toggle hint
  const onSaleCount = useMemo(
    () =>
      products.filter(
        (p) => !!p.original_price && p.original_price > p.price
      ).length,
    [products]
  );
  const hasSaleFilter = onSaleCount > 0;

  // Filter + sort
  const visible = useMemo(() => {
    let result = products;

    if (sizeFilter.length > 0) {
      result = result.filter((p) =>
        sizeFilter.some(
          (s) => p.sizes.includes(s) || (p.bottom_sizes ?? []).includes(s)
        )
      );
    }

    if (onSaleOnly) {
      result = result.filter(
        (p) => !!p.original_price && p.original_price > p.price
      );
    }

    const next = [...result];
    switch (sort) {
      case "price_asc":
        next.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        next.sort((a, b) => b.price - a.price);
        break;
      case "name":
        next.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
        next.sort((a, b) => {
          const af = a.featuredOrder ?? Number.MAX_SAFE_INTEGER;
          const bf = b.featuredOrder ?? Number.MAX_SAFE_INTEGER;
          return af - bf;
        });
        break;
      case "newest":
      default:
        // Server returns by created_at asc → reverse for newest first
        next.reverse();
    }
    return next;
  }, [products, sort, sizeFilter, onSaleOnly]);

  const activeFilterCount = sizeFilter.length + (onSaleOnly ? 1 : 0);

  function toggleSize(size: string) {
    setSizeFilter((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function clearFilters() {
    setSizeFilter([]);
    setOnSaleOnly(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      {/*
        Filter + sort region — sticky beneath the fixed navbar.

        - The whole region (toolbar + open panel + active-chip strip) is
          one sticky block, so when the user expands filters mid-scroll
          the panel anchors to the top of the viewport instead of sitting
          back at the original document position.
        - Top offset matches the navbar height (76 mobile / 94 desktop)
          plus the optional top-notification height var, so the bar lands
          flush against the navbar regardless of whether the marquee is up.
        - Negative -mx-* + matching px-* extends the frosted background
          edge-to-edge of the parent's padding without breaking centering.
      */}
      <div
        className="sticky z-30
                   top-[calc(76px+var(--top-bar-height,0px))]
                   md:top-[calc(94px+var(--top-bar-height,0px))]
                   -mx-4 md:-mx-8 px-4 md:px-8
                   bg-[var(--color-shas-bg)]/90 backdrop-blur-md
                   border-b border-[var(--color-shas-line)]"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 py-3 md:py-3.5">
          {(hasSizeFilter || hasSaleFilter) ? (
            <button
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              className="inline-flex items-center gap-2 text-[0.7rem] tracking-[0.3em] uppercase text-[var(--color-shas-plum)] hover:text-[var(--color-shas-rose)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6 12h12M10 19.5h4" />
              </svg>
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-[var(--color-shas-rose)] text-white text-[0.6rem] tracking-normal px-1.5 py-px rounded-full leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-[0.7rem] tracking-[0.3em] uppercase text-[var(--color-shas-muted)] hidden sm:inline"
            >
              Sort
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-transparent text-[0.7rem] tracking-[0.3em] uppercase text-[var(--color-shas-plum)] border-b border-[var(--color-shas-line-strong)] focus:outline-none focus:border-[var(--color-shas-rose)] py-1 pr-6 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expanded filter panel */}
        {filterOpen && (hasSizeFilter || hasSaleFilter) && (
          <div className="border-t border-[var(--color-shas-line)] pb-5 pt-5 space-y-5">
            {hasSizeFilter && (
              <div>
                <p className="text-[0.65rem] tracking-[0.3em] text-[var(--color-shas-muted)] uppercase mb-3">
                  Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map((s) => {
                    const active = sizeFilter.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSize(s)}
                        className={`border px-4 py-2 text-[0.7rem] tracking-[0.2em] uppercase font-medium transition-colors ${
                          active
                            ? "bg-[var(--color-shas-plum)] text-white border-[var(--color-shas-plum)]"
                            : "border-[var(--color-shas-line-strong)] text-[var(--color-shas-muted)] hover:border-[var(--color-shas-plum)] hover:text-[var(--color-shas-plum)]"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasSaleFilter && (
              <div>
                <p className="text-[0.65rem] tracking-[0.3em] text-[var(--color-shas-muted)] uppercase mb-3">
                  Offer
                </p>
                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <span
                    className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${
                      onSaleOnly ? "bg-[var(--color-shas-rose)]" : "bg-[var(--color-shas-line-strong)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        onSaleOnly ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                    <input
                      type="checkbox"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      checked={onSaleOnly}
                      onChange={(e) => setOnSaleOnly(e.target.checked)}
                    />
                  </span>
                  <span className="text-sm text-[var(--color-shas-plum)]">
                    On Sale only{" "}
                    <span className="text-[var(--color-shas-muted)]">({onSaleCount})</span>
                  </span>
                </label>
              </div>
            )}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[0.7rem] tracking-[0.3em] uppercase text-[var(--color-shas-rose)] hover:text-[var(--color-shas-rose-deep)] transition-colors"
              >
                Clear filters ({activeFilterCount})
              </button>
            )}
          </div>
        )}

        {/* Active-filter summary chips (when panel is closed) */}
        {!filterOpen && activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-3 border-t border-[var(--color-shas-line)] pt-3">
            <span className="text-[0.65rem] tracking-[0.3em] text-[var(--color-shas-muted)] uppercase mr-1">
              Filtering:
            </span>
            {sizeFilter.map((s) => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className="inline-flex items-center gap-1.5 border border-[var(--color-shas-plum)] bg-[var(--color-shas-plum)] text-white px-3 py-1 text-[0.65rem] tracking-[0.2em] uppercase"
              >
                {s} <span aria-hidden>×</span>
              </button>
            ))}
            {onSaleOnly && (
              <button
                onClick={() => setOnSaleOnly(false)}
                className="inline-flex items-center gap-1.5 border border-[var(--color-shas-rose)] bg-[var(--color-shas-rose)] text-white px-3 py-1 text-[0.65rem] tracking-[0.2em] uppercase"
              >
                On Sale <span aria-hidden>×</span>
              </button>
            )}
            <button
              onClick={clearFilters}
              className="text-[0.65rem] tracking-[0.3em] uppercase text-[var(--color-shas-muted)] hover:text-[var(--color-shas-rose)] transition-colors ml-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ── Grid / empty state ────────────────────────────────── */}
      {visible.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display italic text-3xl text-[var(--color-shas-rose)] mb-3">
            Nothing matches those filters.
          </p>
          <p className="text-sm text-[var(--color-shas-muted)] max-w-sm mx-auto mb-6 font-light">
            Try clearing a filter or two — there&apos;s likely something close.
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-rose-outline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-7 mt-8">
          {visible.map((product, i) => (
            <div
              key={product.id}
              className="reveal"
              style={{ ['--reveal-delay' as string]: `${(i % 8) * 0.06}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
