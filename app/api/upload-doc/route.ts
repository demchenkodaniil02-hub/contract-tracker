import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createYandexDiskClient } from '@/lib/yandex-disk'
import { supabase as anonSupabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

function sanitizePathSegment(value: string | undefined) {
  return (value || '').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'unknown'
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const fileName = sanitizePathSegment(formData.get('fileName')?.toString() || (file instanceof File ? file.name : 'file'))
    const contentType = formData.get('fileType')?.toString() || (file instanceof File ? file.type : 'application/octet-stream') || 'application/octet-stream'
    const contractId = formData.get('contractId')?.toString()
    const contractNumber = sanitizePathSegment(formData.get('contractNumber')?.toString() || contractId)

    if (!contractId) return NextResponse.json({ error: 'Missing contract id' }, { status: 400 })

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file upload' }, { status: 400 })
    }

    // Skip production service role check — RLS is disabled, anon key is sufficient

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const yandex = createYandexDiskClient()
    if (!yandex) return NextResponse.json({ error: 'Yandex client not configured' }, { status: 500 })

    // Ensure folders
    await yandex.ensureFolder('/Контракты')
    await yandex.ensureFolder(`/Контракты/${contractNumber}`)

    const path = `/Контракты/${contractNumber}/${contractNumber}_${fileName}`
    console.log('[upload-doc]', JSON.stringify({ path, contractId, contractNumber, fileName }))
    const publicUrl = await yandex.uploadBuffer(buffer, path, contentType)

    // Insert into Supabase using service role or anon fallback
    const doc = {
      id: Math.random().toString(36).slice(2),
      contractId,
      fileName,
      fileType: contentType,
      fileSize: buffer.length,
      fileUrl: publicUrl,
      uploadedAt: new Date().toISOString(),
    }

    const supabaseClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
      : anonSupabase

    const { error } = await supabaseClient.from('documents').insert(doc)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, document: doc, uploadedPath: path })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
