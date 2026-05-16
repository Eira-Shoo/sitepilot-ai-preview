"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OnboardingPayload } from "@/lib/validators/onboarding";
import { defaultOnboardingPayload } from "@/lib/validators/onboarding";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { saveDemoDraft } from "@/lib/demo-session";
import type { BlueprintGenerationSource } from "@/lib/openai/generate-website-blueprint";
import { toast } from "sonner";
import {
  AUDIENCE_FEEL_TAGS,
  BUSINESS_TYPES,
  CONTACT_METHODS,
  EXTRA_FEATURES,
  IMAGE_STYLE_PRESETS,
  PACKAGE_BILLING,
  PAGE_OPTIONS,
  PRICING_VISIBILITY,
  WEBSITE_GOALS,
  WEBSITE_MOODS,
  WEBSITE_STYLES,
  FONT_STYLES,
  ASSET_TYPES,
  ASSET_PLACEMENTS,
} from "@/lib/intake/options";

const STORAGE_KEY = "sitepilot_onboarding_v2";
const TOTAL_STEPS = 14;

const IS_DEMO_CLIENT =
  process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const OPTIONAL_STEPS = new Set([7, 8, 9, 12]);

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `m-${Math.random().toString(36).slice(2)}`;
}

const MAX_FILE_BYTES = 2_500_000;

