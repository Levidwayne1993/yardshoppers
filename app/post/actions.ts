"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = "erwin-levi@outlook.com";

export async function createListing(formData: FormData) {
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
    redirect("/login");
  }

  const title = formData.get("title") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;

  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      title,
      city,
      state,
      description,
      date,
      time,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    throw new Error("Failed to create listing");
  }

  redirect(`/listing/${data.id}`);
}

export async function deleteListing(listingId: string) {
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
    throw new Error("Not authenticated");
  }

  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;

  // Verify ownership unless admin
  if (!isAdmin) {
    const { data: listing } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", listingId)
      .single();

    if (!listing || listing.user_id !== user.id) {
      throw new Error("You can only delete your own listings");
    }
  }

  // Admin uses service role key to bypass RLS for deleting anyone's listing
  const deleteClient = isAdmin
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    : supabase;

  // Delete photos first, then the listing
  await deleteClient
    .from("listing_photos")
    .delete()
    .eq("listing_id", listingId);

  const { error } = await deleteClient
    .from("listings")
    .delete()
    .eq("id", listingId);

  if (error) {
    console.error("Delete error:", error);
    throw new Error("Failed to delete listing");
  }

  return { success: true };
}
