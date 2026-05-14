"use client";

import { useEffect } from "react";

export function AnalyticsBeacon({
  projectId,
}: {
  projectId: string;
}) {
  useEffect(() => {
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        eventName: "page_view",
        pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
      }),
    });
  }, [projectId]);

  return null;
}
