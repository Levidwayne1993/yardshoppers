import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use service role to bypass RLS
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
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const listingId = session.metadata?.listing_id;

    if (listingId) {
      // Read boost details from Stripe metadata (set during checkout)
      const durationDays = parseInt(
        session.metadata?.duration_days || "3",
        10
      );
      const boostTier = session.metadata?.boost_tier || "basic";

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { error } = await supabase
        .from("listings")
        .update({
          is_boosted: true,
          boosted_at: new Date().toISOString(),
          boost_tier: boostTier,
          boost_expires_at: expiresAt.toISOString(),
          boost_started_at: new Date().toISOString(),
        })
        .eq("id", listingId);

      if (error) {
        console.error("Failed to boost listing:", error);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }

      // Record the boost payment for admin analytics
      const amountCents = session.amount_total || 0;
      const userId = session.metadata?.user_id || null;

      const { error: paymentError } = await supabase
        .from("boost_payments")
        .insert({
          listing_id: listingId,
          user_id: userId,
          boost_tier: boostTier,
          amount_cents: amountCents,
          duration_days: durationDays,
          stripe_session_id: session.id,
        });

      if (paymentError) {
        console.error("Failed to record boost payment:", paymentError);
        // Non-fatal: the listing is already boosted, we just missed the analytics record
      }

      console.log(
        `Listing ${listingId} boosted: tier=${boostTier}, expires=${expiresAt.toISOString()}, payment recorded`
      );
    }
  }

  return NextResponse.json({ received: true });
}
