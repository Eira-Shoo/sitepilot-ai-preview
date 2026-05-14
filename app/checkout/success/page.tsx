import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Checkout success" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <Card className="rounded-2xl border-border/60 bg-card/80">
        <CardContent className="space-y-3 p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Payment received</h1>
          <p className="text-sm text-muted-foreground">
            Thank you. Stripe has confirmed this session. Your project status will update to{" "}
            <span className="text-foreground">paid</span> via webhook when configured.
          </p>
          {sp.session_id ? (
            <p className="text-xs text-muted-foreground">Session {sp.session_id}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
