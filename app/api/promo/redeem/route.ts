// ============================================================
// NEW FILE — CREATE AT: app/api/promo/redeem/route.ts
//
// Public promo code endpoint (authenticated users, NOT admin-only).
// GET  → validate a promo code (check if valid before submitting)
// POST → redeem a promo code against a specific listing
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ─── GET /api/promo/redeem?code=XXXX ───────────────────────
// Validates a promo code without consuming it.
// Called when the user clicks "Apply" on the post form.
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();
  if (!code)
    return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const { data: promo, error } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (error || !promo) {
    return NextResponse.json({
      valid: false,
      error: "Invalid or inactive promo code",
    });
  }

  // Check expiration
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({
      valid: false,
      error: "This promo code has expired",
    });
  }

  // Check max uses
  if (promo.max_uses && promo.uses_count >= promo.max_uses) {
    return NextResponse.json({
      valid: false,
      error: "This promo code has reached its usage limit",
    });
  }

  // Check user-specific restriction
  if (promo.target_user_id && promo.target_user_id !== user.id) {
    return NextResponse.json({
      valid: false,
      error: "This promo code is not available for your account",
    });
  }

  // Build a friendly benefit description
  let benefit = "";
  if (promo.discount_type === "free_boost") {
    const tierName = promo.boost_tier
      ? promo.boost_tier.charAt(0).toUpperCase() + promo.boost_tier.slice(1)
      : "Spark";
    const days = promo.duration_days || 7;
    benefit = `Free ${tierName} boost for ${days} day${days !== 1 ? "s" : ""}`;
  } else if (promo.discount_type === "percentage") {
    benefit = `${promo.discount_value}% off your boost purchase`;
  } else if (promo.discount_type === "fixed") {
    benefit = `$${promo.discount_value} off your boost purchase`;
  }

  return NextResponse.json({
    valid: true,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    boost_tier: promo.boost_tier,
    duration_days: promo.duration_days,
    benefit,
  });
}

// ─── POST /api/promo/redeem ────────────────────────────────
// Redeems a validated promo code for a specific listing.
// Called right after the listing is created.
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, listing_id } = await req.json();

  if (!code || !listing_id) {
    return NextResponse.json(
      { error: "code and listing_id are required" },
      { status: 400 }
    );
  }

  const upperCode = code.toUpperCase().trim();

  // ── Fetch & re-validate the promo code ──
  const { data: promo, error: pe } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .eq("code", upperCode)
    .eq("is_active", true)
    .single();

  if (pe || !promo) {
    return NextResponse.json(
      { error: "Invalid or inactive promo code" },
      { status: 400 }
    );
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This promo code has expired" },
      { status: 400 }
    );
  }

  if (promo.max_uses && promo.uses_count >= promo.max_uses) {
    return NextResponse.json(
      { error: "This promo code has reached its usage limit" },
      { status: 400 }
    );
  }

  if (promo.target_user_id && promo.target_user_id !== user.id) {
    return NextResponse.json(
      { error: "This promo code is not available for your account" },
      { status: 400 }
    );
  }

  // ── Verify the listing exists and belongs to this user ──
  const { data: listing, error: le } = await supabaseAdmin
    .from("listings")
    .select("id, user_id, title")
    .eq("id", listing_id)
    .single();

  if (le || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.user_id !== user.id) {
    return NextResponse.json(
      { error: "You can only apply promo codes to your own listings" },
      { status: 403 }
    );
  }

  const now = new Date();

  // ══════════════════════════════════════════
  // FREE BOOST — activate immediately
  // ══════════════════════════════════════════
  if (promo.discount_type === "free_boost") {
    const tier = promo.boost_tier || "spark";
    const days = promo.duration_days || 7;
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Activate boost on the listing
    const { error: ue } = await supabaseAdmin
      .from("listings")
      .update({
        is_boosted: true,
        boosted_at: now.toISOString(),
        boost_tier: tier,
        boost_started_at: now.toISOString(),
        boost_expires_at: expiresAt.toISOString(),
      })
      .eq("id", listing_id);

    if (ue)
      return NextResponse.json({ error: ue.message }, { status: 500 });

    // Record the redemption
    await supabaseAdmin.from("promo_redemptions").insert({
      promo_code_id: promo.id,
      user_id: user.id,
      listing_id,
      boost_tier: tier,
      duration_days: days,
      original_price_cents: 0,
      discount_cents: 0,
      final_price_cents: 0,
    });

    // Increment uses_count
    await supabaseAdmin
      .from("promo_codes")
      .update({ uses_count: promo.uses_count + 1 })
      .eq("id", promo.id);

    const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
    return NextResponse.json({
      success: true,
      type: "free_boost",
      message: `${tierName} boost activated for ${days} day${days !== 1 ? "s" : ""}!`,
    });
  }

  // ══════════════════════════════════════════
  // PERCENTAGE / FIXED — record for checkout
  // ══════════════════════════════════════════
  if (
    promo.discount_type === "percentage" ||
    promo.discount_type === "fixed"
  ) {
    // Record the pending redemption — Stripe checkout can reference this later
    await supabaseAdmin.from("promo_redemptions").insert({
      promo_code_id: promo.id,
      user_id: user.id,
      listing_id,
      boost_tier: "pending",
      duration_days: promo.duration_days || 7,
      original_price_cents: 0,
      discount_cents: 0,
      final_price_cents: 0,
    });

    // Increment uses_count
    await supabaseAdmin
      .from("promo_codes")
      .update({ uses_count: promo.uses_count + 1 })
      .eq("id", promo.id);

    let benefit = "";
    if (promo.discount_type === "percentage") {
      benefit = `${promo.discount_value}% off your boost purchase`;
    } else {
      benefit = `$${promo.discount_value} off your boost purchase`;
    }

    return NextResponse.json({
      success: true,
      type: promo.discount_type,
      discount_value: promo.discount_value,
      message: `Promo applied! ${benefit}. Select a boost tier to continue.`,
    });
  }

  return NextResponse.json(
    { error: "Unknown discount type" },
    { status: 400 }
  );
}
