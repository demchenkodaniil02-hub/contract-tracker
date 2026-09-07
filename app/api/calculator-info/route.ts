import { NextResponse } from 'next/server'
import { createYandexDiskClient } from '@/lib/yandex-disk'
import { CALCULATOR_DISK_URL } from '@/lib/utils'

export async function GET(req: Request) {
  const debug = new URL(req.url).searchParams.get('debug') === '1'

  const client = createYandexDiskClient()
  if (!client) return NextResponse.json({ version: null, ...(debug ? { debug: 'no token' } : {}) })

  if (debug) {
    try {
      const res = await fetch(
        `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(CALCULATOR_DISK_URL)}`,
        { headers: { Authorization: `OAuth ${process.env.YANDEX_DISK_TOKEN}` } }
      )
      const body = await res.text()
      return NextResponse.json({ version: null, debug: { status: res.status, body: body.slice(0, 500) } })
    } catch (err) {
      return NextResponse.json({ version: null, debug: { error: String(err) } })
    }
  }

  const info = await client.getPublicInfo(CALCULATOR_DISK_URL)
  if (!info) return NextResponse.json({ version: null })

  // md5 меняется только когда реально поменялось содержимое файла — надёжнее modified
  // (тот иногда обновляется и при чисто метаданных-операциях на Я.Диске)
  const version = info.md5 || info.modified || null
  return NextResponse.json({ version, modified: info.modified ?? null })
}
