import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = ["erwin-levi@outlook.com", "gary.w.erwin@gmail.com"];

export async function POST(request: Request) {
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

    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mode, ids, state, city } = body;

    let query = supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id);

    switch (mode) {
      case "selected":
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json(
            { error: "No listing IDs provided" },
            { status: 400 }
          );
        }
        query = query.in("id", ids);
        break;

      case "state":
        if (!state) {
          return NextResponse.json(
            { error: "No state provided" },
            { status: 400 }
          );
        }
        query = query.ilike("state", state);
        break;

      case "city":
        if (!state || !city) {
          return NextResponse.json(
            { error: "State and city are required" },
            { status: 400 }
          );
        }
        query = query.ilike("state", state).ilike("city", city);
        break;

      case "expired":
        const today = new Date().toISOString().split("T")[0];
        query = query.lt("sale_date", today);
        break;

      case "all":
        break;

      default:
        return NextResponse.json(
          { error: "Invalid delete mode" },
          { status: 400 }
        );
    }

    const { data: toDelete, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!toDelete || toDelete.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: "No matching listings found",
      });
    }

    const deleteIds = toDelete.map((l) => l.id);

    // Delete in batches of 50 to avoid query size limits
    for (let i = 0; i < deleteIds.length; i += 50) {
      const batch = deleteIds.slice(i, i + 50);

      await supabase
        .from("listing_photos")
        .delete()
        .in("listing_id", batch);

      await supabase
        .from("saved_listings")
        .delete()
        .in("listing_id", batch);

      await supabase
        .from("reported_listings")
        .delete()
        .in("listing_id", batch);

      await supabase
        .from("listings")
        .delete()
        .in("id", batch);
    }

    return NextResponse.json({
      success: true,
      deleted: deleteIds.length,
      message: `Successfully deleted ${deleteIds.length} listing${deleteIds.length !== 1 ? "s" : ""}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
