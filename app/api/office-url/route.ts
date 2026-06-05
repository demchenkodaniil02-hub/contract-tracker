import { NextResponse } from 'next/server'

const YANDEX_TOKEN = process.env.YANDEX_DISK_TOKEN
const YANDEX_DISK_API = 'https://cloud-api.yandex.net/v1/disk'

export const maxDuration = 10

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const publicUrl = searchParams.get('url')
    const filePath  = searchParams.get('path')

    let href: string

    if (filePath && YANDEX_TOKEN) {
      // Новый документ — по пути с токеном
      const dlRes = await fetch(
        `${YANDEX_DISK_API}/resources/download?path=${encodeURIComponent(filePath)}`,
        { headers: { Authorization: `OAuth ${YANDEX_TOKEN}` } }
      )
      if (!dlRes.ok) throw new Error('download url failed')
      href = (await dlRes.json()).href
    } else if (publicUrl) {
      // Старый документ — по публичному ключу без токена
      const dlRes = await fetch(
        `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`
      )
      if (!dlRes.ok) throw new Error('public download url failed')
      href = (await dlRes.json()).href
    } else {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    return NextResponse.json({ href })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
