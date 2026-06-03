import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { table, action, data, id } = await req.json()

    if (!table || !action) {
      return NextResponse.json({ error: 'Missing table or action' }, { status: 400 })
    }

    let result
    if (action === 'insert') {
      result = await supabase.from(table).insert(data)
    } else if (action === 'update') {
      result = await supabase.from(table).update(data).eq('id', id)
    } else if (action === 'delete') {
      result = await supabase.from(table).delete().eq('id', id)
    } else if (action === 'upsert') {
      result = await supabase.from(table).upsert(data)
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
