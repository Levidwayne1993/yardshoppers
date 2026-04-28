// ============================================================
// FILE: app/api/admin/edit-listing/route.ts
// PLACE AT: app/api/admin/edit-listing/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      listingId,
      isExternal,
      title,
      description,
      address,
      city,
      state,
      zip,
      category,
      start_date,
      end_date,
      is_boosted,
      is_shadowbanned,
      source,
      source_url,
      latitude,
      longitude,
    } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: "Missing listingId" },
        { status: 400 }
      );
    }

    if (isExternal) {
      // Update external_sales table
      const updatePayload: Record<string, unknown> = {};
      if (title !== undefined) updatePayload.title = title;
      if (description !== undefined) updatePayload.description = description;
      if (address !== undefined) updatePayload.address = address;
      if (city !== undefined) updatePayload.city = city;
      if (state !== undefined) updatePayload.state = state;
      if (zip !== undefined) updatePayload.zip = zip;
      if (category !== undefined) updatePayload.category = category;
      if (start_date !== undefined) updatePayload.start_date = start_date;
      if (end_date !== undefined) updatePayload.end_date = end_date;
      if (source !== undefined) updatePayload.source = source;
      if (source_url !== undefined) updatePayload.source_url = source_url;
      if (latitude !== undefined) updatePayload.latitude = latitude;
      if (longitude !== undefined) updatePayload.longitude = longitude;

      const { error } = await supabaseAdmin
        .from("external_sales")
        .update(updatePayload)
        .eq("id", listingId);

      if (error) {
        console.error("Edit external_sales error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    } else {
      // Update listings table
      const updatePayload: Record<string, unknown> = {};
      if (title !== undefined) updatePayload.title = title;
      if (description !== undefined) updatePayload.description = description;
      if (address !== undefined) updatePayload.address = address;
      if (city !== undefined) updatePayload.city = city;
      if (state !== undefined) updatePayload.state = state;
      if (zip !== undefined) updatePayload.zip_code = zip;
      if (category !== undefined) updatePayload.category = category;
      if (start_date !== undefined) updatePayload.start_date = start_date;
      if (end_date !== undefined) updatePayload.end_date = end_date;
      if (is_boosted !== undefined) updatePayload.is_boosted = is_boosted;
      if (is_shadowbanned !== undefined)
        updatePayload.is_shadowbanned = is_shadowbanned;

      const { error } = await supabaseAdmin
        .from("listings")
        .update(updatePayload)
        .eq("id", listingId);

      if (error) {
        console.error("Edit listing error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Edit listing route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
