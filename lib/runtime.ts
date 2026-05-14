/**
 * Public deploy / local preview without Supabase or paid APIs.
 * Set NEXT_PUBLIC_DEMO_MODE=1 on Vercel for the review deployment to show the Demo Mode ribbon
 * in builder + dashboard + admin areas only.
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

export function isDemoModeFlag(): boolean {
  const v = process.env.NEXT_PUBLIC_DEMO_MODE;
  return v === "1" || v === "true";
}

/** APIs that need DB should use mock paths when Supabase is not configured. */
export function isOfflinePreview(): boolean {
  return !hasSupabaseCredentials();
}

/** Show the visible Demo Mode ribbon (builder / dashboard / admin only — see component). */
export function showDemoRibbon(): boolean {
  return isDemoModeFlag() || isOfflinePreview();
}
