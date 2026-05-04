"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";

// Strip characters that have meaning in PostgREST filter syntax (`,`, `(`, `)`, `:`, `*`, `\`)
// to prevent injection into the .or() filter expression.
function sanitizePostgRESTQuery(input: string): string {
  return input.replace(/[,():*\\%]/g, "").trim().slice(0, 80);
}

// Escape regex special chars for safe use in `new RegExp(...)`
function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  in_stock: boolean;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setError(false);
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      // Sanitize the query before sending it to PostgREST
      const safeQuery = sanitizePostgRESTQuery(query);
      if (!safeQuery) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Search across name (primary) and category only — description is
        // unbounded user content and not great for fast search anyway.
        const { data, error: searchError } = await supabase
          .from("products")
          .select("id, name, price, image, category, in_stock")
          .or(`name.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%`)
          .order("name", { ascending: true })
          .limit(8);

        if (searchError) {
          setError(true);
          setResults([]);
        } else {
          setResults((data as Product[]) ?? []);
        }
      } catch {
        setError(true);
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  // Highlight matched text in results
  const highlight = (text: string) => {
    const trimmed = query.trim();
    if (!trimmed) return text;
    // Escape regex specials so user input can't be interpreted as a regex
    const safe = escapeRegExp(trimmed);
    const regex = new RegExp(`(${safe})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === trimmed.toLowerCase() ? (
        <mark key={i} className="bg-stone-200 text-stone-900 rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-2xl">
        {/* Input row */}
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
          <svg
            className="w-5 h-5 text-stone-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by shirt name, category..."
            className="flex-1 text-base text-stone-800 placeholder:text-stone-400 focus:outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          )}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="text-stone-300 hover:text-stone-500 transition-colors"
              aria-label="Clear"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors ml-2"
          >
            Close
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-w-3xl mx-auto px-6 pb-6 border-t border-stone-100">
            <p className="text-xs tracking-[0.2em] text-stone-400 uppercase py-4">
              {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
            </p>
            <div className="space-y-2">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  onClick={onClose}
                  className="flex items-center gap-4 p-3 hover:bg-stone-50 transition-colors group"
                >
                  <div className="relative w-14 h-14 bg-stone-100 flex-shrink-0 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800 font-medium group-hover:text-stone-600 transition-colors truncate">
                      {highlight(product.name)}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {highlight(product.category)} · ₹{product.price.toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 flex-shrink-0 ${
                      product.in_stock
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-400"
                    }`}
                  >
                    {product.in_stock ? "In Stock" : "Sold Out"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="max-w-3xl mx-auto px-6 pb-8 border-t border-stone-100 text-center pt-8">
            <p className="text-red-400 text-sm">
              Something went wrong. Please try again.
            </p>
          </div>
        )}

        {/* No results */}
        {query.trim() && !loading && !error && results.length === 0 && (
          <div className="max-w-3xl mx-auto px-6 pb-8 border-t border-stone-100 text-center pt-8">
            <p className="text-stone-400 text-sm">
              No shirts found for <strong>&quot;{query}&quot;</strong>
            </p>
            <p className="text-stone-300 text-xs mt-1">
              Try searching for &quot;formal&quot;, &quot;linen&quot; or &quot;casual&quot;
            </p>
          </div>
        )}

        {/* Default: popular suggestions */}
        {!query && (
          <div className="max-w-3xl mx-auto px-6 pb-6 border-t border-stone-100">
            <p className="text-xs tracking-[0.2em] text-stone-400 uppercase py-4">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {["Formal", "Linen", "Casual", "White", "Occasion", "Oxford"].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="text-xs px-4 py-2 border border-stone-200 text-stone-500 hover:border-stone-500 hover:text-stone-800 transition-all"
                  >
                    {term}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
