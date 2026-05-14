import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export const metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Pricing</p>
        <h1 className="text-4xl font-semibold tracking-tight">Launch offers that scale with you.</h1>
        <p className="text-muted-foreground">
          Start with an AI draft preview, upgrade to a full business site, or add monthly care for ongoing
          improvements — all powered by structured blueprints, not fragile generated code.
        </p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card/70">
          <CardContent className="space-y-4 p-6">
            <p className="text-xs uppercase text-muted-foreground">Starter</p>
            <h2 className="text-xl font-semibold">AI Landing Page</h2>
            <p className="text-4xl font-semibold">99 €</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["1 page", "AI copy", "Contact form", "Mobile design"].map((i) => (
                <li key={i} className="flex gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  {i}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full rounded-xl">
              <Link href="/create">Start with Starter</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-primary/50 bg-gradient-to-b from-primary/15 to-card/80 shadow-xl shadow-primary/15">
          <CardContent className="space-y-4 p-6">
            <p className="text-xs uppercase text-primary">Most popular</p>
            <h2 className="text-xl font-semibold">Business Website</h2>
            <p className="text-4xl font-semibold">299 €</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Up to 5 pages blueprint",
                "Google Maps section",
                "SEO metadata",
                "Service blocks",
                "Optional human review",
              ].map((i) => (
                <li key={i} className="flex gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  {i}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full rounded-xl">
              <Link href="/create">Choose Business</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/70">
          <CardContent className="space-y-4 p-6">
            <p className="text-xs uppercase text-muted-foreground">Growth</p>
            <h2 className="text-xl font-semibold">Website + Monthly Care</h2>
            <p className="text-4xl font-semibold">49 €<span className="text-base">/month</span></p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Hosting guidance",
                "Small edits",
                "AI optimization suggestions",
                "Light performance guidance",
              ].map((i) => (
                <li key={i} className="flex gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  {i}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link href="/create">Add monthly care</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
