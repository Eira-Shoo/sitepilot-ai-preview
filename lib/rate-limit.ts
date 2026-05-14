type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { ok: false as const, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true as const, remaining: limit - bucket.count };
}
