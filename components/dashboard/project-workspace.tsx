"use client";

import { useEffect, useMemo, useState } from "react";
import { WebsiteRenderer } from "@/components/site-renderer/WebsiteRenderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";

const QUICK_INSTRUCTIONS = [
  "Make it more premium",
  "Use my uploaded logo in the hero",
  "Move pricing higher",
  "Add a trust section",
  "Make the CTA softer",
  "Rewrite for local customers",
  "Add FAQ questions",
  "Add image prompts for every section",
];

type Rec = { recommendation_type: string; title: string; description: string; priority: string };

export function ProjectWorkspace({
  projectId,
  initialBlueprint,
  status,
  publishedSlug,
  onBlueprintUpdate,
  isDemoPreview = false,
}: {
  projectId: string;
  initialBlueprint: WebsiteBlueprint | null;
  status: string;
  publishedSlug: string | null;
  onBlueprintUpdate?: (blueprint: WebsiteBlueprint) => void;
  isDemoPreview?: boolean;
}) {
  const parsed = useMemo(() => {
    if (!initialBlueprint) return null;
    const r = websiteBlueprintSchema.safeParse(initialBlueprint);
    return r.success ? r.data : null;
  }, [initialBlueprint]);

  const [blueprint, setBlueprint] = useState<WebsiteBlueprint | null>(parsed);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [recommendations, setRecommendations] = useState<Rec[] | null>(null);

  useEffect(() => {
    if (parsed) setBlueprint(parsed);
  }, [parsed]);

  function updateBlueprint(next: WebsiteBlueprint) {
    setBlueprint(next);
    onBlueprintUpdate?.(next);
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
    if (!instruction.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/edit-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, blueprint, instruction }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      updateBlueprint(json.blueprint as WebsiteBlueprint);
      setInstruction("");
      toast.success("Blueprint updated");
    } catch (e) {
      console.error(e);
      toast.error("AI edit failed");
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

  return (
    <Tabs defaultValue="preview" className="space-y-6">
      <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-xl sm:h-10 sm:flex-nowrap">
        <TabsTrigger value="preview" className="rounded-lg">
          Preview
        </TabsTrigger>
        <TabsTrigger value="blueprint" className="rounded-lg">
          Blueprint JSON
        </TabsTrigger>
        <TabsTrigger value="media" className="rounded-lg">
          Media
        </TabsTrigger>
        <TabsTrigger value="seo" className="rounded-lg">
          SEO
        </TabsTrigger>
        <TabsTrigger value="chat" className="rounded-lg">
          AI editor
        </TabsTrigger>
        <TabsTrigger value="recs" className="rounded-lg">
          Recommendations
        </TabsTrigger>
        <TabsTrigger value="packages" className="rounded-lg">
          Packages
        </TabsTrigger>
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
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">
              Plain-language edits return an updated JSON blueprint (never raw executable code). In demo mode, edits
              use lightweight mock rules unless you configure OpenAI.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_INSTRUCTIONS.map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-auto rounded-full px-3 py-1 text-xs"
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
              placeholder='Example: "Make the hero more luxury" or "Add a pricing section"'
            />
            <Button className="rounded-xl" disabled={busy} onClick={sendChat}>
              {busy ? "Updating…" : "Apply AI changes"}
            </Button>
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
            Run the generator to see canned demo suggestions, or connect OpenAI for richer output.
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
