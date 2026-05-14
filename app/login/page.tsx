import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { hasSupabaseCredentials, isPublicDemoMode } from "@/lib/runtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  if (!hasSupabaseCredentials() && isPublicDemoMode()) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Login is disabled in demo mode. Open the AI builder instead.
            </p>
            <Button asChild className="w-full rounded-xl">
              <Link href="/create">Open AI builder</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-muted-foreground sm:px-6">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
