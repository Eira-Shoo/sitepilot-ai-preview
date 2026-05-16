/** Convert #RRGGBB to space-separated HSL components for CSS variables (e.g. "217 91% 60%"). */
export function hexToHslComponents(hex: string): string | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3,8}$/.test(normalized)) return null;

  let r: number;
  let g: number;
  let b: number;
  if (normalized.length === 3) {
    r = parseInt(normalized[0]! + normalized[0]!, 16);
    g = parseInt(normalized[1]! + normalized[1]!, 16);
    b = parseInt(normalized[2]! + normalized[2]!, 16);
  } else {
    const full = normalized.padEnd(6, "0").slice(0, 6);
    r = parseInt(full.slice(0, 2), 16);
    g = parseInt(full.slice(2, 4), 16);
    b = parseInt(full.slice(4, 6), 16);
  }

  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
