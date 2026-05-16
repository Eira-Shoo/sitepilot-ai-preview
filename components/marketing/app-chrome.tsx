"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const nav = [
  { href: "/pricing", label: "Pricing" },
  { href: "/preview", label: "Live preview" },
  { href: "/create", label: "AI builder" },
  { href: "/contact", label: "Contact" },
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublished = pathname?.startsWith("/site/");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setUser(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isPublished) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="hidden sm:inline">SitePilot AI</span>
            <span className="text-xs text-muted-foreground sm:hidden">SitePilot</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground",
                  pathname === item.href && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild>
                  <Link href="/create">Create</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/create">Start free</Link>
                </Button>
              </>
            )}
            <MobileNav pathname={pathname} user={user} />
          </div>
        </div>
      </header>
      <main className="pt-16">{children}</main>
    </>
  );
}

function MobileNav({ pathname, user }: { pathname: string | null; user: User | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="icon"
        className="rounded-xl"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
      >
        <Menu className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute left-4 right-4 top-16 z-50 rounded-2xl border border-border bg-card p-4 shadow-xl">
          <div className="flex flex-col gap-3 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(pathname === item.href && "font-medium text-primary")}
              >
                {item.label}
              </Link>
            ))}
            <Link href={user ? "/dashboard" : "/login"} onClick={() => setOpen(false)}>
              {user ? "Dashboard" : "Log in"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
