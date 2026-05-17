"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WebsiteRenderer } from "@/components/site-renderer/WebsiteRenderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";
import type { BlueprintGenerationSource } from "@/lib/openai/generate-website-blueprint";
import type { BlueprintEditSource } from "@/lib/openai/edit-blueprint";
import type { OnboardingPayload } from "@/lib/validators/onboarding";
import { GenerationSourceIndicator } from "@/components/dashboard/generation-source-indicator";
import { saveDemoDraft } from "@/lib/demo-session";
import { Undo2 } from "lucide-react";

const QUICK_INSTRUCTIONS = [
  "More premium",
  "Shorter hero",
  "Move pricing higher",
  "Add trust section",
  "More local SEO",
  "Change colors",
  "Improve mobile CTA",
];

type Rec = { recommendation_type: string; title: string; description: string; priority: string };

export function ProjectWorkspace({
  projectId,
  initialBlueprint,
  status,
  publishedSlug,
  onBlueprintUpdate,
  isDemoPreview = false,
  generationSource,
  onboarding,
}: {
  projectId: string;
  initialBlueprint: WebsiteBlueprint | null;
  status: string;
  publishedSlug: string | null;
  onBlueprintUpdate?: (blueprint: WebsiteBlueprint) => void;
  isDemoPreview?: boolean;
  generationSource?: BlueprintGenerationSource | null;
  onboarding?: OnboardingPayload | null;
}) {
  const parsed = useMemo(() => {
    if (!initialBlueprint) return null;
    const r = websiteBlueprintSchema.safeParse(initialBlueprint);
    return r.success ? r.data : null;
  }, [initialBlueprint]);

  const [blueprint, setBlueprint] = useState<WebsiteBlueprint | null>(parsed);
  const [undoStack, setUndoStack] = useState<WebsiteBlueprint[]>([]);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [recommendations, setRecommendations] = useState<Rec[] | null>(null);
  const [changeSummary, setChangeSummary] = useState<string[] | null>(null);
  const [lastEditSource, setLastEditSource] = useState<BlueprintEditSource | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const onboardingRef = useRef(onboarding);

  useEffect(() => {
    onboardingRef.current = onboarding;
  }, [onboarding]);

  useEffect(() => {
    if (parsed) setBlueprint(parsed);
  }, [parsed]);

  function persistDemo(next: WebsiteBlueprint, source?: BlueprintGenerationSource | null) {
    if (!isDemoPreview) return;
    saveDemoDraft(next, source ?? generationSource ?? "mock", onboardingRef.current ?? undefined);
  }

  function updateBlueprint(next: WebsiteBlueprint, pushUndo = false) {
    if (blueprint && pushUndo) {
      setUndoStack((stack) => [...stack.slice(-9), blueprint]);
    }
    setBlueprint(next);
    onBlueprintUpdate?.(next);
    persistDemo(next);
  }

  function handleUndo() {
    if (!undoStack.length || !blueprint) return;
    const prev = undoStack[undoStack.length - 1]!;
    setUndoStack((stack) => stack.slice(0, -1));
    setBlueprint(prev);
    onBlueprintUpdate?.(prev);
    persistDemo(prev);
    setChangeSummary(["Reverted to the previous blueprint version."]);
    setEditError(null);
    toast.success("Undid last AI edit");
  }

  async function runCheckout(packageType: "starter" | "business" | "growth") {
    if (isDemoPreview) {
      toast.message("Checkout is disabled in demo preview.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, packageType }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        toast.error(json.error ?? "Could not start checkout");
        setBusy(false);
        return;
      }
      window.location.href = json.url as string;
    } catch (e) {
      console.error(e);
      toast.error("Could not start checkout");
      setBusy(false);
    }
  }

  async function sendChat() {
    if (!blueprint) return;
    const text = instruction.trim();
    if (!text) return;

    setBusy(true);
    setEditError(null);
    setChangeSummary(null);

    try {
      const res = await fetch("/api/ai/edit-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          blueprint,
          instruction: text,
          onboarding: onboardingRef.current ?? undefined,
        }),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        blueprint?: WebsiteBlueprint;
        changeSummary?: string[];
        source?: BlueprintEditSource;
        error?: string;
      };

      if (!res.ok || !json.ok || !json.blueprint) {
        const msg = json.error ?? "AI edit failed";
        setEditError(msg);
        toast.error(msg);
        return;
      }

      const validated = websiteBlueprintSchema.safeParse(json.blueprint);
      if (!validated.success) {
        setEditError("Returned blueprint failed validation.");
        toast.error("Invalid blueprint returned");
        return;
      }

      updateBlueprint(validated.data, true);
      setChangeSummary(json.changeSummary ?? ["Blueprint updated."]);
      setLastEditSource(json.source ?? "mock");
      setInstruction("");
      toast.success(
        json.source === "openai" ? "Blueprint updated (OpenAI)" : "Blueprint updated (demo rules)",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI edit failed";
      setEditError(msg);
      console.error(e);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function runRecommendations() {
    if (!blueprint) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/recommend-improvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, blueprint }),
      });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as { recommendations?: Rec[] };
      setRecommendations(json.recommendations ?? []);
      toast.success("Recommendations ready");
    } catch {
      toast.error("Could not generate recommendations");
    } finally {
      setBusy(false);
    }
  }

  if (!blueprint) {
    return (
      <Card className="rounded-2xl border-border/60 bg-card/80">
        <CardContent className="p-6 text-sm text-muted-foreground">
          No blueprint yet. Run the builder wizard to generate a draft.
        </CardContent>
      </Card>
    );
  }

  const jsonPretty = JSON.stringify(blueprint, null, 2);
  const canUndo = undoStack.length > 0;

  return (
    <Tabs defaultValue="preview" className="space-y-6">
      <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-xl sm:h-10 sm:flex-nowrap">
        <TabsTrigger value="preview" className="rounded-lg font-medium">
          Preview
        </TabsTrigger>
        <TabsTrigger value="chat" className="rounded-lg">
          Edit with AI
        </TabsTrigger>
        <TabsTrigger value="seo" className="rounded-lg">
          SEO
        </TabsTrigger>
        <TabsTrigger value="media" className="rounded-lg">
          Media
        </TabsTrigger>
        <TabsTrigger value="blueprint" className="rounded-lg">
          Blueprint JSON
        </TabsTrigger>
        {!isDemoPreview ? (
          <>
            <TabsTrigger value="recs" className="rounded-lg text-muted-foreground">
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="packages" className="rounded-lg text-muted-foreground">
              Packages
            </TabsTrigger>
          </>
        ) : null}
      </TabsList>

      <TabsContent value="preview" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {isDemoPreview ? (
              <>
                <span className="font-medium text-foreground">{blueprint.business.name}</span>
                {" · Demo draft (saved in this browser only)"}
              </>
            ) : (
              <>
                Status: <span className="text-foreground">{status}</span>
                {publishedSlug ? (
                  <>
                    {" "}
                    · Live:{" "}
                    <a className="text-primary hover:underline" href={`/site/${publishedSlug}`}>
                      /site/{publishedSlug}
                    </a>
                  </>
                ) : null}
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lastEditSource ? (
              <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
                Last edit: {lastEditSource === "openai" ? "OpenAI" : "Demo rules"}
              </span>
            ) : null}
            <GenerationSourceIndicator source={generationSource} />
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-xl">
          <WebsiteRenderer blueprint={blueprint} projectId={projectId} showContactForm />
        </div>
      </TabsContent>

      <TabsContent value="blueprint" className="space-y-3">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardContent className="p-4">
            <p className="mb-2 text-xs text-muted-foreground">
              Full structured blueprint (validated JSON). Copy for backups or integrations.
            </p>
            <pre className="max-h-[min(70vh,560px)] overflow-auto rounded-xl border border-border/60 bg-muted/30 p-4 text-xs">
              {jsonPretty}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chat" className="space-y-3">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Describe changes in plain language. The editor updates your JSON blueprint only — never
              executable code. Services and pricing stay exact unless you explicitly ask to change them.
              Testimonials are never invented.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_INSTRUCTIONS.map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-auto rounded-full px-3 py-1.5 text-xs sm:text-sm"
                  disabled={busy}
                  onClick={() => setInstruction(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
            <Textarea
              rows={4}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder='Tell AI what to change… e.g. "Make it more luxury and move pricing higher"'
              className="text-base"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button className="min-h-12 rounded-xl text-base" disabled={busy} onClick={sendChat}>
                {busy ? "Applying changes…" : "Apply changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-12 rounded-xl"
                disabled={busy || !canUndo}
                onClick={handleUndo}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Undo last change
              </Button>
            </div>

            {busy ? (
              <p className="text-sm text-muted-foreground">Updating blueprint…</p>
            ) : null}

            {editError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {editError}
              </div>
            ) : null}

            {changeSummary?.length ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                <p className="font-semibold text-foreground">What changed</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  {changeSummary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="media" className="space-y-3">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardContent className="space-y-3 p-6 text-sm">
            {blueprint.media?.length ? (
              <ul className="space-y-3">
                {blueprint.media.map((m) => (
                  <li key={m.id || m.fileName} className="rounded-xl border border-border/60 p-3">
                    <p className="font-medium">{m.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.assetType} · {m.placement?.join(", ") || "—"}
                    </p>
                    {m.previewDataUrl?.startsWith("data:image") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.previewDataUrl}
                        alt={m.altText || ""}
                        className="mt-2 h-24 w-24 rounded-lg object-cover"
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No media assets stored on this blueprint yet.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardContent className="space-y-2 p-6 text-sm">
            <p className="font-medium">Title</p>
            <p className="text-muted-foreground">{blueprint.seo.title}</p>
            <p className="pt-2 font-medium">Description</p>
            <p className="text-muted-foreground">{blueprint.seo.description}</p>
            <p className="pt-2 font-medium">Keywords</p>
            <p className="text-muted-foreground">{blueprint.seo.keywords.join(", ")}</p>
            <p className="pt-2 font-medium">Local SEO</p>
            <p className="text-muted-foreground">{blueprint.seo.localSeoText}</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="recs" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" disabled={busy} onClick={runRecommendations}>
            Generate recommendations
          </Button>
        </div>
        {recommendations?.length ? (
          <ul className="space-y-3">
            {recommendations.map((r, i) => (
              <Card key={i} className="rounded-xl border-border/60">
                <CardContent className="space-y-1 p-4 text-sm">
                  <p className="font-medium">
                    {r.title}{" "}
                    <span className="text-xs font-normal text-muted-foreground">({r.priority})</span>
                  </p>
                  <p className="text-muted-foreground">{r.description}</p>
                </CardContent>
              </Card>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Run the generator to see suggestions, or connect OpenAI for richer output.
          </p>
        )}
      </TabsContent>

      <TabsContent value="packages">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardContent className="space-y-3 p-6">
            {isDemoPreview ? (
              <p className="text-sm text-muted-foreground">
                Stripe checkout is disabled in demo preview. Connect billing later when you go live.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <Button disabled={busy} className="rounded-xl" onClick={() => runCheckout("starter")}>
                  Starter — 99 €
                </Button>
                <Button disabled={busy} className="rounded-xl" onClick={() => runCheckout("business")}>
                  Business — 299 €
                </Button>
                <Button disabled={busy} className="rounded-xl" onClick={() => runCheckout("growth")}>
                  Growth — 49 €/mo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
