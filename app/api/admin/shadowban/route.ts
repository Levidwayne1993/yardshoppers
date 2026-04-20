import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "erwin-levi@outlook.com";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search");

  if (search) {
    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, email, is_shadowbanned, shadowbanned_at")
      .or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: users || [] });
  }

  const { data: shadowbanned, error } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, email, is_shadowbanned, shadowban_reason, shadowbanned_at")
    .eq("is_shadowbanned", true)
    .order("shadowbanned_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (shadowbanned || []).map(async (profile: Record<string, unknown>) => {
      const { count } = await supabaseAdmin
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id as string);
      return { ...profile, listing_count: count || 0 };
    })
  );

  return NextResponse.json({ shadowbanned: enriched });
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user_id, reason } = await req.json();
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });
  if (user_id === admin.id) return NextResponse.json({ error: "Cannot shadowban yourself" }, { status: 400 });

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      is_shadowbanned: true,
      shadowban_reason: reason || "Spam / policy violation",
      shadowbanned_at: new Date().toISOString(),
    })
    .eq("id", user_id);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { data: updated, error: listingError } = await supabaseAdmin
    .from("listings")
    .update({ is_shadowbanned: true })
    .eq("user_id", user_id)
    .select("id");

  if (listingError) return NextResponse.json({ error: listingError.message }, { status: 500 });

  await supabaseAdmin.from("shadowban_log").insert({
    user_id, action: "shadowban", reason: reason || "Spam / policy violation",
    admin_id: admin.id, listings_affected: updated?.length || 0,
  });

  return NextResponse.json({ success: true, listings_hidden: updated?.length || 0 });
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ is_shadowbanned: false, shadowban_reason: null, shadowbanned_at: null })
    .eq("id", user_id);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { data: restored, error: listingError } = await supabaseAdmin
    .from("listings")
    .update({ is_shadowbanned: false })
    .eq("user_id", user_id)
    .select("id");

  if (listingError) return NextResponse.json({ error: listingError.message }, { status: 500 });

  await supabaseAdmin.from("shadowban_log").insert({
    user_id, action: "unshadowban", reason: "Removed by admin",
    admin_id: admin.id, listings_affected: restored?.length || 0,
  });

  return NextResponse.json({ success: true, listings_restored: restored?.length || 0 });
}
