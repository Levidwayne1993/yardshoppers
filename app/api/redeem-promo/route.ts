import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { BOOST_TIERS } from "@/lib/boost-config";
import type { BoostTierKey } from "@/lib/boost-config";

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll() } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { code, listing_id, boost_tier } = await req.json();
  if (!code || !listing_id || !boost_tier) return NextResponse.json({ error: "code, listing_id, and boost_tier required" }, { status: 400 });

  const tierKey = boost_tier as BoostTierKey;
  const tier = BOOST_TIERS[tierKey];
  if (!tier) return NextResponse.json({ error: "Invalid boost tier" }, { status: 400 });

  const { data: promo, error: pe } = await supabaseAdmin.from("promo_codes").select("*").eq("code", code.toUpperCase().trim()).eq("is_active", true).single();
  if (pe || !promo) return NextResponse.json({ error: "Invalid or inactive promo code" }, { status: 404 });

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return NextResponse.json({ error: "Promo code expired" }, { status: 400 });
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) return NextResponse.json({ error: "Usage limit reached" }, { status: 400 });
  if (promo.target_user_id && promo.target_user_id !== user.id) return NextResponse.json({ error: "Not valid for your account" }, { status: 403 });
  if (promo.target_listing_id && promo.target_listing_id !== listing_id) return NextResponse.json({ error: "Not valid for this listing" }, { status: 403 });
  if (promo.boost_tier && promo.boost_tier !== boost_tier) return NextResponse.json({ error: `Only valid for ${promo.boost_tier} tier` }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("promo_redemptions").select("id").eq("promo_code_id", promo.id).eq("user_id", user.id).eq("listing_id", listing_id).maybeSingle();
  if (existing) return NextResponse.json({ error: "Already used on this listing" }, { status: 400 });

  const originalPriceCents = Math.round(tier.price * 100);
  const durationDays = promo.duration_days || tier.durationDays;
  let discountCents = 0;

  if (promo.discount_type === "free_boost") discountCents = originalPriceCents;
  else if (promo.discount_type === "percentage") discountCents = Math.round(originalPriceCents * (Number(promo.discount_value) / 100));
  else if (promo.discount_type === "fixed") discountCents = Math.round(Number(promo.discount_value) * 100);

  const finalPriceCents = Math.max(0, originalPriceCents - discountCents);

  // FREE — activate boost immediately, skip Stripe
  if (finalPriceCents <= 0) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await supabaseAdmin.from("listings").update({
      is_boosted: true, boosted_at: now.toISOString(),
      boost_tier: promo.boost_tier || boost_tier,
      boost_started_at: now.toISOString(), boost_expires_at: expiresAt.toISOString(),
    }).eq("id", listing_id);

    await supabaseAdmin.from("promo_redemptions").insert({
      promo_code_id: promo.id, user_id: user.id, listing_id,
      boost_tier: promo.boost_tier || boost_tier, duration_days: durationDays,
      original_price_cents: originalPriceCents, discount_cents: discountCents, final_price_cents: 0,
    });

    await supabaseAdmin.from("promo_codes").update({ uses_count: promo.uses_count + 1 }).eq("id", promo.id);

    return NextResponse.json({ valid: true, free: true, activated: true, boost_tier: promo.boost_tier || boost_tier, duration_days: durationDays, message: "Boost activated for free!" });
  }

  // PARTIAL DISCOUNT — return discount info for Stripe checkout
  await supabaseAdmin.from("promo_codes").update({ uses_count: promo.uses_count + 1 }).eq("id", promo.id);

  return NextResponse.json({
    valid: true, free: false, discount_type: promo.discount_type,
    discount_value: Number(promo.discount_value), original_price_cents: originalPriceCents,
    discount_cents: discountCents, final_price_cents: finalPriceCents,
    final_price: (finalPriceCents / 100).toFixed(2), promo_code_id: promo.id,
    duration_days: durationDays, boost_tier: promo.boost_tier || boost_tier,
  });
}
