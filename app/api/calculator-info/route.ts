import { NextResponse } from 'next/server'
import { createYandexDiskClient } from '@/lib/yandex-disk'
import { CALCULATOR_DISK_URL } from '@/lib/utils'

export async function GET() {
  const client = createYandexDiskClient()
  if (!client) return NextResponse.json({ version: null })

  const info = await client.getPublicInfo(CALCULATOR_DISK_URL)
  if (!info) return NextResponse.json({ version: null })

  // md5 меняется только когда реально поменялось содержимое файла — надёжнее modified
  // (тот иногда обновляется и при чисто метаданных-операциях на Я.Диске)
  const version = info.md5 || info.modified || null
  return NextResponse.json({ version, modified: info.modified ?? null })
}
