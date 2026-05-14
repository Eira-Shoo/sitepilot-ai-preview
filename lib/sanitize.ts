export function sanitizeText(input: unknown, maxLen = 8000): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim().slice(0, maxLen);
  return trimmed.replace(/[<>]/g, "");
}
