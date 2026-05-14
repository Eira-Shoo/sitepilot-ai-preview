import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  isSubscription,
  packageAmountEUR,
  PACKAGE_LABELS,
} from "@/lib/stripe/client";
import { isDemoDeploy } from "@/lib/runtime";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  packageType: z.enum(["starter", "business", "growth"]),
});

export async function POST(request: Request) {
  if (isDemoDeploy() || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Checkout is disabled in this preview (add STRIPE_SECRET_KEY and Supabase)." },
      { status: 503 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_URL" }, { status: 500 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", parsed.data.projectId)
    .maybeSingle();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stripe = getStripe();
  const pkg = parsed.data.packageType;
  const amount = packageAmountEUR(pkg);
  const subscription = isSubscription(pkg);

  const lineItem = subscription
    ? {
        quantity: 1,
        price_data: {
          currency: "eur" as const,
          unit_amount: amount,
          recurring: { interval: "month" as const },
          product_data: {
            name: PACKAGE_LABELS[pkg] ?? pkg,
            metadata: { package_type: pkg },
          },
        },
      }
    : {
        quantity: 1,
        price_data: {
          currency: "eur" as const,
          unit_amount: amount,
          product_data: {
            name: PACKAGE_LABELS[pkg] ?? pkg,
            metadata: { package_type: pkg },
          },
        },
      };

  const session = await stripe.checkout.sessions.create({
    mode: subscription ? "subscription" : "payment",
    customer_email: user.email ?? undefined,
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/projects/${parsed.data.projectId}`,
    metadata: {
      project_id: parsed.data.projectId,
      package_type: pkg,
      user_id: user.id,
    },
    line_items: [lineItem],
  });

  await supabase
    .from("projects")
    .update({ package_type: pkg, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.projectId);

  await supabase.from("payments").insert({
    user_id: user.id,
    project_id: parsed.data.projectId,
    stripe_session_id: session.id,
    amount,
    currency: "eur",
    status: "pending",
  });

  return NextResponse.json({ url: session.url });
}
