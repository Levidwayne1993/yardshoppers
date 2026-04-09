import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
          const { listing_id, listing_title } = await req.json();

      if (!listing_id) {
              return NextResponse.json(
                { error: "Missing listing_id" },
                { status: 400 }
                      );
      }

      const siteUrl =
              process.env.NEXT_PUBLIC_SITE_URL || "https://www.yardshoppers.com";

      const session = await stripe.checkout.sessions.create({
              payment_method_types: ["card"],
              line_items: [
                {
                            price_data: {
                                          currency: "usd",
                                          product_data: {
                                                          name: `Boost: ${listing_title || "Your Listing"}`,
                                                          description:
                                                                            "Boosted listings appear at the top of browse results for maximum visibility.",
                                          },
                                          unit_amount: 299, // $2.99
                            },
                            quantity: 1,
                },
                      ],
              mode: "payment",
              success_url: `${siteUrl}/boost-success?listing_id=${listing_id}`,
              cancel_url: `${siteUrl}/dashboard`,
              metadata: { listing_id },
      });

      return NextResponse.json({ url: session.url });
    } catch (err: any) {
          console.error("Checkout error:", err);
          return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
