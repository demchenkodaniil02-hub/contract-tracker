import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST — обновить lastSeen для текущего пользователя (или сразу очистить при выходе)
export async function POST(req: Request) {
  try {
    const { userId, leaving } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    await supabase.from('profiles')
      .update({ lastSeen: leaving ? null : new Date().toISOString() })
      .eq('id', userId)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET — получить всех кто был активен последние 2 минуты
export async function GET() {
  try {
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, avatarColor')
      .gte('lastSeen', twoMinsAgo)

    return NextResponse.json({ users: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
