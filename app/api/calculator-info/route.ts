import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { CALCULATOR_DISK_URL } from '@/lib/utils'

const ADMIN_EMAIL = 'demchenkodaniil02@gmail.com'
const VERSION_KEY = 'calculator_version'
const URL_KEY = 'calculator_url'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Отметка версии калькулятора хранится в БД (app_settings), а не берётся из
// метаданных Яндекс.Диска — API Диска возвращает "ресурс не найден" для этой
// публичной ссылки даже с валидным токеном, так что это единственный надёжный путь:
// админ жмёт кнопку/вставляет новую ссылку после загрузки новой версии, все
// остальные видят это сразу.

export async function GET() {
  const { data } = await supabase.from('app_settings').select('key,value').in('key', [VERSION_KEY, URL_KEY])
  const version = data?.find(r => r.key === VERSION_KEY)?.value ?? null
  const url = data?.find(r => r.key === URL_KEY)?.value || CALCULATOR_DISK_URL
  return NextResponse.json({ version, url })
}

export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !userData.user || userData.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { url } = await req.json().catch(() => ({ url: undefined })) as { url?: string }
  const version = new Date().toISOString()

  const rows: { key: string; value: string; updatedAt: string }[] = [
    { key: VERSION_KEY, value: version, updatedAt: version },
  ]
  if (url && url.trim()) rows.push({ key: URL_KEY, value: url.trim(), updatedAt: version })

  const { error } = await supabase.from('app_settings').upsert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ version, url: url?.trim() || undefined })
}
