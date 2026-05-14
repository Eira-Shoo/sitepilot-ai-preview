import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Contact SitePilot AI</h1>
      <p className="mt-3 text-muted-foreground">
        For partnerships, white-label (Eira Web Studio), or migration questions — leave a note and we respond
        within two business days.
      </p>
      <Card className="mt-8 rounded-2xl border-border/60 bg-card/70">
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          <p>
            Email: <span className="text-foreground">hello@sitepilot.ai</span> (placeholder)
          </p>
          <p>
            This page is informational. Customer project messages route through each published site&apos;s
            contact form.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
