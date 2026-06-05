import { NextResponse } from 'next/server'

const YANDEX_TOKEN = process.env.YANDEX_DISK_TOKEN
const YANDEX_DISK_API = 'https://cloud-api.yandex.net/v1/disk'

export const maxDuration = 30

export async function GET(req: Request) {
  try {
    const path = new URL(req.url).searchParams.get('path')
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })
    if (!YANDEX_TOKEN) return NextResponse.json({ error: 'No token' }, { status: 500 })

    // Получаем прямую ссылку на скачивание с Яндекс.Диска
    const dlRes = await fetch(
      `${YANDEX_DISK_API}/resources/download?path=${encodeURIComponent(path)}`,
      { headers: { Authorization: `OAuth ${YANDEX_TOKEN}` } }
    )
    if (!dlRes.ok) return NextResponse.json({ error: 'Cannot get download URL' }, { status: 500 })
    const { href } = await dlRes.json()

    // Проксируем файл через наш сервер
    const fileRes = await fetch(href)
    if (!fileRes.ok) return NextResponse.json({ error: 'File fetch failed' }, { status: 500 })

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream'

    return new Response(fileRes.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
