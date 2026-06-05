import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(req: Request) {
  try {
    const publicUrl = new URL(req.url).searchParams.get('url')
    if (!publicUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

    // Получаем прямую ссылку скачивания по публичному ключу (без токена)
    const dlRes = await fetch(
      `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`
    )
    if (!dlRes.ok) return new Response('Cannot get download URL', { status: 500 })
    const { href } = await dlRes.json()

    // Проксируем файл через наш сервер
    const fileRes = await fetch(href)
    if (!fileRes.ok) return new Response('File fetch failed', { status: 500 })

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream'
    const buffer = await fileRes.arrayBuffer()

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
}
