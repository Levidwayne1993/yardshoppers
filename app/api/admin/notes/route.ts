import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ADMIN_EMAILS = ["erwin-levi@outlook.com", "gary.w.erwin@gmail.com"];

async function getAdminUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || ""))
    return null;
  return { user, supabase };
}

// GET — fetch all notes
export async function GET() {
  const auth = await getAdminUser();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await auth.supabase
    .from("admin_notes")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notes: data });
}

// POST — create a new note
export async function POST(req: NextRequest) {
  const auth = await getAdminUser();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, category } = await req.json();

  if (!content?.trim())
    return NextResponse.json({ error: "Content is required" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("admin_notes")
    .insert({
      author_email: auth.user.email!,
      content: content.trim(),
      category: category || "general",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ note: data });
}

// PUT — update a note (edit content, toggle pin)
export async function PUT(req: NextRequest) {
  const auth = await getAdminUser();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, content, category, is_pinned } = await req.json();

  if (!id)
    return NextResponse.json({ error: "Note ID is required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (content !== undefined) updates.content = content.trim();
  if (category !== undefined) updates.category = category;
  if (is_pinned !== undefined) updates.is_pinned = is_pinned;

  const { data, error } = await auth.supabase
    .from("admin_notes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ note: data });
}

// DELETE — delete a note
export async function DELETE(req: NextRequest) {
  const auth = await getAdminUser();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  if (!id)
    return NextResponse.json({ error: "Note ID is required" }, { status: 400 });

  const { error } = await auth.supabase
    .from("admin_notes")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
