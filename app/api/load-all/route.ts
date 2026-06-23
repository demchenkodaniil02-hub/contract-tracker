import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const [contracts, objects, counterparties, stages, comments, documents, tasks, payments, history, ksForms] = await Promise.all([
      supabase.from('contracts').select('*'),
      supabase.from('objects').select('*'),
      supabase.from('counterparties').select('*'),
      supabase.from('stages').select('*'),
      supabase.from('comments').select('*').order('createdAt', { ascending: false }),
      supabase.from('documents').select('*').order('uploadedAt', { ascending: false }),
      supabase.from('tasks').select('*'),
      supabase.from('payments').select('*').order('paidAt', { ascending: false }),
      supabase.from('contract_history').select('*').order('createdAt', { ascending: false }),
      supabase.from('ks_forms').select('*').order('date', { ascending: false }),
    ])
    return NextResponse.json({
      contracts: contracts.data ?? [],
      objects: objects.data ?? [],
      counterparties: counterparties.data ?? [],
      stages: stages.data ?? [],
      comments: comments.data ?? [],
      documents: documents.data ?? [],
      tasks: tasks.data ?? [],
      payments: payments.data ?? [],
      history: history.data ?? [],
      ksForms: (ksForms.data ?? []).map((f: any) => ({ ...f, contractId: f.contract_id, createdAt: f.created_at })),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
