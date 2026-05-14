"use client";

import { useMemo, useState } from "react";
import { WebsiteRenderer } from "@/components/site-renderer/WebsiteRenderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";

export function ProjectWorkspace({
  projectId,
  initialBlueprint,
  status,
  publishedSlug,
}: {
  projectId: string;
  initialBlueprint: WebsiteBlueprint | null;
  status: string;
  publishedSlug: string | null;
}) {
  const parsed = useMemo(() => {
    if (!initialBlueprint) return null;
    const r = websiteBlueprintSchema.safeParse(initialBlueprint);
    return r.success ? r.data : null;
  }, [initialBlueprint]);

  const [blueprint, setBlueprint] = useState<WebsiteBlueprint | null>(parsed);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);

  async function runCheckout(packageType: "starter" | "business" | "growth") {
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
      setBlueprint(json.blueprint as WebsiteBlueprint);
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
    setBusy(true);
    try {
      const res = await fetch("/api/ai/recommend-improvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, blueprint }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("Recommendations generated");
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

  return (
    <Tabs defaultValue="preview" className="space-y-6">
      <TabsList className="rounded-xl">
        <TabsTrigger value="preview">Live preview</TabsTrigger>
        <TabsTrigger value="chat">AI chat editor</TabsTrigger>
        <TabsTrigger value="packages">Packages</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
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
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={runRecommendations} disabled={busy}>
            Ask AI for improvements
          </Button>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-xl">
          <WebsiteRenderer blueprint={blueprint} projectId={projectId} showContactForm />
        </div>
      </TabsContent>
      <TabsContent value="chat" className="space-y-3">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">
              Ask for changes in plain language. The model returns an updated JSON blueprint — never raw
              code.
            </p>
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
      <TabsContent value="packages">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardContent className="grid gap-3 p-6 sm:grid-cols-3">
            <Button disabled={busy} className="rounded-xl" onClick={() => runCheckout("starter")}>
              Starter — 99 €
            </Button>
            <Button disabled={busy} className="rounded-xl" onClick={() => runCheckout("business")}>
              Business — 299 €
            </Button>
            <Button disabled={busy} className="rounded-xl" onClick={() => runCheckout("growth")}>
              Growth — 49 €/mo
            </Button>
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
    </Tabs>
  );
}
