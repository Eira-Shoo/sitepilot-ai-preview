import { notFound } from "next/navigation";
import { WebsiteRenderer } from "@/components/site-renderer/WebsiteRenderer";
import { demoBlueprint } from "@/lib/demo-blueprint";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";

export const metadata = {
  title: "Demo site",
  description: "Static SitePilot preview — no database required.",
};

export default function SiteDemoPage() {
  const parsed = websiteBlueprintSchema.safeParse(demoBlueprint);
  if (!parsed.success) notFound();

  return (
    <WebsiteRenderer
      blueprint={parsed.data}
      projectId={DEMO_PROJECT_ID}
      publishedSlug="demo"
      showContactForm={false}
    />
  );
}
