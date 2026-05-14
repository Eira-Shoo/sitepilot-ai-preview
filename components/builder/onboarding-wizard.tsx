"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OnboardingPayload } from "@/lib/validators/onboarding";
import { toast } from "sonner";

const STORAGE_KEY = "sitepilot_onboarding_v1";

const goals = [
  "Get more calls",
  "Get more bookings",
  "Sell a product",
  "Collect leads",
  "Present services",
  "Build trust",
  "Promote coaching",
  "Promote courses",
  "Promote local business",
];

const websiteTypes = [
  "Landing page",
  "5-page business website",
  "Portfolio",
  "Mini-shop",
  "Coaching website",
  "Restaurant website",
  "Local service website",
];

const styles = [
  "Minimal",
  "Premium",
  "Bold",
  "Friendly",
  "Luxury",
  "Tech",
  "Playful",
  "Dark mode",
  "Clean white",
  "Modern gradient",
];

const emptyService = {
  name: "",
  description: "",
  price: "",
  duration: "",
  cta: "",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<OnboardingPayload>(() => ({
    basics: {
      businessName: "",
      industry: "",
      description: "",
      country: "",
      city: "",
      language: "en",
      websiteUrl: "",
    },
    maps: {
      placeQuery: "",
      placeId: "",
      address: "",
      phone: "",
      email: "",
      openingHours: "",
      serviceArea: "",
      placeDetails: undefined,
    },
    goal: goals[0],
    websiteType: websiteTypes[0],
    style: {
      preset: styles[1],
      colors: "Electric blue + violet accents",
      generateImageSuggestions: true,
    },
    services: [{ ...emptyService }],
    audience: {
      who: "",
      painPoints: "",
      whyChoose: "",
      competitors: "",
      offers: "",
    },
  }));

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { step: number; payload: OnboardingPayload };
      setStep(parsed.step ?? 1);
      setPayload(parsed.payload);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, payload }));
  }, [step, payload]);

  const progress = useMemo(() => Math.round((step / 8) * 100), [step]);

  async function searchPlaces() {
    if (!payload.maps.placeQuery.trim()) {
      toast.error("Enter a business name or address to search.");
      return;
    }
    const res = await fetch("/api/google/place-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: payload.maps.placeQuery }),
    });
    const data = (await res.json()) as {
      results?: { place_id: string; name: string; formatted_address?: string }[];
    };
    const first = data.results?.[0];
    if (!first) {
      toast.message("No results — you can still enter details manually.");
      return;
    }
    const detailsRes = await fetch("/api/google/place-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: first.place_id }),
    });
    const detailsJson = await detailsRes.json();
    const details = detailsJson.result as Record<string, unknown> | undefined;
    setPayload((p) => ({
      ...p,
      maps: {
        ...p.maps,
        placeId: first.place_id,
        address: String(details?.formatted_address ?? first.formatted_address ?? ""),
        phone: String(details?.formatted_phone_number ?? p.maps.phone),
        placeDetails: details ?? null,
      },
      basics: {
        ...p.basics,
        businessName: p.basics.businessName || String(details?.name ?? first.name),
      },
    }));
    toast.success("Google listing connected");
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding: payload }),
      });
      if (res.status === 401) {
        setLoading(false);
        toast.message("Log in to save your draft", { description: "Redirecting…" });
        router.push(`/login?next=${encodeURIComponent("/create")}`);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed");
      }
      const json = (await res.json()) as { projectId: string };
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Draft ready");
      router.push(`/dashboard/projects/${json.projectId}`);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Could not generate. Check API keys and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">AI builder</p>
          <h1 className="text-3xl font-semibold tracking-tight">Create your website</h1>
          <p className="text-sm text-muted-foreground">
            Step {step} of 8 · {progress}% complete
          </p>
        </div>
        <Badge variant="muted" className="rounded-full">
          JSON blueprint · safe renderer
        </Badge>
      </div>

      <Card className="mt-8 rounded-2xl border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>
            {step === 1 && "Business basics"}
            {step === 2 && "Google Business / Maps"}
            {step === 3 && "Business goal"}
            {step === 4 && "Website type"}
            {step === 5 && "Style"}
            {step === 6 && "Services & pricing"}
            {step === 7 && "Target audience"}
            {step === 8 && "Generate draft"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business name">
                <Input
                  value={payload.basics.businessName}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      basics: { ...p.basics, businessName: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Industry">
                <Input
                  value={payload.basics.industry}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      basics: { ...p.basics, industry: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Short description" className="md:col-span-2">
                <Textarea
                  rows={4}
                  value={payload.basics.description}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      basics: { ...p.basics, description: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Country">
                <Input
                  value={payload.basics.country}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      basics: { ...p.basics, country: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="City">
                <Input
                  value={payload.basics.city}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, basics: { ...p.basics, city: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Website language">
                <Input
                  value={payload.basics.language}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      basics: { ...p.basics, language: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Existing website URL (optional)">
                <Input
                  value={payload.basics.websiteUrl}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      basics: { ...p.basics, websiteUrl: e.target.value },
                    }))
                  }
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Search on Google Maps">
                <div className="flex gap-2">
                  <Input
                    value={payload.maps.placeQuery}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        maps: { ...p.maps, placeQuery: e.target.value },
                      }))
                    }
                    placeholder="Business name + city"
                  />
                  <Button type="button" variant="secondary" onClick={searchPlaces}>
                    Search
                  </Button>
                </div>
              </Field>
              <Field label="Place ID (optional)">
                <Input
                  value={payload.maps.placeId}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, maps: { ...p.maps, placeId: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Address (manual)">
                <Input
                  value={payload.maps.address}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      maps: { ...p.maps, address: e.target.value },
                    }))
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Phone">
                  <Input
                    value={payload.maps.phone}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        maps: { ...p.maps, phone: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Email">
                  <Input
                    value={payload.maps.email}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        maps: { ...p.maps, email: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Opening hours">
                <Textarea
                  rows={3}
                  value={payload.maps.openingHours}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      maps: { ...p.maps, openingHours: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Service area">
                <Input
                  value={payload.maps.serviceArea}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      maps: { ...p.maps, serviceArea: e.target.value },
                    }))
                  }
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-2 md:grid-cols-2">
              {goals.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPayload((p) => ({ ...p, goal: g }))}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    payload.goal === g
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-card/40 hover:border-primary/40"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-2 md:grid-cols-2">
              {websiteTypes.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPayload((p) => ({ ...p, websiteType: g }))}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    payload.websiteType === g
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-card/40 hover:border-primary/40"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                {styles.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() =>
                      setPayload((p) => ({
                        ...p,
                        style: { ...p.style, preset: g },
                      }))
                    }
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      payload.style.preset === g
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-card/40 hover:border-primary/40"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <Field label="Preferred colors">
                <Input
                  value={payload.style.colors}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      style: { ...p.style, colors: e.target.value },
                    }))
                  }
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={payload.style.generateImageSuggestions}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      style: { ...p.style, generateImageSuggestions: e.target.checked },
                    }))
                  }
                />
                Generate image suggestions with AI
              </label>
              <p className="text-xs text-muted-foreground">
                Logo/image uploads can be wired to Supabase Storage in your deployment.
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              {payload.services.map((svc, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-2xl border border-border/60 bg-background/40 p-4 md:grid-cols-2"
                >
                  <Field label="Service name">
                    <Input
                      value={svc.name}
                      onChange={(e) => {
                        const next = [...payload.services];
                        next[idx] = { ...svc, name: e.target.value };
                        setPayload((p) => ({ ...p, services: next }));
                      }}
                    />
                  </Field>
                  <Field label="Price">
                    <Input
                      value={svc.price}
                      onChange={(e) => {
                        const next = [...payload.services];
                        next[idx] = { ...svc, price: e.target.value };
                        setPayload((p) => ({ ...p, services: next }));
                      }}
                    />
                  </Field>
                  <Field label="Description" className="md:col-span-2">
                    <Textarea
                      rows={3}
                      value={svc.description}
                      onChange={(e) => {
                        const next = [...payload.services];
                        next[idx] = { ...svc, description: e.target.value };
                        setPayload((p) => ({ ...p, services: next }));
                      }}
                    />
                  </Field>
                  <Field label="Duration">
                    <Input
                      value={svc.duration}
                      onChange={(e) => {
                        const next = [...payload.services];
                        next[idx] = { ...svc, duration: e.target.value };
                        setPayload((p) => ({ ...p, services: next }));
                      }}
                    />
                  </Field>
                  <Field label="CTA text">
                    <Input
                      value={svc.cta}
                      onChange={(e) => {
                        const next = [...payload.services];
                        next[idx] = { ...svc, cta: e.target.value };
                        setPayload((p) => ({ ...p, services: next }));
                      }}
                    />
                  </Field>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() =>
                  setPayload((p) => ({ ...p, services: [...p.services, { ...emptyService }] }))
                }
              >
                Add service
              </Button>
            </div>
          )}

          {step === 7 && (
            <div className="grid gap-4">
              <Field label="Who should buy?">
                <Textarea
                  rows={3}
                  value={payload.audience.who}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      audience: { ...p.audience, who: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Main pain points">
                <Textarea
                  rows={3}
                  value={payload.audience.painPoints}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      audience: { ...p.audience, painPoints: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Why choose this business?">
                <Textarea
                  rows={3}
                  value={payload.audience.whyChoose}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      audience: { ...p.audience, whyChoose: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Competitors (optional)">
                <Input
                  value={payload.audience.competitors}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      audience: { ...p.audience, competitors: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Special offers">
                <Textarea
                  rows={2}
                  value={payload.audience.offers}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      audience: { ...p.audience, offers: e.target.value },
                    }))
                  }
                />
              </Field>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                We will call OpenAI to produce a validated JSON blueprint. Nothing executes as arbitrary
                frontend code — your preview renders through SitePilot components.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Business: {payload.basics.businessName || "—"}</li>
                <li>Goal: {payload.goal}</li>
                <li>Website: {payload.websiteType}</li>
                <li>Style: {payload.style.preset}</li>
              </ul>
              <Button
                type="button"
                size="lg"
                className="rounded-2xl"
                disabled={loading}
                onClick={generate}
              >
                {loading ? "Generating…" : "Generate website draft"}
              </Button>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </Button>
            {step < 8 ? (
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => {
                  if (step === 1 && !payload.basics.businessName.trim()) {
                    toast.error("Business name is required.");
                    return;
                  }
                  if (step === 1 && !payload.basics.industry.trim()) {
                    toast.error("Industry is required.");
                    return;
                  }
                  setStep((s) => Math.min(8, s + 1));
                }}
              >
                Continue
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
