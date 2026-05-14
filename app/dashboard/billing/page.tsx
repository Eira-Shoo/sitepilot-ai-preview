import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
      <Card className="rounded-2xl border-border/60 bg-card/80">
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          <p>
            Stripe Checkout handles payments. After a successful payment, your project status updates to{" "}
            <span className="text-foreground">paid</span> automatically via webhook.
          </p>
          <p>Customer billing portal (subscriptions) can be added with Stripe Customer Portal sessions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
