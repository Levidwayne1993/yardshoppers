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
  // Get the caller's token from the Authorization header
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  // Verify caller identity
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(token);

  if (authErr || !user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { listingId } = await req.json();
  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
  }

  // Get listing info
  const { data: listing, error: listErr } = await supabase
    .from("listings")
    .select("id, title, user_id, is_boosted")
    .eq("id", listingId)
    .single();

  if (listErr || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.is_boosted) {
    return NextResponse.json({ error: "Already boosted" }, { status: 400 });
  }

  // Boost the listing
  const { error: boostErr } = await supabase
    .from("listings")
    .update({ is_boosted: true })
    .eq("id", listingId);

  if (boostErr) {
    return NextResponse.json({ error: "Failed to boost" }, { status: 500 });
  }

  // Send notification message to the listing owner's inbox
  if (listing.user_id) {
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: listing.user_id,
      listing_id: listingId,
      content: `\u{1F389} Great news! Your listing "${listing.title}" has been given a FREE boost by YardShoppers! Your sale will now appear at the top of search results and on the homepage. Happy selling!`,
    });
  }

  return NextResponse.json({ success: true });
}
