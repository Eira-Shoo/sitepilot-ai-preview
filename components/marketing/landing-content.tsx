"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Check,
  MapPin,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { WebsiteRenderer } from "@/components/site-renderer/WebsiteRenderer";
import { demoBlueprint } from "@/lib/demo-blueprint";

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

export function LandingContent() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <motion.div {...fade} className="space-y-6">
            <Badge className="rounded-full bg-primary/15 text-primary">
              SitePilot AI · Eira Web Studio
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              AI websites for small businesses — built in minutes, with optional human review when you want it.
            </h1>
            <p className="text-pretty text-lg text-muted-foreground">
              Describe your business, connect your Google listing, choose a style, and get a structured website draft
              with copy prompts, layout sections, SEO fields, and contact blocks you can refine before launch.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-2xl px-7">
                <Link href="/create">
                  Create my website <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl px-7">
                <Link href="/preview">See example websites</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {[
                "AI-generated website draft",
                "Google Maps ready",
                "SEO-ready structure",
                "Stripe secure checkout",
                "Human review available",
              ].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/40 px-3 py-1"
                >
                  <Check className="h-3 w-3 text-accent" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
          <motion.div
            {...fade}
            transition={{ ...fade.transition, delay: 0.08 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-primary/25 via-secondary/20 to-accent/10 blur-3xl" />
            <div className="relative grid gap-4 rounded-3xl border border-border/60 bg-card/70 p-3 shadow-2xl backdrop-blur lg:grid-cols-2">
              <Card className="rounded-2xl border-border/60 bg-background/60">
                <CardContent className="space-y-3 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Customer input
                  </p>
                  <div className="h-2 w-3/4 rounded-full bg-muted" />
                  <div className="h-2 w-1/2 rounded-full bg-muted" />
                  <div className="h-2 w-2/3 rounded-full bg-muted" />
                  <div className="rounded-xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground">
                    Business name, services, goals, colors, audience…
                  </div>
                </CardContent>
              </Card>
              <div className="max-h-[420px] overflow-hidden rounded-2xl border border-border/60 bg-background">
                <div className="origin-top scale-[0.72]">
                  <WebsiteRenderer blueprint={demoBlueprint} showContactForm={false} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Section title="How it works" subtitle="Smart automation — add human review only when it helps.">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Tell us about your business",
              body: "Guided onboarding captures services, goals, audience, and optional Google listing data.",
            },
            {
              title: "AI creates your website",
              body: "Structured JSON blueprint — not random code — rendered with proven, mobile-first sections.",
            },
            {
              title: "Review, edit and publish",
              body: "You iterate in the AI editor. Optional human review can help with tone and launch readiness when you want a second pair of eyes.",
            },
          ].map((s) => (
            <Card key={s.title} className="rounded-2xl border-border/60 bg-card/70">
              <CardContent className="space-y-3 p-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Who it is for"
        subtitle="Local businesses that want a polished site without a long agency process."
      >
        <div className="flex flex-wrap gap-2">
          {[
            "Local businesses",
            "Coaches",
            "Creators",
            "Restaurants",
            "Beauty studios",
            "Freelancers",
            "Online course sellers",
            "Gaming coaches",
          ].map((t) => (
            <Badge key={t} variant="muted" className="rounded-full px-4 py-2 text-sm">
              {t}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Features" subtitle="Building blocks for a clear, mobile-first site — scope depends on your package.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "AI copywriting",
            "Google Maps integration",
            "Contact forms",
            "Service and price sections",
            "SEO titles and descriptions",
            "Image generation prompts",
            "Mobile optimized layouts",
            "Optional human review",
            "AI improvement suggestions",
          ].map((f) => (
            <div
              key={f}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4"
            >
              <Zap className="mt-0.5 h-4 w-4 text-secondary" />
              <p className="text-sm">{f}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Example websites" subtitle="Starter structures you can personalize instantly.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Beauty studio",
            "Coach",
            "Restaurant",
            "Gaming coach",
            "Freelancer",
            "Online course creator",
          ].map((ex) => (
            <Card key={ex} className="rounded-2xl border-border/60 bg-gradient-to-br from-primary/10 to-secondary/5">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="font-semibold">{ex}</p>
                  <p className="text-xs text-muted-foreground">Blueprint + sections tuned to vertical</p>
                </div>
                <Star className="h-4 w-4 text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Pricing" subtitle="Illustrative packages — final checkout flows when billing is enabled.">
        <div className="grid gap-6 lg:grid-cols-3">
          <PricingCard
            name="Starter"
            title="AI Landing Page"
            price="99 €"
            items={["1 page", "AI copy", "Contact form", "Mobile design"]}
            href="/create"
          />
          <PricingCard
            name="Business"
            title="Business Website"
            price="299 €"
            highlight
            items={[
              "Up to 5 pages blueprint",
              "Google Maps section",
              "SEO metadata",
              "Service blocks",
              "Optional human review",
            ]}
            href="/create"
          />
          <PricingCard
            name="Growth"
            title="Website + Monthly Care"
            price="49 €/month"
            items={["Hosting guidance", "Small edits", "AI optimization suggestions", "Light performance guidance"]}
            href="/create"
          />
        </div>
      </Section>

      <Section title="FAQ" subtitle="Straight answers — no buzzword soup.">
        <Accordion type="single" collapsible className="w-full max-w-3xl">
          {[
            {
              q: "Do you execute AI-written React code on my site?",
              a: "No. SitePilot generates structured JSON only. Your site renders through safe, predefined components — stable, secure, and easy to approve.",
            },
            {
              q: "Can I connect my Google Business Profile?",
              a: "Yes. Search your listing, pull details, and we will map address, hours, and map blocks automatically when data is available.",
            },
            {
              q: "What does human review mean?",
              a: "An optional pass for tone, clarity, and launch readiness — especially on the Business package. In early versions, publishing stays in your control; timelines depend on availability.",
            },
            {
              q: "How does billing work?",
              a: "Stripe Checkout handles payments securely. Your dashboard reflects payment status and unlocks publish workflows once requirements are met.",
            },
          ].map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <section className="border-t border-border/60 bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/10 py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <Shield className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-semibold tracking-tight">Ready to launch smarter?</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            AI drafts the structure and copy direction. You refine the details — optional review can help before you ship
            — with structured data instead of fragile generated code.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-2xl">
              <Link href="/create">Start the builder</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl">
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Also available as <span className="text-foreground">Eira Web Studio</span> white-label engagements.
          </p>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border/60 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...fade} className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 text-primary">
            <MapPin className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">SitePilot</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </motion.div>
        <motion.div {...fade} className="mt-10">
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  title,
  price,
  items,
  href,
  highlight,
}: {
  name: string;
  title: string;
  price: string;
  items: string[];
  href: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`rounded-2xl border-border/60 bg-card/70 ${highlight ? "border-primary/60 shadow-lg shadow-primary/15" : ""}`}
    >
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{name}</p>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-3xl font-semibold">{price}</p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((i) => (
            <li key={i} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{i}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full rounded-xl" variant={highlight ? "default" : "outline"}>
          <Link href={href}>Choose {name}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
