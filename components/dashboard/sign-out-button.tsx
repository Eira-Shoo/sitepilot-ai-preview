"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full rounded-xl"
      onClick={async () => {
        const supabase = createClient();
        if (supabase) await supabase.auth.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
