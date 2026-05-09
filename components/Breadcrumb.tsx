import Link from "next/link";

export type Crumb = {
  label: string;
  /** Omit href on the last item — the current page is non-clickable. */
  href?: string;
};

/**
 * Storefront breadcrumb. Renders a single line:
 *
 *    HOME › CATEGORY › IVORY TIERED MIDI
 *
 * The last crumb is the current page (rendered in plum, no link).
 * Earlier crumbs link to their `href` and gently rose-gold on hover.
 *
 * Layout-agnostic — does NOT provide its own outer container or top
 * padding. Parents wrap it however they like (most pages drop it just
 * below the fixed navbar with `pt-24 md:pt-28`).
 */
export default function Breadcrumb({
  items,
  className = "",
}: {
  items: Crumb[];
  className?: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.65rem] md:text-xs tracking-[0.25em] uppercase text-[var(--color-shas-muted)]">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="hover:text-[var(--color-shas-rose)] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "text-[var(--color-shas-plum)]" : ""}>
                  {item.label}
                </span>
              )}
              {!last && (
                <span aria-hidden className="text-[var(--color-shas-line-strong)]">
                  &rsaquo;
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
