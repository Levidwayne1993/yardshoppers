import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { BOOST_TIERS, type BoostTierKey } from "@/lib/boost-config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { listing_id, listing_title, boost_tier } = await req.json();

    const tier = BOOST_TIERS[boost_tier as BoostTierKey];
    if (!tier) {
      return NextResponse.json({ error: "Invalid boost tier" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(tier.price * 100),
            product_data: {
              name: `${tier.name} Boost — ${listing_title}`,
              description: `${tier.durationDays}-day boost: ${tier.tagline}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        listing_id,
        boost_tier,
        user_id: user.id,
        duration_days: tier.durationDays.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/listing/${listing_id}?boosted=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/listing/${listing_id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
