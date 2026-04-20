import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "erwin-levi@outlook.com";
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll() } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const view = req.nextUrl.searchParams.get("view");

  if (view === "redemptions") {
    const { data, error } = await supabaseAdmin.from("promo_redemptions").select("*, promo_codes(code, description)").order("redeemed_at", { ascending: false }).limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ redemptions: data || [] });
  }
  if (view === "credits") {
    const { data, error } = await supabaseAdmin.from("boost_credits").select("*").order("granted_at", { ascending: false }).limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ credits: data || [] });
  }

  const { data, error } = await supabaseAdmin.from("promo_codes").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ codes: data || [] });
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();

  // GRANT DIRECT BOOST CREDIT
  if (body.action === "grant_credit") {
    const { listing_id, boost_tier, duration_days, reason } = body;
    if (!listing_id || !boost_tier || !duration_days) return NextResponse.json({ error: "listing_id, boost_tier, and duration_days required" }, { status: 400 });

    const { data: listing, error: le } = await supabaseAdmin.from("listings").select("id, user_id, title").eq("id", listing_id).single();
    if (le || !listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000);

    const { error: ue } = await supabaseAdmin.from("listings").update({
      is_boosted: true, boosted_at: now.toISOString(), boost_tier,
      boost_started_at: now.toISOString(), boost_expires_at: expiresAt.toISOString(),
    }).eq("id", listing_id);
    if (ue) return NextResponse.json({ error: ue.message }, { status: 500 });

    await supabaseAdmin.from("boost_credits").insert({
      listing_id, user_id: listing.user_id, boost_tier, duration_days,
      reason: reason || "Admin granted free boost", granted_by: admin.id, activated_at: now.toISOString(),
    });

    return NextResponse.json({ success: true, message: `Free ${boost_tier} boost activated for "${listing.title}" (${duration_days} days)` });
  }

  // CREATE PROMO CODE
  const { code, description, discount_type, discount_value, boost_tier, duration_days, max_uses, expires_at } = body;
  if (!code || !discount_type) return NextResponse.json({ error: "code and discount_type required" }, { status: 400 });
  if (!["percentage", "fixed", "free_boost"].includes(discount_type)) return NextResponse.json({ error: "Invalid discount_type" }, { status: 400 });
  if (discount_type === "free_boost" && !boost_tier) return NextResponse.json({ error: "boost_tier required for free_boost" }, { status: 400 });

  const { data: newCode, error } = await supabaseAdmin.from("promo_codes").insert({
    code: code.toUpperCase().trim(), description: description || null, discount_type,
    discount_value: discount_value || 0, boost_tier: boost_tier || null,
    duration_days: duration_days || null, max_uses: max_uses || null,
    expires_at: expires_at || null, created_by: admin.id,
  }).select().single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, code: newCode });
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { promo_id, is_active } = await req.json();
  if (!promo_id || typeof is_active !== "boolean") return NextResponse.json({ error: "promo_id and is_active required" }, { status: 400 });
  const { error } = await supabaseAdmin.from("promo_codes").update({ is_active }).eq("id", promo_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
