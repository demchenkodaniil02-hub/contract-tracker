import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createYandexDiskClient } from '@/lib/yandex-disk'
import { supabase as anonSupabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

function sanitizePathSegment(value: string | undefined) {
  return (value || '').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'unknown'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { docId, fileName, contractNumber } = body
    if (!docId) return NextResponse.json({ error: 'Missing doc id' }, { status: 400 })

    const yandex = createYandexDiskClient()
    if (!yandex) return NextResponse.json({ error: 'Yandex client not configured' }, { status: 500 })

    // Путь совпадает с тем что создаётся при загрузке в upload-doc
    const contractPart = sanitizePathSegment(contractNumber)
    const path = `/Контракты/${contractPart}/${contractPart}_${sanitizePathSegment(fileName)}`

    try {
      await yandex.deleteFile(path)
    } catch (e) {
      // ignore deletion errors but log
      console.warn('yandex delete error', e)
    }

    const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
      : anonSupabase

    const { error } = await supabaseAdmin.from('documents').delete().eq('id', docId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
