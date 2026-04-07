import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ListingDetailClient from "./ListingDetailClient";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabase();

  const { data } = await supabase
    .from("listings")
    .select("title, description, city, state")
    .eq("id", id)
    .single();

  if (!data) return { title: "Listing Not Found — YardShoppers" };

  const location = [data.city, data.state].filter(Boolean).join(", ");

  return {
    title: `${data.title} — YardShoppers`,
    description:
      data.description ||
      `Check out this yard sale listing${location ? ` in ${location}` : ""} on YardShoppers.`,
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetailClient listingId={id} />;
}
