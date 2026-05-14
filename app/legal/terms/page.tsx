export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service (placeholder)">
      <p>
        This is placeholder legal text. Replace with counsel-reviewed terms before launch. SitePilot AI /
        Eira Web Studio provides software and optional services; availability and SLA are defined in your
        order form.
      </p>
    </LegalShell>
  );
}

function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6 max-w-none space-y-3 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
