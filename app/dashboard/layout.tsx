import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { hasSupabaseCredentials } from "@/lib/runtime";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const offline = !hasSupabaseCredentials();
  const supabase = await createClient();
  let profile: { role?: string } | null = null;
  if (supabase) {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (u) {
      const { data: p } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", u.id)
        .maybeSingle();
      profile = p;
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl gap-6 px-4 py-10 sm:px-6">
      <aside className="hidden w-56 shrink-0 flex-col gap-2 border-r border-border/60 pr-4 md:flex">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Customer
        </p>
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/dashboard">
          My projects
        </Link>
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/dashboard/billing">
          Billing
        </Link>
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/create">
          New build
        </Link>
        {!offline && profile?.role === "admin" ? (
          <>
            <p className="pt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Admin
            </p>
            <Link className="text-sm text-primary hover:underline" href="/admin">
              Admin dashboard
            </Link>
          </>
        ) : null}
        {offline ? (
          <p className="pt-4 text-xs text-muted-foreground">
            Preview deploy: connect Supabase to enable accounts and admin tools.
          </p>
        ) : null}
        <div className="flex-1" />
        {supabase ? <SignOutButton /> : null}
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
