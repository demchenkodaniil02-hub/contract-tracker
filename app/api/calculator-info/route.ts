import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'demchenkodaniil02@gmail.com'
const KEY = 'calculator_version'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Отметка версии калькулятора хранится в БД (app_settings), а не берётся из
// метаданных Яндекс.Диска — API Диска возвращает "ресурс не найден" для этой
// публичной ссылки даже с валидным токеном, так что это единственный надёжный путь:
// админ жмёт кнопку после загрузки новой версии, все остальные видят это сразу.

export async function GET() {
  const { data } = await supabase.from('app_settings').select('value').eq('key', KEY).single()
  return NextResponse.json({ version: data?.value ?? null })
}

export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !userData.user || userData.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const version = new Date().toISOString()
  const { error } = await supabase.from('app_settings').upsert({ key: KEY, value: version, updatedAt: version })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ version })
}
