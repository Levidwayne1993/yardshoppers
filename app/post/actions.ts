"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Extract form fields
  const title = formData.get("title") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;

  // Insert into Supabase
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

  // Redirect to the new listing page
  redirect(`/listing/${data.id}`);
}
