import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://lgixdwopjzuedvqddeig.supabase.co https://images.unsplash.com https://www.printmate.in https://encrypted-tbn0.gstatic.com",
      "connect-src 'self' https://lgixdwopjzuedvqddeig.supabase.co wss://lgixdwopjzuedvqddeig.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://vitals.vercel-insights.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Hide the Next.js Devtools floating indicator (the "N" button) in dev.
  devIndicators: false,

  // Disable the client-side router cache. Without this, navigating back to a
  // previously-visited route (e.g. Home → Product → back to Home) shows a
  // stale snapshot that doesn't reflect admin updates picked up by the
  // RealtimeRefresher on the current route.
  experimental: {
    staleTimes: {
      dynamic: 0,
      // Next.js 16 requires a minimum of 30 here. The intent of this whole
      // block is `dynamic: 0` (which is what actually matters for fresh
      // admin updates); `static` only affects truly static segments.
      static: 30,
    },
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.printmate.in" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      // Pin to OUR Supabase project — '*' would let an admin point images at
      // any other Supabase project, which Next.js Image would then fetch
      // server-side (SSRF risk).
      { protocol: "https", hostname: "lgixdwopjzuedvqddeig.supabase.co" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
