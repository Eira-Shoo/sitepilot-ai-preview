import Link from "next/link";
import { WebsiteRenderer } from "@/components/site-renderer/WebsiteRenderer";
import { demoBlueprint } from "@/lib/demo-blueprint";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Live preview" };

export default function LivePreviewPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Live preview</h1>
          <p className="text-sm text-muted-foreground">
            Static example of the safe renderer. Your real draft opens inside each project after generation.
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/create">Open builder</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-xl">
        <WebsiteRenderer blueprint={demoBlueprint} showContactForm={false} />
      </div>
    </div>
  );
}
