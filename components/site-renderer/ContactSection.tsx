"use client";

import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type C = Extract<BlueprintSection, { type: "contact" }>;

export function ContactSection({
  section,
  projectId,
  publishedSlug,
  enabled,
}: {
  section: C;
  projectId?: string;
  publishedSlug?: string;
  enabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId) {
      toast.error("Save your project to enable the contact form.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const honeypot = String(form.get("company") ?? "");
    if (honeypot) {
      toast.success("Thanks — we will be in touch.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          publishedSlug,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          message: form.get("message"),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      toast.success("Message sent. We will reply shortly.");
      (e.target as HTMLFormElement).reset();
    } catch {
      toast.error("Could not send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fields = section.formFields?.length
    ? section.formFields
    : ["name", "email", "phone", "message"];

  return (
    <section id="contact" className="border-t border-border/60 bg-muted/10 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">{section.headline}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Secure delivery to your project inbox. No AI-generated legal promises —
            we route this to your team.
          </p>
        </div>
        {enabled ? (
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm"
          >
            <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />
            {fields.includes("name") ? (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
            ) : null}
            {fields.includes("email") ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
            ) : null}
            {fields.includes("phone") ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
            ) : null}
            {fields.includes("message") ? (
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" rows={4} required />
              </div>
            ) : null}
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Sending…" : "Send message"}
            </Button>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
            Contact form is disabled in this preview context.
          </div>
        )}
      </div>
    </section>
  );
}
