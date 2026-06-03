import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const YANDEX_TOKEN = process.env.YANDEX_DISK_TOKEN
const YANDEX_DISK_API = 'https://cloud-api.yandex.net/v1/disk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { path, contractId, fileName, fileSize, fileType } = await req.json()
    if (!path || !contractId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Публикуем файл на Яндекс.Диске
    await fetch(`${YANDEX_DISK_API}/resources/publish?path=${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
    })

    // Получаем публичную ссылку
    const metaRes = await fetch(`${YANDEX_DISK_API}/resources?path=${encodeURIComponent(path)}&fields=public_url`, {
      headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
    })
    const meta = await metaRes.json()
    const publicUrl = meta.public_url ?? ''

    const doc = {
      id: Math.random().toString(36).slice(2),
      contractId,
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize: fileSize || 0,
      fileUrl: publicUrl,
      uploadedAt: new Date().toISOString(),
    }

    const { error } = await supabase.from('documents').insert(doc)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, document: doc })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
