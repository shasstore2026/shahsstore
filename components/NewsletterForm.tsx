"use client";
import { useState } from "react";

/**
 * Visual-only newsletter capture. The admin will wire this to a real
 * provider later (Mailchimp, Klaviyo, or a Supabase table). For now it
 * just shows a friendly thank-you on submit so the UX feels complete.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setStatus("error");
      return;
    }
    setStatus("ok");
    setEmail("");
  };

  if (status === "ok") {
    return (
      <div className="border border-white/15 bg-white/5 px-6 py-5 text-white/80 backdrop-blur-sm">
        <p className="font-display text-2xl text-white">Welcome to the list ✦</p>
        <p className="text-sm font-light mt-1 text-white/60">
          We&apos;ll send a quiet note when something special drops.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 w-full">
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
        placeholder="your@email.com"
        aria-label="Email"
        className="flex-1 bg-transparent border border-white/20 px-5 py-4 text-sm font-light text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--color-shas-rose)] transition-colors"
      />
      <button
        type="submit"
        className="bg-[var(--color-shas-rose)] text-white px-8 py-4 text-[0.7rem] tracking-[0.3em] uppercase font-medium hover:bg-[var(--color-shas-rose-deep)] transition-colors"
      >
        Subscribe
      </button>
      {status === "error" && (
        <p className="absolute -bottom-6 text-xs text-[var(--color-shas-blush)]">
          Please enter a valid email.
        </p>
      )}
    </form>
  );
}
