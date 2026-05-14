import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Contact" };

const CONTACT_EMAIL = "eiras.shopkontakt@gmail.com";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Contact SitePilot AI</h1>
      <p className="mt-3 text-muted-foreground">
        For partnerships, white-label (Eira Web Studio), or migration questions — use the email below. This page is
        informational; we do not run a live ticket queue on the public preview yet.
      </p>
      <Card className="mt-8 rounded-2xl border-border/60 bg-card/70">
        <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
          <p>
            Email:{" "}
            <a className="text-foreground underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>
            Customer project messages are meant to route through each published site&apos;s contact form once you are
            live with Supabase and email delivery configured.
          </p>
          <Button asChild className="w-full rounded-xl sm:w-auto">
            <Link href="/create">Start with the AI builder</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
