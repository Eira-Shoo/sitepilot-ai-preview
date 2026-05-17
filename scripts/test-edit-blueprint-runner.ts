import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWebsiteBlueprintFromOnboarding } from "../lib/blueprint/build-from-onboarding";
import { mergeOnboardingImport } from "../lib/onboarding/merge-onboarding-import";
import { parseBusinessBriefText } from "../lib/onboarding/parse-business-brief";
import { editBlueprintFromInstruction } from "../lib/openai/edit-blueprint";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const instruction = "Make it more luxury and move pricing higher.";

async function main() {
  const brief = readFileSync(join(root, "examples/apex-barber-brief.txt"), "utf8");
  const { partial } = parseBusinessBriefText(brief);
  const merged = mergeOnboardingImport(partial);
  if (!merged.success) {
    console.error(merged.error);
    process.exit(1);
  }
  const onboarding = merged.data;
  const blueprint = buildWebsiteBlueprintFromOnboarding(onboarding);

  const result = await editBlueprintFromInstruction(blueprint, instruction, {
    onboarding,
    allowMockFallback: true,
  });

  const home = result.blueprint.pages[0];
  const services = home?.sections.find((s) => s.type === "services");
  const serviceCount = services?.type === "services" ? services.items.length : 0;
  const types = home?.sections.map((s) => s.type) ?? [];
  const pricingIdx = types.indexOf("pricing");
  const servicesIdx = types.indexOf("services");
  const testimonials = home?.sections.find((s) => s.type === "testimonials");

  console.log("source:", result.source);
  console.log("changes:", result.changeSummary.join("; "));
  console.log("services:", serviceCount);
  console.log("pricing before services:", pricingIdx >= 0 && servicesIdx >= 0 && pricingIdx < servicesIdx);
  console.log("accent:", result.blueprint.brand.secondaryColor);

  const errors: string[] = [];
  if (serviceCount !== 3) errors.push(`services: expected 3, got ${serviceCount}`);
  if (pricingIdx < 0 || servicesIdx < 0 || pricingIdx >= servicesIdx) {
    errors.push("pricing should appear before services");
  }
  if (testimonials?.type === "testimonials" && testimonials.items.length > 0) {
    errors.push("testimonials should stay empty");
  }

  if (errors.length) {
    console.error("FAILED:", errors);
    process.exit(1);
  }
  console.log("OK: edit blueprint safeguards");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
