"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("ys_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("ys_session_id", sid);
  }
  return sid;
}

function extractCategory(path: string): string | null {
  const match = path.match(/^\/category\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const track = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();
      if (!sessionId) return;

      const city = localStorage.getItem("ys_city") || null;
      const region = localStorage.getItem("ys_region") || null;

      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: pathname,
          referrer: document.referrer || null,
          city,
          region,
          category: extractCategory(pathname),
          session_id: sessionId,
          user_id: user?.id || null,
        }),
      });
    };

    const timer = setTimeout(track, 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
