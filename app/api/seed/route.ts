import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const body = await req.json()
    if (body.secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    const { data: { users } } = await sb.auth.admin.listUsers()
    const admin = users?.find((u: any) => u.email === 'erwin-levi@outlook.com')
    if (!admin) return NextResponse.json({ error: 'No admin' }, { status: 404 })
    const rows = body.listings.map((l: any) => ({ ...l, user_id: admin.id }))
    const { error } = await sb.from('listings').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, count: rows.length })
}
