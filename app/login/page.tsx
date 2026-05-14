import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
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
