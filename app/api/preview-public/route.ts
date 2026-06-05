import { NextResponse } from 'next/server'

export const maxDuration = 15

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

    // Стримим файл через наш сервер, заменяя Content-Disposition на inline
    const fileRes = await fetch(href)
    if (!fileRes.ok) return new Response('File fetch failed', { status: 500 })

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream'

    return new Response(fileRes.body, {
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
