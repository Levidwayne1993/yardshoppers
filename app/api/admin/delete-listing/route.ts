import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase());

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

    if (!user || !adminEmails.includes(user.email?.toLowerCase() ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { listingId } = await req.json();
    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400 }
      );
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await adminClient
      .from("listing_photos")
      .delete()
      .eq("listing_id", listingId);
    await adminClient
      .from("reported_listings")
      .delete()
      .eq("listing_id", listingId);
    await adminClient
      .from("saved_listings")
      .delete()
      .eq("listing_id", listingId);

    const { error } = await adminClient
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      console.error("Admin delete error:", error.message);
      return NextResponse.json(
        { error: "Failed to delete listing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin delete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
