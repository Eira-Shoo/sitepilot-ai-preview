export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function uniquePublishedSlug(baseName: string) {
  const base = slugify(baseName) || "site";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
