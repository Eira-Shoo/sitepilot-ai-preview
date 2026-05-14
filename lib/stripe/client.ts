import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export const PACKAGE_LABELS: Record<string, string> = {
  starter: "AI Landing Page",
  business: "Business Website",
  growth: "Website + Monthly Care",
};

export function packageAmountEUR(packageType: string): number {
  switch (packageType) {
    case "starter":
      return 9900;
    case "business":
      return 29900;
    case "growth":
      return 4900;
    default:
      throw new Error("Unknown package");
  }
}

export function isSubscription(packageType: string) {
  return packageType === "growth";
}
