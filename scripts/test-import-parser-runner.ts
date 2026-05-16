import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseBusinessBriefText } from "../lib/onboarding/parse-business-brief";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brief = readFileSync(join(root, "examples/apex-barber-brief.txt"), "utf8");
const { preview } = parseBusinessBriefText(brief);

const errors: string[] = [];

if (preview.services.length !== 3) {
  errors.push(`Expected 3 services, got ${preview.services.length}`);
}

const serviceNames = preview.services.map((s) => s.name);
for (const expected of ["Premium Haircut", "Beard Trim", "Haircut + Beard"]) {
  if (!serviceNames.includes(expected)) {
    errors.push(`Missing service: ${expected}`);
  }
}

if (preview.trustPoints.length !== 4) {
  errors.push(`Expected 4 trust items, got ${preview.trustPoints.length}`);
}

for (const t of ["5 years experience", "Clean studio", "Easy online booking", "Premium grooming"]) {
  if (!preview.trustPoints.some((p) => p.toLowerCase() === t.toLowerCase())) {
    errors.push(`Missing trust item: ${t}`);
  }
}

if (preview.seoKeywords.length !== 3) {
  errors.push(`Expected 3 SEO keywords, got ${preview.seoKeywords.length}`);
}

for (const kw of ["barber hamburg", "men's haircut hamburg", "beard trim hamburg"]) {
  if (!preview.seoKeywords.some((k) => k.toLowerCase() === kw)) {
    errors.push(`Missing SEO keyword: ${kw}`);
  }
}

if (preview.features.length !== 8) {
  errors.push(`Expected 8 features, got ${preview.features.length}`);
}

const polluted = preview.services.some((s) =>
  ["Google Maps", "FAQ", "5 years experience", "barber hamburg"].includes(s.name),
);
if (polluted) {
  errors.push(`Services polluted: ${serviceNames.join(", ")}`);
}

console.log("services:", preview.services.length, serviceNames);
console.log("trust:", preview.trustPoints.length, preview.trustPoints);
console.log("seo:", preview.seoKeywords.length, preview.seoKeywords);
console.log("features:", preview.features.length, preview.features);

if (errors.length) {
  console.error("FAILED:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

console.log("OK: Apex brief parser sections");
process.exit(0);
