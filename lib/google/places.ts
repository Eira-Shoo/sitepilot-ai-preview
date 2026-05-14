const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export async function searchPlaces(query: string) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return { results: [] as { place_id: string; name: string; formatted_address?: string }[] };
  }
  const url = new URL(`${PLACES_BASE}/textsearch/json`);
  url.searchParams.set("query", query);
  url.searchParams.set("key", key);
  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return { results: [] };
  const data = (await res.json()) as {
    results?: { place_id: string; name: string; formatted_address?: string }[];
  };
  return { results: data.results ?? [] };
}

export async function placeDetails(placeId: string) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const fields = [
    "name",
    "formatted_address",
    "formatted_phone_number",
    "opening_hours",
    "geometry",
    "rating",
    "user_ratings_total",
    "website",
    "url",
  ].join(",");
  const url = new URL(`${PLACES_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", fields);
  url.searchParams.set("key", key);
  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: Record<string, unknown> };
  return data.result ?? null;
}
