import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { listing_id, boost_tier, duration_days } = session.metadata!;

    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + parseInt(duration_days));

    const { error } = await supabase
      .from("listings")
      .update({
        boost_tier,
        boost_started_at: now.toISOString(),
        boost_expires_at: expires.toISOString(),
      })
      .eq("id", listing_id);

    if (error) {
      console.error("Failed to activate boost:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log(`Boost activated: ${boost_tier} on listing ${listing_id} until ${expires.toISOString()}`);
  }

  return NextResponse.json({ received: true });
}
