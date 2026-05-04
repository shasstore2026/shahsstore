/**
 * In-memory sliding-window rate limiter.
 *
 * Limitation: state lives in the JS process. On Vercel/serverless, each
 * lambda instance has its own counter, so the *effective* limit is
 * (limit × concurrent_lambdas). For a small site this is fine — it still
 * stops a single attacker. For high-scale deployments, swap this out for
 * Upstash Redis / Vercel KV.
 */

type Entry = { timestamps: number[] };
const buckets = new Map<string, Entry>();

// Periodic GC so the map doesn't grow forever
const GC_INTERVAL_MS = 60_000;
let lastGc = Date.now();

function gc(now: number, maxWindowMs: number) {
  if (now - lastGc < GC_INTERVAL_MS) return;
  lastGc = now;
  for (const [key, entry] of buckets.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < maxWindowMs);
    if (entry.timestamps.length === 0) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Check whether a given key is allowed under the configured limit.
 * @param key       Unique bucket — typically `${route}:${ip}` or `${route}:${userId}`
 * @param limit     Max requests allowed in the window
 * @param windowMs  Rolling window in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  gc(now, windowMs);

  let entry = buckets.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    buckets.set(key, entry);
  }

  // Drop timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfterMs = windowMs - (now - oldest);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  entry.timestamps.push(now);
  return {
    ok: true,
    remaining: limit - entry.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Extract the caller's IP from a Next.js request. Handles common proxy headers.
 */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