async function fileToDataUrl(file: File): Promise<string | null> {
  if (file.size > MAX_FILE_BYTES) {
    toast.error("File too large for preview (max ~2.5 MB).");
    return null;
  }
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  });
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<OnboardingPayload>(() => defaultOnboardingPayload());

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const progress = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  const suggest = useCallback((path: string, value: string) => {
    toast.message("AI draft suggestion applied");
    setPayload((p) => {
      const next = structuredClone(p) as Record<string, unknown>;
      const keys = path.split(".");
      let cur: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur = cur[keys[i]!] as Record<string, unknown>;
      }
      cur[keys[keys.length - 1]!] = value;
      return next as OnboardingPayload;
    });
  }, []);

  async function searchPlaces() {
    if (IS_DEMO_CLIENT) {
      toast.message("Google search is disabled in demo mode — enter details manually.");
      return;
    }
    if (!payload.localBusiness.placeQuery.trim()) {
      toast.error("Enter a business name or address to search.");
      return;
    }
    const res = await fetch("/api/google/place-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: payload.localBusiness.placeQuery }),
    });
    const data = (await res.json()) as {
      results?: { place_id: string; name: string; formatted_address?: string }[];
    };
    const first = data.results?.[0];
    if (!first) {
      toast.message("No results — enter details manually.");
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
      localBusiness: {
        ...p.localBusiness,
        placeId: first.place_id,
        address: String(details?.formatted_address ?? first.formatted_address ?? p.localBusiness.address),
        phone: String(details?.formatted_phone_number ?? p.localBusiness.phone),
        placeDetails: details ?? undefined,
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
        throw new Error((err as { error?: string }).error ?? "Failed");
      }
      const json = (await res.json()) as {
        projectId: string;
        blueprint?: WebsiteBlueprint;
        source?: BlueprintGenerationSource;
      };
      const source: BlueprintGenerationSource = json.source === "openai" ? "openai" : "mock";
      if (process.env.NODE_ENV === "development") {
        console.log("Generation source:", source);
      }
      if (json.blueprint) saveDemoDraft(json.blueprint, source);
      localStorage.removeItem(STORAGE_KEY);
      toast.success(
        source === "openai" ? "AI draft ready (OpenAI)" : "Draft ready (demo builder)",
      );
      router.push(`/dashboard/projects/${json.projectId}`);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Could not generate. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setPayload(defaultOnboardingPayload());
    setStep(1);
    toast.success("Wizard reset");
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, payload }));
    toast.success("Draft saved in this browser");
  }

  function duplicateService(idx: number) {
    setPayload((p) => {
      const copy = structuredClone(p.offers.services[idx]!);
      const next = [...p.offers.services];
      next.splice(idx + 1, 0, copy);
      return { ...p, offers: { ...p.offers, services: next } };
    });
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const dataUrl = await fileToDataUrl(file);
      if (!dataUrl) continue;
      setPayload((p) => ({
        ...p,
        media: {
          assets: [
            ...p.media.assets,
            {
              id: newId(),
              fileName: file.name,
              previewDataUrl: dataUrl,
              assetType: "other",
              placement: [],
              altText: "",
              useForAiDirection: true,
            },
          ],
        },
      }));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">AI intake</p>
          <h1 className="text-3xl font-semibold tracking-tight">Website questionnaire</h1>
          <p className="text-sm text-muted-foreground">
            Step {step} of {TOTAL_STEPS} · {progress}%
          </p>
        </div>
        <Badge variant="muted" className="rounded-full">
          Autosaved locally
        </Badge>
      </div>

      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Answer the questions you can. Skip what you do not know. The AI will fill the gaps and create a draft you can
        edit.
      </p>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Card className="mt-6 rounded-2xl border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>
            {step === 1 && "1 · Business basics"}
            {step === 2 && "2 · Main website goal"}
            {step === 3 && "3 · Target audience"}
            {step === 4 && "4 · Services / offers"}
            {step === 5 && "5 · Packages & pricing display"}
            {step === 6 && "6 · Branding & design"}
            {step === 7 && "7 · Media uploads"}
            {step === 8 && "8 · AI image direction"}
            {step === 9 && "9 · Location & contact"}
            {step === 10 && "10 · Trust & credibility"}
            {step === 11 && "11 · Site structure"}
            {step === 12 && "12 · SEO keywords"}
            {step === 13 && "13 · Extra features"}
            {step === 14 && "14 · Review & generate"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Fields marked with <span className="text-foreground">*</span> are required on step 1. Other steps can be
            skipped when optional.
          </p>

          {step === 1 && (
            <StepGrid>
              <Field label="Business name *">
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
              <Field label="Industry *">
                <div className="flex gap-2">
                  <Input
                    value={payload.basics.industry}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        basics: { ...p.basics, industry: e.target.value },
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 rounded-xl"
                    onClick={() =>
                      suggest(
                        "basics.industry",
                        "Professional services — consulting & implementation support",
                      )
                    }
                  >
                    AI suggest
                  </Button>
                </div>
              </Field>
              <Field label="Business type" className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setPayload((p) => ({ ...p, basics: { ...p.basics, businessType: t } }))
                      }
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50 ${
                        payload.basics.businessType === t
                          ? "border-primary bg-primary/10"
                          : "border-border/60"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
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
                    setPayload((p) => ({ ...p, basics: { ...p.basics, country: e.target.value } }))
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
              <Field label="Social links" className="md:col-span-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    ["instagram", "tiktok", "youtube", "facebook", "linkedin"] as const
                  ).map((k) => (
                    <Input
                      key={k}
                      placeholder={k}
                      value={payload.basics.social[k]}
                      onChange={(e) =>
                        setPayload((p) => ({
                          ...p,
                          basics: {
                            ...p.basics,
                            social: { ...p.basics.social, [k]: e.target.value },
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </Field>
            </StepGrid>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">What should this website mainly achieve?</p>
              <div className="grid gap-2 md:grid-cols-2">
                {WEBSITE_GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setPayload((p) => ({ ...p, mainGoal: { ...p.mainGoal, primary: g } }))}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      payload.mainGoal.primary === g
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-card/40"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Primary CTA text">
                  <Input
                    value={payload.mainGoal.primaryCta}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        mainGoal: { ...p.mainGoal, primaryCta: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Secondary CTA text">
                  <Input
                    value={payload.mainGoal.secondaryCta}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        mainGoal: { ...p.mainGoal, secondaryCta: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Preferred contact method">
                <div className="flex flex-wrap gap-2">
                  {CONTACT_METHODS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setPayload((p) => ({
                          ...p,
                          mainGoal: { ...p.mainGoal, preferredContact: c },
                        }))
                      }
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50 ${
                        payload.mainGoal.preferredContact === c
                          ? "border-primary bg-primary/10"
                          : "border-border/60"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Field label="Who should visit this website?">
                <Textarea
                  rows={3}
                  value={payload.targetAudience.who}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      targetAudience: { ...p.targetAudience, who: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="What problems do they have?">
                <Textarea
                  rows={3}
                  value={payload.targetAudience.problems}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      targetAudience: { ...p.targetAudience, problems: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="What do they care about before buying?">
                <Textarea
                  rows={3}
                  value={payload.targetAudience.careAbout}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      targetAudience: { ...p.targetAudience, careAbout: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Feel / vibe (pick any)">
                <div className="flex flex-wrap gap-2">
                  {AUDIENCE_FEEL_TAGS.map((t) => {
                    const on = payload.targetAudience.feelTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          setPayload((p) => ({
                            ...p,
                            targetAudience: {
                              ...p.targetAudience,
                              feelTags: on
                                ? p.targetAudience.feelTags.filter((x) => x !== t)
                                : [...p.targetAudience.feelTags, t],
                            },
                          }))
                        }
                        className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50 ${
                          on ? "border-primary bg-primary/10" : "border-border/60"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {payload.offers.services.map((svc, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-2xl border border-border/60 bg-background/40 p-4 md:grid-cols-2"
                >
                  <Field label="Service name">
                    <Input
                      value={svc.name}
                      onChange={(e) => {
                        const next = [...payload.offers.services];
                        next[idx] = { ...svc, name: e.target.value };
                        setPayload((p) => ({ ...p, offers: { ...p.offers, services: next } }));
                      }}
                    />
                  </Field>
                  <Field label="Starting price">
                    <Input
                      value={svc.startingPrice}
                      onChange={(e) => {
                        const next = [...payload.offers.services];
                        next[idx] = { ...svc, startingPrice: e.target.value };
                        setPayload((p) => ({ ...p, offers: { ...p.offers, services: next } }));
                      }}
                    />
                  </Field>
                  <Field label="Description" className="md:col-span-2">
                    <Textarea
                      rows={2}
                      value={svc.description}
                      onChange={(e) => {
                        const next = [...payload.offers.services];
                        next[idx] = { ...svc, description: e.target.value };
                        setPayload((p) => ({ ...p, offers: { ...p.offers, services: next } }));
                      }}
                    />
                  </Field>
                  <Field label="Duration (optional)">
                    <Input
                      value={svc.duration}
                      onChange={(e) => {
                        const next = [...payload.offers.services];
                        next[idx] = { ...svc, duration: e.target.value };
                        setPayload((p) => ({ ...p, offers: { ...p.offers, services: next } }));
                      }}
                    />
                  </Field>
                  <Field label="Who is it for?">
                    <Input
                      value={svc.whoFor}
                      onChange={(e) => {
                        const next = [...payload.offers.services];
                        next[idx] = { ...svc, whoFor: e.target.value };
                        setPayload((p) => ({ ...p, offers: { ...p.offers, services: next } }));
                      }}
                    />
                  </Field>
                  <Field label="What is included?" className="md:col-span-2">
                    <Textarea
                      rows={2}
                      value={svc.included}
                      onChange={(e) => {
                        const next = [...payload.offers.services];
                        next[idx] = { ...svc, included: e.target.value };
                        setPayload((p) => ({ ...p, offers: { ...p.offers, services: next } }));
                      }}
                    />
                  </Field>
                  <Field label="CTA text" className="md:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      <Input
                        value={svc.cta}
                        onChange={(e) => {
                          const next = [...payload.offers.services];
                          next[idx] = { ...svc, cta: e.target.value };
                          setPayload((p) => ({ ...p, offers: { ...p.offers, services: next } }));
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => duplicateService(idx)}
                      >
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={payload.offers.services.length < 2}
                        onClick={() =>
                          setPayload((p) => ({
                            ...p,
                            offers: {
                              ...p.offers,
                              services: p.offers.services.filter((_, i) => i !== idx),
                            },
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </Field>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() =>
                  setPayload((p) => ({
                    ...p,
                    offers: {
                      ...p.offers,
                      services: [
                        ...p.offers.services,
                        {
                          name: "",
                          description: "",
                          startingPrice: "",
                          duration: "",
                          whoFor: "",
                          included: "",
                          cta: "Learn more",
                        },
                      ],
                    },
                  }))
                }
              >
                Add service
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <Field label="Do you want pricing visible on the website?">
                <div className="grid gap-2 md:grid-cols-2">
                  {PRICING_VISIBILITY.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPayload((p) => ({ ...p, packages: { ...p.packages, visibility: v } }))}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        payload.packages.visibility === v ? "border-primary bg-primary/10" : "border-border/60"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </Field>
              {(payload.packages.visibility.startsWith("Yes") ||
                payload.packages.visibility.includes("AI")) && (
                <>
                  <p className="text-sm text-muted-foreground">Package cards</p>
                  {payload.packages.items.map((pkg, idx) => (
                    <div
                      key={idx}
                      className="grid gap-3 rounded-2xl border border-border/60 p-4 md:grid-cols-2"
                    >
                      <Field label="Package name">
                        <Input
                          value={pkg.name}
                          onChange={(e) => {
                            const next = [...payload.packages.items];
                            next[idx] = { ...pkg, name: e.target.value };
                            setPayload((p) => ({ ...p, packages: { ...p.packages, items: next } }));
                          }}
                        />
                      </Field>
                      <Field label="Price">
                        <Input
                          value={pkg.price}
                          onChange={(e) => {
                            const next = [...payload.packages.items];
                            next[idx] = { ...pkg, price: e.target.value };
                            setPayload((p) => ({ ...p, packages: { ...p.packages, items: next } }));
                          }}
                        />
                      </Field>
                      <Field label="Billing type">
                        <select
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                          value={pkg.billing}
                          onChange={(e) => {
                            const next = [...payload.packages.items];
                            next[idx] = { ...pkg, billing: e.target.value };
                            setPayload((p) => ({ ...p, packages: { ...p.packages, items: next } }));
                          }}
                        >
                          {PACKAGE_BILLING.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={pkg.recommended}
                          onChange={(e) => {
                            const next = [...payload.packages.items];
                            next[idx] = { ...pkg, recommended: e.target.checked };
                            setPayload((p) => ({ ...p, packages: { ...p.packages, items: next } }));
                          }}
                        />
                        Recommended package
                      </label>
                      <Field label="Features included" className="md:col-span-2">
                        <Textarea
                          rows={2}
                          value={pkg.features}
                          onChange={(e) => {
                            const next = [...payload.packages.items];
                            next[idx] = { ...pkg, features: e.target.value };
                            setPayload((p) => ({ ...p, packages: { ...p.packages, items: next } }));
                          }}
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl md:col-span-2"
                        onClick={() =>
                          setPayload((p) => ({
                            ...p,
                            packages: {
                              ...p.packages,
                              items: p.packages.items.filter((_, i) => i !== idx),
                            },
                          }))
                        }
                      >
                        Remove package
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      setPayload((p) => ({
                        ...p,
                        packages: {
                          ...p.packages,
                          items: [
                            ...p.packages.items,
                            {
                              name: "",
                              price: "",
                              billing: "one-time",
                              features: "",
                              recommended: false,
                            },
                          ],
                        },
                      }))
                    }
                  >
                    Add package
                  </Button>
                </>
              )}
            </div>
          )}

          {step === 6 && (
            <StepGrid>
              <Field label="Preferred website style" className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {WEBSITE_STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setPayload((p) => ({ ...p, branding: { ...p.branding, websiteStyle: s } }))
                      }
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50 ${
                        payload.branding.websiteStyle === s ? "border-primary bg-primary/10" : "border-border/60"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Preferred colors">
                <Input
                  value={payload.branding.colorsPreferred}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      branding: { ...p.branding, colorsPreferred: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Colors to avoid">
                <Input
                  value={payload.branding.colorsAvoid}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      branding: { ...p.branding, colorsAvoid: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Font style">
                <div className="flex flex-wrap gap-2">
                  {FONT_STYLES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() =>
                        setPayload((p) => ({ ...p, branding: { ...p.branding, fontStyle: f } }))
                      }
                      className={`rounded-full border px-3 py-1 text-xs capitalize ${
                        payload.branding.fontStyle === f ? "border-primary bg-primary/10" : "border-border/60"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Website mood">
                <div className="flex flex-wrap gap-2">
                  {WEBSITE_MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayload((p) => ({ ...p, branding: { ...p.branding, mood: m } }))}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50 ${
                        payload.branding.mood === m ? "border-primary bg-primary/10" : "border-border/60"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Inspiration URLs (optional)" className="md:col-span-2">
                <Textarea
                  rows={2}
                  value={payload.branding.inspirationUrls}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      branding: { ...p.branding, inspirationUrls: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="What you like / dislike" className="md:col-span-2">
                <Textarea
                  rows={3}
                  value={payload.branding.notes}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, branding: { ...p.branding, notes: e.target.value } }))
                  }
                />
              </Field>
            </StepGrid>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Demo preview only — images stay in your browser until you generate. Large files may not persist
                after refresh.
              </p>
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => onPickFiles(e.target.files)}
              />
              {payload.media.assets.map((asset, idx) => (
                <div key={asset.id} className="space-y-3 rounded-2xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-start gap-4">
                    {asset.previewDataUrl?.startsWith("data:image") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.previewDataUrl}
                        alt=""
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted text-xs">
                        file
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium">{asset.fileName}</p>
                      <p className="text-xs text-muted-foreground">{asset.assetType}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() =>
                        setPayload((p) => ({
                          ...p,
                          media: {
                            assets: p.media.assets.filter((_, i) => i !== idx),
                          },
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Asset type">
                      <select
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                        value={asset.assetType}
                        onChange={(e) => {
                          const next = [...payload.media.assets];
                          next[idx] = { ...asset, assetType: e.target.value };
                          setPayload((p) => ({ ...p, media: { assets: next } }));
                        }}
                      >
                        {ASSET_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Alt text / description">
                      <Input
                        value={asset.altText}
                        onChange={(e) => {
                          const next = [...payload.media.assets];
                          next[idx] = { ...asset, altText: e.target.value };
                          setPayload((p) => ({ ...p, media: { assets: next } }));
                        }}
                      />
                    </Field>
                  </div>
                  <Field label="Where should it appear?">
                    <div className="flex flex-wrap gap-2">
                      {ASSET_PLACEMENTS.map((pl) => {
                        const on = asset.placement.includes(pl);
                        return (
                          <button
                            key={pl}
                            type="button"
                            onClick={() => {
                              const next = [...payload.media.assets];
                              next[idx] = {
                                ...asset,
                                placement: on
                                  ? asset.placement.filter((x) => x !== pl)
                                  : [...asset.placement, pl],
                              };
                              setPayload((p) => ({ ...p, media: { assets: next } }));
                            }}
                            className={`rounded-full border px-3 py-1 text-xs capitalize ${
                              on ? "border-primary bg-primary/10" : "border-border/60"
                            }`}
                          >
                            {pl}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={asset.useForAiDirection}
                      onChange={(e) => {
                        const next = [...payload.media.assets];
                        next[idx] = { ...asset, useForAiDirection: e.target.checked };
                        setPayload((p) => ({ ...p, media: { assets: next } }));
                      }}
                    />
                    Use as visual direction for AI
                  </label>
                </div>
              ))}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Should AI suggest image ideas if you do not have enough images?</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={payload.imageDirection.generatePrompts}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      imageDirection: { ...p.imageDirection, generatePrompts: e.target.checked },
                    }))
                  }
                />
                Generate image prompts
              </label>
              <Field label="Preferred image style">
                <div className="flex flex-wrap gap-2">
                  {IMAGE_STYLE_PRESETS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setPayload((p) => ({
                          ...p,
                          imageDirection: { ...p.imageDirection, preferredStyle: s },
                        }))
                      }
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50 ${
                        payload.imageDirection.preferredStyle === s
                          ? "border-primary bg-primary/10"
                          : "border-border/60"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Things to avoid in images">
                <Textarea
                  rows={2}
                  value={payload.imageDirection.avoid}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      imageDirection: { ...p.imageDirection, avoid: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Required image subjects">
                <Textarea
                  rows={2}
                  value={payload.imageDirection.requiredSubjects}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      imageDirection: { ...p.imageDirection, requiredSubjects: e.target.value },
                    }))
                  }
                />
              </Field>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              {!IS_DEMO_CLIENT && (
                <Field label="Search on Google Maps">
                  <div className="flex gap-2">
                    <Input
                      value={payload.localBusiness.placeQuery}
                      onChange={(e) =>
                        setPayload((p) => ({
                          ...p,
                          localBusiness: { ...p.localBusiness, placeQuery: e.target.value },
                        }))
                      }
                      placeholder="Business name + city"
                    />
                    <Button type="button" variant="secondary" className="rounded-xl" onClick={searchPlaces}>
                      Search
                    </Button>
                  </div>
                </Field>
              )}
              <Field label="Business address">
                <Input
                  value={payload.localBusiness.address}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      localBusiness: { ...p.localBusiness, address: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Service area">
                <Input
                  value={payload.localBusiness.serviceArea}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      localBusiness: { ...p.localBusiness, serviceArea: e.target.value },
                    }))
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Phone">
                  <Input
                    value={payload.localBusiness.phone}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        localBusiness: { ...p.localBusiness, phone: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Email">
                  <Input
                    value={payload.localBusiness.email}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        localBusiness: { ...p.localBusiness, email: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Opening hours">
                <Textarea
                  rows={3}
                  value={payload.localBusiness.openingHours}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      localBusiness: { ...p.localBusiness, openingHours: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Google Maps link (optional)">
                <Input
                  value={payload.localBusiness.mapsLink}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      localBusiness: { ...p.localBusiness, mapsLink: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Google Place ID (optional)">
                <Input
                  value={payload.localBusiness.placeId}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      localBusiness: { ...p.localBusiness, placeId: e.target.value },
                    }))
                  }
                />
              </Field>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payload.localBusiness.showMap}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        localBusiness: { ...p.localBusiness, showMap: e.target.checked },
                      }))
                    }
                  />
                  Show map on website
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payload.localBusiness.showHours}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        localBusiness: { ...p.localBusiness, showHours: e.target.checked },
                      }))
                    }
                  />
                  Show opening hours
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payload.localBusiness.showLocalTrust}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        localBusiness: { ...p.localBusiness, showLocalTrust: e.target.checked },
                      }))
                    }
                  />
                  Show local trust section
                </label>
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Years of experience">
                  <Input
                    value={payload.trust.yearsExperience}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        trust: { ...p.trust, yearsExperience: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Payment methods">
                  <Input
                    value={payload.trust.paymentMethods}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        trust: { ...p.trust, paymentMethods: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Certifications">
                <Textarea
                  rows={2}
                  value={payload.trust.certifications}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, trust: { ...p.trust, certifications: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Awards">
                <Textarea
                  rows={2}
                  value={payload.trust.awards}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, trust: { ...p.trust, awards: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Guarantees">
                <Textarea
                  rows={2}
                  value={payload.trust.guarantees}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, trust: { ...p.trust, guarantees: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Review platform links">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["google", "Google"],
                      ["trustpilot", "Trustpilot"],
                      ["provenExpert", "ProvenExpert"],
                      ["yelp", "Yelp"],
                      ["other", "Other"],
                    ] as const
                  ).map(([key, label]) => (
                    <Input
                      key={key}
                      placeholder={label}
                      value={payload.trust.reviewPlatforms[key]}
                      onChange={(e) =>
                        setPayload((p) => ({
                          ...p,
                          trust: {
                            ...p.trust,
                            reviewPlatforms: {
                              ...p.trust.reviewPlatforms,
                              [key]: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={payload.trust.hideEmptyReviews}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, trust: { ...p.trust, hideEmptyReviews: e.target.checked } }))
                  }
                />
                Hide empty reviews in preview (recommended)
              </label>
              <p className="text-xs text-muted-foreground">
                Do not enter fake testimonials — leave cards empty if you have no reviews yet.
              </p>
              {payload.trust.testimonials.map((t, idx) => (
                <div key={idx} className="grid gap-3 rounded-2xl border border-border/60 p-4 md:grid-cols-2">
                  <Field label="Name">
                    <Input
                      value={t.name}
                      onChange={(e) => {
                        const next = [...payload.trust.testimonials];
                        next[idx] = { ...t, name: e.target.value };
                        setPayload((p) => ({ ...p, trust: { ...p.trust, testimonials: next } }));
                      }}
                    />
                  </Field>
                  <Field label="Role / company">
                    <Input
                      value={t.role}
                      onChange={(e) => {
                        const next = [...payload.trust.testimonials];
                        next[idx] = { ...t, role: e.target.value };
                        setPayload((p) => ({ ...p, trust: { ...p.trust, testimonials: next } }));
                      }}
                    />
                  </Field>
                  <Field label="Review text" className="md:col-span-2">
                    <Textarea
                      rows={3}
                      value={t.text}
                      onChange={(e) => {
                        const next = [...payload.trust.testimonials];
                        next[idx] = { ...t, text: e.target.value };
                        setPayload((p) => ({ ...p, trust: { ...p.trust, testimonials: next } }));
                      }}
                    />
                  </Field>
                  <Field label="Rating (optional)">
                    <Input
                      value={t.rating}
                      onChange={(e) => {
                        const next = [...payload.trust.testimonials];
                        next[idx] = { ...t, rating: e.target.value };
                        setPayload((p) => ({ ...p, trust: { ...p.trust, testimonials: next } }));
                      }}
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      setPayload((p) => ({
                        ...p,
                        trust: {
                          ...p.trust,
                          testimonials: p.trust.testimonials.filter((_, i) => i !== idx),
                        },
                      }))
                    }
                  >
                    Remove testimonial
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() =>
                  setPayload((p) => ({
                    ...p,
                    trust: {
                      ...p.trust,
                      testimonials: [
                        ...p.trust.testimonials,
                        { name: "", role: "", text: "", rating: "" },
                      ],
                    },
                  }))
                }
              >
                Add testimonial
              </Button>
            </div>
          )}

          {step === 11 && (
            <div className="space-y-4">
              <Field label="Site shape">
                <div className="flex gap-2">
                  {(["one-page", "multi-page"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setPayload((p) => ({ ...p, sitePages: { ...p.sitePages, structure: s } }))
                      }
                      className={`rounded-2xl border px-4 py-2 text-sm ${
                        payload.sitePages.structure === s ? "border-primary bg-primary/10" : "border-border/60"
                      }`}
                    >
                      {s === "one-page" ? "One-page website" : "Multi-page website"}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Which pages do you need?">
                <div className="flex flex-wrap gap-2">
                  {PAGE_OPTIONS.map((pg) => {
                    const on = payload.sitePages.pages.includes(pg);
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() =>
                          setPayload((p) => ({
                            ...p,
                            sitePages: {
                              ...p.sitePages,
                              pages: on
                                ? p.sitePages.pages.filter((x) => x !== pg)
                                : [...p.sitePages.pages, pg],
                            },
                          }))
                        }
                        className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50 ${
                          on ? "border-primary bg-primary/10" : "border-border/60"
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {step === 12 && (
            <StepGrid>
              <Field label="Main keyword">
                <Input
                  value={payload.seo.mainKeyword}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, seo: { ...p.seo, mainKeyword: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Secondary keywords">
                <Input
                  value={payload.seo.secondaryKeywords}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      seo: { ...p.seo, secondaryKeywords: e.target.value },
                    }))
                  }
                  placeholder="comma separated"
                />
              </Field>
              <Field label="City / region keywords">
                <Input
                  value={payload.seo.regionKeywords}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, seo: { ...p.seo, regionKeywords: e.target.value } }))
                  }
                />
              </Field>
              <Field label="What should people search to find you?" className="md:col-span-2">
                <Textarea
                  rows={2}
                  value={payload.seo.searchIntent}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, seo: { ...p.seo, searchIntent: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Competitors (optional)" className="md:col-span-2">
                <Textarea
                  rows={2}
                  value={payload.seo.competitors}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, seo: { ...p.seo, competitors: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Meta title preference">
                <Input
                  value={payload.seo.metaTitleHint}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, seo: { ...p.seo, metaTitleHint: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Meta description preference">
                <Textarea
                  rows={2}
                  value={payload.seo.metaDescriptionHint}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      seo: { ...p.seo, metaDescriptionHint: e.target.value },
                    }))
                  }
                />
              </Field>
            </StepGrid>
          )}

          {step === 13 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Toggle features to include in the draft blueprint.</p>
              <div className="flex flex-wrap gap-2">
                {EXTRA_FEATURES.map((f) => {
                  const on = payload.extraFeatures.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() =>
                        setPayload((p) => ({
                          ...p,
                          extraFeatures: on
                            ? p.extraFeatures.filter((x) => x !== f)
                            : [...p.extraFeatures, f],
                        }))
                      }
                      className={`rounded-full border px-3 py-1 text-left text-xs ${
                        on ? "border-primary bg-primary/10" : "border-border/60"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 14 && (
            <div className="space-y-6 text-sm">
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Ready to generate your website?</h3>
                <p className="text-muted-foreground">
                  We will build a complete draft for{" "}
                  <span className="font-medium text-foreground">
                    {payload.basics.businessName || "your business"}
                  </span>
                  . You can edit every section afterward.
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Website copy",
                    "Section layout",
                    "SEO metadata",
                    "Image prompts",
                    "Contact blocks",
                    payload.localBusiness.showMap || payload.localBusiness.address?.trim()
                      ? "Local business section"
                      : null,
                  ]
                    .filter(Boolean)
                    .map((item) => (
                      <li key={item as string} className="flex items-center gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">Review your answers below, then generate your free draft.</p>

              <div className="grid gap-4 md:grid-cols-2">
                <SummaryCard title="Business">
                  <p>
                    <span className="text-muted-foreground">Name:</span> {payload.basics.businessName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Industry:</span> {payload.basics.industry}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Type:</span> {payload.basics.businessType}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    {[payload.basics.city, payload.basics.country].filter(Boolean).join(", ") || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Language:</span> {payload.basics.language}
                  </p>
                  {payload.basics.websiteUrl ? (
                    <p>
                      <span className="text-muted-foreground">Website:</span> {payload.basics.websiteUrl}
                    </p>
                  ) : null}
                  {payload.basics.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {payload.basics.description.slice(0, 360)}
                      {payload.basics.description.length > 360 ? "…" : ""}
                    </p>
                  ) : null}
                </SummaryCard>

                <SummaryCard title="Goal & CTAs">
                  <p>
                    <span className="text-muted-foreground">Goal:</span> {payload.mainGoal.primary}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Primary CTA:</span> {payload.mainGoal.primaryCta || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Secondary CTA:</span>{" "}
                    {payload.mainGoal.secondaryCta || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Contact:</span> {payload.mainGoal.preferredContact}
                  </p>
                </SummaryCard>

                <SummaryCard title="Audience">
                  <p className="text-xs leading-relaxed">
                    {payload.targetAudience.who || "—"}
                    {payload.targetAudience.problems ? (
                      <>
                        <br />
                        <span className="text-muted-foreground">Problems:</span> {payload.targetAudience.problems}
                      </>
                    ) : null}
                    {payload.targetAudience.feelTags.length ? (
                      <span className="mt-2 block text-muted-foreground">
                        Vibe: {payload.targetAudience.feelTags.join(", ")}
                      </span>
                    ) : null}
                  </p>
                </SummaryCard>

                <SummaryCard
                  title={`Services (${payload.offers.services.filter((s) => s.name?.trim()).length})`}
                >
                  <ul className="space-y-2 text-xs">
                    {payload.offers.services
                      .filter((s) => s.name?.trim() || s.description?.trim())
                      .map((s, i) => (
                        <li key={i} className="rounded-lg border border-border/50 bg-background/40 p-2">
                          <span className="font-medium text-foreground">{s.name || "Untitled"}</span>
                          {s.startingPrice ? (
                            <span className="text-muted-foreground"> · {s.startingPrice}</span>
                          ) : null}
                          {s.duration ? (
                            <span className="text-muted-foreground"> · {s.duration}</span>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </SummaryCard>

                <SummaryCard title="Packages">
                  <p className="text-muted-foreground">Visibility: {payload.packages.visibility}</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {payload.packages.items.filter((p) => p.name?.trim()).map((p, i) => (
                      <li key={i}>
                        {p.name} — {p.price} ({p.billing}){p.recommended ? " ★ recommended" : ""}
                      </li>
                    ))}
                  </ul>
                </SummaryCard>

                <SummaryCard title="Branding">
                  <p>
                    Style: {payload.branding.websiteStyle} · Mood: {payload.branding.mood}
                  </p>
                  <p>Colors: {payload.branding.colorsPreferred || "—"}</p>
                  <p>Avoid: {payload.branding.colorsAvoid || "—"}</p>
                </SummaryCard>

                <SummaryCard title={`Media (${payload.media.assets.length})`}>
                  <ul className="text-xs text-muted-foreground">
                    {payload.media.assets.map((a) => (
                      <li key={a.id}>
                        {a.fileName} — {a.assetType}
                      </li>
                    ))}
                    {payload.media.assets.length === 0 ? <li>No files attached</li> : null}
                  </ul>
                </SummaryCard>

                <SummaryCard title="AI image direction">
                  <p>
                    Generate prompts: {payload.imageDirection.generatePrompts ? "yes" : "no"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Style: {payload.imageDirection.preferredStyle}
                    {payload.imageDirection.requiredSubjects
                      ? ` · Subjects: ${payload.imageDirection.requiredSubjects}`
                      : ""}
                  </p>
                </SummaryCard>

                <SummaryCard title="Location">
                  <p>{payload.localBusiness.address || "—"}</p>
                  <p className="text-muted-foreground">Area: {payload.localBusiness.serviceArea || "—"}</p>
                  <p className="text-muted-foreground">
                    {payload.localBusiness.phone || "—"} · {payload.localBusiness.email || "—"}
                  </p>
                  <p className="mt-1 text-xs whitespace-pre-line text-muted-foreground">
                    {payload.localBusiness.openingHours || ""}
                  </p>
                  <p className="mt-1 text-xs">
                    Map: {payload.localBusiness.showMap ? "yes" : "no"} · Hours on site:{" "}
                    {payload.localBusiness.showHours ? "yes" : "no"}
                  </p>
                </SummaryCard>

                <SummaryCard title="Trust">
                  <p className="text-xs">
                    Experience: {payload.trust.yearsExperience || "—"}
                    <br />
                    Guarantees: {payload.trust.guarantees || "—"}
                    <br />
                    Testimonials: {payload.trust.testimonials.filter((t) => t.text?.trim()).length} with text
                  </p>
                </SummaryCard>

                <SummaryCard title="Pages & SEO">
                  <p>
                    Structure: {payload.sitePages.structure} — [{payload.sitePages.pages.join(", ")}]
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Keywords: {payload.seo.mainKeyword || "—"}
                    {payload.seo.secondaryKeywords ? `, ${payload.seo.secondaryKeywords}` : ""}
                  </p>
                </SummaryCard>

                <SummaryCard title={`Features (${payload.extraFeatures.length})`}>
                  <p className="text-xs">{payload.extraFeatures.join(", ") || "—"}</p>
                </SummaryCard>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="cursor-pointer rounded-2xl shadow-md"
                  disabled={loading}
                  onClick={generate}
                >
                  {loading ? "Generating your website…" : "Generate my website"}
                </Button>
                <Button type="button" variant="outline" className="rounded-2xl" onClick={saveDraft}>
                  Save draft
                </Button>
                <Button type="button" variant="ghost" className="rounded-2xl" onClick={resetAll}>
                  Reset
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              className="min-w-[5.5rem] cursor-pointer rounded-xl"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </Button>
            <div className="flex flex-wrap gap-2">
              {OPTIONAL_STEPS.has(step) ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                >
                  Skip
                </Button>
              ) : null}
              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  className="min-w-[5.5rem] cursor-pointer rounded-xl"
                  onClick={() => {
                    if (step === 1) {
                      if (!payload.basics.businessName.trim()) {
                        toast.error("Business name is required.");
                        return;
                      }
                      if (!payload.basics.industry.trim()) {
                        toast.error("Industry is required.");
                        return;
                      }
                    }
                    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
                  }}
                >
                  Continue
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 space-y-2 text-foreground">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function StepGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
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
