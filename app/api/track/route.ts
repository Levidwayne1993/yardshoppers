import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { page, referrer, city, region, category, session_id, user_id } =
      await req.json();

    if (!page || !session_id) {
      return NextResponse.json(
        { error: "page and session_id are required" },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") || "";

    const { error } = await supabase.from("page_views").insert({
      page,
      referrer: referrer || null,
      city: city || null,
      region: region || null,
      category: category || null,
      session_id,
      user_id: user_id || null,
      user_agent: userAgent,
    });

    if (error) {
      console.error("Failed to track page view:", error);
      return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
