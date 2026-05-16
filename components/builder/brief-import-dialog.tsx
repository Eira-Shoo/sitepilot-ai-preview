"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APEX_BARBER_BRIEF } from "@/lib/onboarding/apex-barber-brief";
import { mergeOnboardingImport } from "@/lib/onboarding/merge-onboarding-import";
import {
  parseBusinessBriefText,
  previewFromOnboardingPartial,
  type BriefImportPreview,
} from "@/lib/onboarding/parse-business-brief";
import type { OnboardingPayload } from "@/lib/validators/onboarding";
import { toast } from "sonner";
import { FileUp, Sparkles, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (payload: OnboardingPayload) => void;
};

export function BriefImportDialog({ open, onClose, onApply }: Props) {
  const [tab, setTab] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [preview, setPreview] = useState<BriefImportPreview | null>(null);
  const [pending, setPending] = useState<OnboardingPayload | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/ai/generation-status")
      .then((r) => r.json())
      .then((s: { demoMode?: boolean; openaiKeyDetected?: boolean }) => {
        setAiAvailable(Boolean(s.openaiKeyDetected && !s.demoMode));
      })
      .catch(() => setAiAvailable(false));
  }, [open]);

  const resetPreview = useCallback(() => {
    setPreview(null);
    setPending(null);
    setConfirmReplace(false);
  }, []);

  const showPreview = useCallback((p: BriefImportPreview, data: OnboardingPayload) => {
    setPreview(p);
    setPending(data);
    setConfirmReplace(false);
  }, []);

  const analyzeText = useCallback(
    async (text: string, useAi: boolean) => {
      const trimmed = text.trim();
      if (trimmed.length < 8) {
        toast.error("Brief is too short to parse.");
        return;
      }
      setParsing(true);
      try {
        if (useAi && aiAvailable) {
          const res = await fetch("/api/ai/parse-brief", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed }),
          });
          const json = (await res.json()) as {
            ok?: boolean;
            onboarding?: OnboardingPayload;
            preview?: BriefImportPreview;
            error?: string;
            source?: string;
          };
          if (json.ok && json.onboarding) {
            showPreview(
              json.preview ?? previewFromOnboardingPartial(json.onboarding),
              json.onboarding,
            );
            toast.success(
              json.source === "openai"
                ? "Parsed with AI"
                : "Parsed locally",
            );
            return;
          }
        }

        const local = parseBusinessBriefText(trimmed);
        const merged = mergeOnboardingImport(local.partial);
        if (!merged.success) {
          toast.error(merged.error);
          return;
        }
        showPreview(local.preview, merged.data);
        toast.success("Parsed locally");
      } catch {
        toast.error("Could not parse brief.");
      } finally {
        setParsing(false);
      }
    },
    [aiAvailable, showPreview],
  );

  const analyzeJson = useCallback(
    (raw: string) => {
      setParsing(true);
      try {
        const parsed = JSON.parse(raw) as unknown;
        const merged = mergeOnboardingImport(parsed);
        if (!merged.success) {
          toast.error(merged.error);
          return;
        }
        showPreview(previewFromOnboardingPartial(merged.data), merged.data);
        toast.success("JSON imported");
      } catch {
        toast.error("Invalid JSON");
      } finally {
        setParsing(false);
      }
    },
    [showPreview],
  );

  async function handleFile(file: File) {
    if (file.size > 500_000) {
      toast.error("File too large (max 500 KB).");
      return;
    }
    const text = await file.text();
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "json") {
      setJsonInput(text);
      setTab("json");
      analyzeJson(text);
      return;
    }
    setTextInput(text);
    setTab("text");
    await analyzeText(text, aiAvailable);
  }

  function handleApply() {
    if (!pending) return;
    if (!confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    onApply(pending);
    onClose();
    resetPreview();
    setTextInput("");
    setJsonInput("");
    toast.success("Wizard filled from brief");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brief-import-title"
    >
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-border/60 bg-card shadow-xl">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle id="brief-import-title">Import business brief</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste text, upload a file, or import JSON to fill the wizard automatically.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setTextInput(APEX_BARBER_BRIEF);
              setTab("text");
              void analyzeText(APEX_BARBER_BRIEF, false);
            }}
          >
            Load Apex Barber test brief
          </Button>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="text" className="flex-1">
                Paste text
              </TabsTrigger>
              <TabsTrigger value="file" className="flex-1">
                Upload file
              </TabsTrigger>
              <TabsTrigger value="json" className="flex-1">
                Paste JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-3">
              <Textarea
                rows={12}
                placeholder="Business name: …&#10;Industry: …&#10;Services:&#10;- Service | price | duration"
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  resetPreview();
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={parsing}
                  onClick={() => analyzeText(textInput, false)}
                >
                  Preview (local)
                </Button>
                {aiAvailable ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={parsing}
                    onClick={() => analyzeText(textInput, true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Parse with AI
                  </Button>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-3">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-sm text-muted-foreground hover:border-primary/40">
                <FileUp className="h-8 w-8 text-primary" />
                <span>.txt, .json, or .md (max 500 KB)</span>
                <input
                  type="file"
                  accept=".txt,.json,.md,text/plain,application/json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </TabsContent>

            <TabsContent value="json" className="space-y-3">
              <Textarea
                rows={12}
                placeholder='{ "basics": { "businessName": "…" }, … }'
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  resetPreview();
                }}
              />
              <Button type="button" disabled={parsing} onClick={() => analyzeJson(jsonInput)}>
                Preview JSON
              </Button>
            </TabsContent>
          </Tabs>

          {preview ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
              <p className="font-semibold text-foreground">Detected business data</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {preview.businessName ? (
                  <li>
                    <span className="text-foreground">Business:</span> {preview.businessName}
                  </li>
                ) : null}
                {preview.industry ? (
                  <li>
                    <span className="text-foreground">Industry:</span> {preview.industry}
                  </li>
                ) : null}
                {preview.city || preview.country ? (
                  <li>
                    <span className="text-foreground">Location:</span>{" "}
                    {[preview.city, preview.country].filter(Boolean).join(", ")}
                  </li>
                ) : null}
                {preview.goal ? (
                  <li>
                    <span className="text-foreground">Goal:</span> {preview.goal}
                  </li>
                ) : null}
                {preview.targetAudience ? (
                  <li>
                    <span className="text-foreground">Audience:</span> {preview.targetAudience}
                  </li>
                ) : null}
                {preview.styles.length ? (
                  <li>
                    <span className="font-medium text-foreground">Styles:</span>{" "}
                    {preview.styles.join(", ")}
                  </li>
                ) : null}
                {preview.moods.length ? (
                  <li>
                    <span className="font-medium text-foreground">Mood:</span>{" "}
                    {preview.moods.join(", ")}
                  </li>
                ) : null}
                {preview.services.length ? (
                  <li>
                    <span className="font-medium text-foreground">Services:</span>
                    <ul className="mt-1 list-inside list-disc pl-1">
                      {preview.services.map((s) => (
                        <li key={s.name}>
                          {s.name}
                          {s.price || s.duration
                            ? ` — ${[s.price, s.duration].filter(Boolean).join(" — ")}`
                            : ""}
                          {s.description ? ` — ${s.description}` : ""}
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : null}
                {preview.trustPoints.length ? (
                  <li>
                    <span className="font-medium text-foreground">Trust:</span>{" "}
                    {preview.trustPoints.join(", ")}
                  </li>
                ) : null}
                {preview.seoKeywords.length ? (
                  <li>
                    <span className="font-medium text-foreground">SEO keywords:</span>{" "}
                    {preview.seoKeywords.join(", ")}
                  </li>
                ) : null}
                {preview.features.length ? (
                  <li>
                    <span className="font-medium text-foreground">Features:</span>{" "}
                    {preview.features.join(", ")}
                  </li>
                ) : null}
              </ul>
              {preview.warnings?.length ? (
                <ul className="mt-3 space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  {preview.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {confirmReplace ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              This will replace your current answers. Click Apply again to confirm.
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border/40 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" disabled={!pending} onClick={handleApply}>
              Apply to wizard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
