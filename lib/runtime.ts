/**
 * Deployment / preview helpers (no secrets here).
 *
 * - `NEXT_PUBLIC_DEMO_MODE=1` — public Vercel review: mock APIs, no login, no external calls.
 * - Missing Supabase URL+anon — same behaviour as demo deploy (offline preview).
 */

export function hasSupabaseCredentials(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith("http"));
}

export function hasServiceRoleKey(): boolean {
  return Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}

/** Explicit Vercel / preview flag (safe to expose: not a secret). */
export function isPublicDemoMode(): boolean {
  const v = process.env.NEXT_PUBLIC_DEMO_MODE;
  return v === "1" || v === "true";
}

/** No Supabase browser credentials configured. */
export function isOfflinePreview(): boolean {
  return !hasSupabaseCredentials();
}

/**
 * Mock APIs, skip auth in middleware, avoid OpenAI/Stripe/Google/DB side effects.
 */
export function isDemoDeploy(): boolean {
  return isPublicDemoMode() || isOfflinePreview();
}

export function hasOpenAiKey(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key && key.length > 10);
}

/** Use deterministic mock builder instead of OpenAI (public demo or no key). */
export function shouldUseMockAiGeneration(): boolean {
  return isPublicDemoMode() || !hasOpenAiKey();
}
