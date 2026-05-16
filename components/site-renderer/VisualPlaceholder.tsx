import { ImageIcon } from "lucide-react";

type Props = {
  imagePrompt?: string;
  label?: string;
  aspectClass?: string;
  className?: string;
};

export function VisualPlaceholder({
  imagePrompt,
  label = "Premium visual",
  aspectClass = "aspect-[4/3]",
  className = "",
}: Props) {
  return (
    <div
      className={`relative flex ${aspectClass} w-full flex-col justify-end overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[var(--sp-primary,#0f172a)]/25 via-[var(--sp-secondary,#c9a227)]/15 to-muted/40 p-5 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/40 backdrop-blur">
          <ImageIcon className="h-5 w-5 text-[var(--sp-secondary,#c9a227)]" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {imagePrompt ? (
            <p className="line-clamp-4 text-sm leading-relaxed text-foreground/90">
              {imagePrompt}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Professional imagery for this section</p>
          )}
        </div>
      </div>
    </div>
  );
}
