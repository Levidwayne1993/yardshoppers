import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(token);

  if (
    authErr ||
    !user ||
    !ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId, shadowban } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Prevent admins from banning themselves
  if (userId === user.id) {
    return NextResponse.json(
      { error: "Cannot shadow ban yourself" },
      { status: 400 }
    );
  }

  // Update the user's profile
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ is_shadow_banned: !!shadowban })
    .eq("id", userId);

  if (profileErr) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }

  // Also shadow-ban all of the user's listings
  await supabase
    .from("listings")
    .update({ is_shadowbanned: !!shadowban })
    .eq("user_id", userId);

  return NextResponse.json({
    success: true,
    is_shadow_banned: !!shadowban,
  });
}
