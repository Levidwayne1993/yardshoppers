import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { BOOST_TIERS, type BoostTierKey } from "@/lib/boost-config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { listing_id, listing_title, boost_tier } = await req.json();

    const tier = BOOST_TIERS[boost_tier as BoostTierKey];
    if (!tier) {
      return NextResponse.json({ error: "Invalid boost tier" }, { status: 400 });
    }

    const checkout = await stripe.checkout.sessions.create({
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
        user_id: session.user.id,
        duration_days: tier.durationDays.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/listing/${listing_id}?boosted=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/listing/${listing_id}`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
