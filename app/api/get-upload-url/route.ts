import { NextResponse } from 'next/server'

const YANDEX_TOKEN = process.env.YANDEX_DISK_TOKEN
const YANDEX_DISK_API = 'https://cloud-api.yandex.net/v1/disk'

async function ensureFolder(path: string) {
  await fetch(`${YANDEX_DISK_API}/resources?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
  })
}

async function getPublicUrl(path: string): Promise<string> {
  // Публикуем файл
  await fetch(`${YANDEX_DISK_API}/resources/publish?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
  })
  // Получаем meta
  const r = await fetch(`${YANDEX_DISK_API}/resources?path=${encodeURIComponent(path)}&fields=public_url`, {
    headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
  })
  const data = await r.json()
  return data.public_url ?? ''
}

export async function POST(req: Request) {
  try {
    if (!YANDEX_TOKEN) return NextResponse.json({ error: 'Yandex token not configured' }, { status: 500 })

    const { fileName, contractNumber, contractId } = await req.json()
    if (!fileName || !contractId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const safeName = fileName.replace(/[/\\?%*:|"<>]/g, '_')
    const safeNumber = (contractNumber || contractId).replace(/[/\\?%*:|"<>]/g, '_')
    const path = `/Контракты/${safeNumber}/${safeNumber}_${safeName}`

    // Создаём папки на сервере
    await ensureFolder('/Контракты')
    await ensureFolder(`/Контракты/${safeNumber}`)

    // Получаем upload URL от Яндекс.Диска
    const r = await fetch(
      `${YANDEX_DISK_API}/resources/upload?path=${encodeURIComponent(path)}&overwrite=true`,
      { headers: { Authorization: `OAuth ${YANDEX_TOKEN}` } }
    )
    if (!r.ok) {
      const err = await r.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }
    const { href: uploadUrl } = await r.json()

    return NextResponse.json({ uploadUrl, path })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
