import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createYandexDiskClient } from '@/lib/yandex-disk'
import { supabase as anonSupabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

function sanitizePathSegment(value: string | undefined) {
  return (value || '').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'unknown'
}

export async function GET() {
  try {
    const canDeleteWithServiceRole = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE)
    const supabaseAdmin = canDeleteWithServiceRole ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE!) : anonSupabase

    const [{ error: docsError, data: documents }, { error: contractsError, data: contracts }] = await Promise.all([
      supabaseAdmin.from('documents').select('*'),
      supabaseAdmin.from('contracts').select('id,number'),
    ])

    if (docsError) return NextResponse.json({ error: docsError.message }, { status: 500 })
    if (contractsError) return NextResponse.json({ error: contractsError.message }, { status: 500 })
    if (!documents) return NextResponse.json({ success: true, documents: [] })

    const yandex = createYandexDiskClient()
    if (!yandex) return NextResponse.json({ error: 'Yandex client not configured' }, { status: 500 })

    const contractNumberById = new Map(contracts?.map((c) => [c.id, sanitizePathSegment(c.number)]) ?? [])
    const docsByContract = new Map<string, typeof documents>()

    for (const doc of documents) {
      const list = docsByContract.get(doc.contractId) ?? []
      list.push(doc)
      docsByContract.set(doc.contractId, list)
    }

    const staleDocIds: string[] = []

    for (const [contractId, docs] of docsByContract.entries()) {
      const contractNumber = contractNumberById.get(contractId) || sanitizePathSegment(contractId)
      const folderPath = `/Контракты/${contractNumber}`

      const folderItems = await yandex.listFolder(folderPath)
      if (!folderItems) {
        staleDocIds.push(...docs.map((doc) => doc.id))
        continue
      }

      for (const doc of docs) {
        const matches = folderItems.some((itemName) =>
          itemName === doc.fileName ||
          itemName === `${contractNumber}_${doc.fileName}` ||
          itemName.endsWith(`_${doc.fileName}`)
        )
        if (!matches) staleDocIds.push(doc.id)
      }
    }

    let deletedLocally = false
    if (staleDocIds.length > 0) {
      const { error } = await supabaseAdmin.from('documents').delete().in('id', staleDocIds)
      if (error) {
        if (canDeleteWithServiceRole) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        console.warn('sync-docs: failed to delete stale docs with anonSupabase', error.message)
      } else {
        deletedLocally = true
      }
    }

    const { data: updatedDocs, error: updatedError } = await supabaseAdmin.from('documents').select('*').order('uploadedAt', { ascending: false })
    if (updatedError) return NextResponse.json({ error: updatedError.message }, { status: 500 })

    return NextResponse.json({ success: true, documents: updatedDocs ?? [], staleDocCount: staleDocIds.length, deletedLocally })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
