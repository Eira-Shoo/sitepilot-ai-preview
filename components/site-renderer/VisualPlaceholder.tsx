import { ImageIcon, Sparkles } from "lucide-react";

type Props = {
  imagePrompt?: string;
  label?: string;
  aspectClass?: string;
  className?: string;
};

function shortenPrompt(prompt: string, max = 140): string {
  const t = prompt.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function VisualPlaceholder({
  imagePrompt,
  label = "Premium visual",
  aspectClass = "aspect-[4/3]",
  className = "",
}: Props) {
  const shortPrompt = imagePrompt ? shortenPrompt(imagePrompt) : "";

  return (
    <div
      className={`relative flex ${aspectClass} w-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--sp-secondary,#c9a227)]/25 bg-gradient-to-br from-[var(--sp-primary,#0a0a0a)]/80 via-[var(--sp-primary,#0f172a)]/50 to-[var(--sp-secondary,#c9a227)]/20 p-6 sm:p-8 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[var(--sp-secondary,#c9a227)]/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sp-secondary,#c9a227)]/30 bg-background/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--sp-secondary,#c9a227)] backdrop-blur sm:text-xs">
          <Sparkles className="h-3 w-3" />
          AI image suggestion
        </span>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-background/40 backdrop-blur">
          <ImageIcon className="h-5 w-5 text-[var(--sp-secondary,#c9a227)]" />
        </div>
      </div>

      <div className="relative mt-auto space-y-2 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {shortPrompt ? (
          <p className="text-sm leading-relaxed text-foreground/95 sm:text-base sm:leading-relaxed">
            {shortPrompt}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Premium photography placeholder — upload your own image or generate with AI.
          </p>
        )}
      </div>
    </div>
  );
}
