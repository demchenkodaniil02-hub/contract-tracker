'use client'
import { create } from 'zustand'
import { Contract, Counterparty, WorkObject, WorkStage, Comment, Document, ContractHistory, Task, Payment } from './types'
import { supabase } from './supabase'

// Все записи идут через сервер (обходит блокировку Supabase у пользователей)
async function mutate(table: string, action: 'insert' | 'update' | 'delete' | 'upsert', data?: unknown, id?: string) {
  const res = await fetch('/api/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, action, data, id }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'mutate failed')
  return json
}

async function getAuthorName(): Promise<string> {
  try {
    const { data: sess } = await supabase.auth.getSession()
    const user = sess.session?.user
    if (!user) return 'Система'
    const { data: profile } = await supabase.from('profiles').select('name,email').eq('id', user.id).single()
    return profile?.name || profile?.email || user.email || 'Система'
  } catch {
    return 'Система'
  }
}

interface AppState {
  contracts: Contract[]
  objects: WorkObject[]
  stages: WorkStage[]
  counterparties: Counterparty[]
  comments: Comment[]
  documents: Document[]
  history: ContractHistory[]
  tasks: Task[]
  payments: Payment[]
  loading: boolean
  seeded: boolean

  // Data loading
  loadAll: () => Promise<void>
  syncDocuments: () => Promise<void>

  // Contract actions
  addContract: (c: Contract) => Promise<void>
  updateContract: (c: Contract) => Promise<void>
  deleteContract: (id: string) => Promise<void>

  // Object actions
  addObject: (o: WorkObject) => Promise<void>
  updateObject: (o: WorkObject) => Promise<void>
  deleteObject: (id: string) => Promise<void>

  // Stage actions
  addStage: (s: WorkStage) => Promise<void>
  updateStage: (s: WorkStage) => Promise<void>
  deleteStage: (id: string) => Promise<void>

  // Counterparty actions
  addCounterparty: (cp: Counterparty) => Promise<void>
  updateCounterparty: (cp: Counterparty) => Promise<void>
  deleteCounterparty: (id: string) => Promise<void>

  // Comment actions
  addComment: (c: Comment) => Promise<void>
  deleteComment: (id: string) => Promise<void>

  // Document actions
  addDocument: (d: Document) => Promise<void>
  deleteDocument: (id: string) => Promise<void>

  // Task actions
  addTask: (t: Task) => Promise<void>
  updateTask: (t: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  // Payment actions
  addPayment: (p: Payment) => Promise<void>
  deletePayment: (id: string, contractId: string) => Promise<void>

  // History actions
  addHistory: (h: ContractHistory) => Promise<void>
  loadHistory: (contractId: string) => Promise<void>

  // Seed
  initSeed: () => Promise<void>
}

export const useStore = create<AppState>()((set, get) => ({
  contracts: [],
  objects: [],
  stages: [],
  counterparties: [],
  comments: [],
  documents: [],
  history: [],
  tasks: [],
  payments: [],
  loading: false,
  seeded: false,

  loadAll: async () => {
    set({ loading: true })
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15000)
      const res = await fetch('/api/load-all', { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) throw new Error('load-all failed: ' + res.status)
      const data = await res.json()
      const contracts = (data.contracts ?? []).map((c: any) => ({
        ...c,
        paymentStatus: c.amountPaid <= 0 ? 'not_paid' : c.amountPaid >= c.amount ? 'paid' : 'partial',
      }))
      set({
        contracts,
        objects: data.objects ?? [],
        counterparties: data.counterparties ?? [],
        stages: data.stages ?? [],
        comments: data.comments ?? [],
        documents: data.documents ?? [],
        tasks: data.tasks ?? [],
        payments: data.payments ?? [],
      })
    } catch (err) {
      console.error('loadAll failed', err)
    } finally {
      set({ loading: false })
    }
  },

  // History
  addHistory: async (h) => {
    await mutate('contract_history', 'insert', h)
    set((s) => ({ history: [h, ...s.history] }))
  },
  loadHistory: async (contractId) => {
    const res = await fetch(`/api/load-all`)
    const data = await res.json()
    const filtered = (data.history ?? []).filter((h: any) => h.contractId === contractId)
    set({ history: filtered })
  },

  // Contracts
  addContract: async (c) => {
    await mutate('contracts', 'insert', c)
    set((s) => ({ contracts: [...s.contracts, c] }))
    const author = await getAuthorName()
    await mutate('contract_history', 'insert', { id: Math.random().toString(36).slice(2), contractId: c.id, action: 'Создан контракт', author, createdAt: new Date().toISOString() })
  },
  updateContract: async (c) => {
    const old = get().contracts.find(x => x.id === c.id)
    set((s) => ({ contracts: s.contracts.map((x) => (x.id === c.id ? c : x)) }))
    await mutate('contracts', 'update', c, c.id)
    const author = await getAuthorName()
    if (old) {
      const changes: { field: string; oldValue: string; newValue: string }[] = []
      if (old.status !== c.status) changes.push({ field: 'Статус', oldValue: old.status, newValue: c.status })
      if (old.amount !== c.amount) changes.push({ field: 'Сумма', oldValue: String(old.amount), newValue: String(c.amount) })
      if (old.amountPaid !== c.amountPaid) changes.push({ field: 'Оплачено', oldValue: String(old.amountPaid), newValue: String(c.amountPaid) })
      if (old.endDate !== c.endDate) changes.push({ field: 'Дата окончания', oldValue: old.endDate, newValue: c.endDate })
      if (old.paymentStatus !== c.paymentStatus) changes.push({ field: 'Статус оплаты', oldValue: old.paymentStatus, newValue: c.paymentStatus })
      for (const ch of changes) {
        await mutate('contract_history', 'insert', { id: Math.random().toString(36).slice(2), contractId: c.id, action: 'Изменено поле', ...ch, author, createdAt: new Date().toISOString() })
      }
    }
  },
  deleteContract: async (id) => {
    set((s) => ({ contracts: s.contracts.filter((x) => x.id !== id) }))
    await mutate('contracts', 'delete', undefined, id)
  },

  // Objects
  addObject: async (o) => {
    await mutate('objects', 'insert', o)
    set((s) => ({ objects: [...s.objects, o] }))
  },
  updateObject: async (o) => {
    set((s) => ({ objects: s.objects.map((x) => (x.id === o.id ? o : x)) }))
    await mutate('objects', 'update', o, o.id)
  },
  deleteObject: async (id) => {
    set((s) => ({ objects: s.objects.filter((x) => x.id !== id) }))
    await mutate('objects', 'delete', undefined, id)
  },

  // Stages
  addStage: async (stage) => {
    await mutate('stages', 'insert', stage)
    set((s) => ({ stages: [...s.stages, stage] }))
  },
  updateStage: async (stage) => {
    set((s) => ({ stages: s.stages.map((x) => (x.id === stage.id ? stage : x)) }))
    await mutate('stages', 'update', stage, stage.id)
  },
  deleteStage: async (id) => {
    set((s) => ({ stages: s.stages.filter((x) => x.id !== id) }))
    await mutate('stages', 'delete', undefined, id)
  },

  // Counterparties
  addCounterparty: async (cp) => {
    await mutate('counterparties', 'insert', cp)
    set((s) => ({ counterparties: [...s.counterparties, cp] }))
  },
  updateCounterparty: async (cp) => {
    set((s) => ({ counterparties: s.counterparties.map((x) => (x.id === cp.id ? cp : x)) }))
    await mutate('counterparties', 'update', cp, cp.id)
  },
  deleteCounterparty: async (id) => {
    set((s) => ({ counterparties: s.counterparties.filter((x) => x.id !== id) }))
    await mutate('counterparties', 'delete', undefined, id)
  },

  // Comments
  addComment: async (c) => {
    await mutate('comments', 'insert', c)
    set((s) => ({ comments: [c, ...s.comments] }))
  },
  deleteComment: async (id) => {
    set((s) => ({ comments: s.comments.filter((x) => x.id !== id) }))
    await mutate('comments', 'delete', undefined, id)
  },

  // Documents
  addDocument: async (d) => {
    set((s) => ({ documents: [d, ...s.documents] }))
  },
  deleteDocument: async (id) => {
    set((s) => ({ documents: s.documents.filter((x) => x.id !== id) }))
  },
  syncDocuments: async () => {
    try { await fetch('/api/sync-docs') } catch {}
  },

  // Tasks
  addTask: async (t) => {
    await mutate('tasks', 'insert', t)
    set((s) => ({ tasks: [t, ...s.tasks] }))
  },
  updateTask: async (t) => {
    set((s) => ({ tasks: s.tasks.map((x) => (x.id === t.id ? t : x)) }))
    await mutate('tasks', 'update', t, t.id)
  },
  deleteTask: async (id) => {
    set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) }))
    await mutate('tasks', 'delete', undefined, id)
  },

  addPayment: async (p) => {
    const contract = get().contracts.find(c => c.id === p.contractId)
    if (!contract) return
    const newPaid = Number((contract.amountPaid + p.amount).toFixed(2))
    const newStatus = newPaid <= 0 ? 'not_paid' : newPaid >= contract.amount ? 'paid' : 'partial'
    set((s) => ({
      payments: [p, ...s.payments],
      contracts: s.contracts.map(c => c.id === p.contractId ? { ...c, amountPaid: newPaid, paymentStatus: newStatus } : c),
    }))
    await mutate('payments', 'insert', p)
    await mutate('contracts', 'update', { amountPaid: newPaid, paymentStatus: newStatus }, p.contractId)
  },
  deletePayment: async (id, contractId) => {
    const payment = get().payments.find(p => p.id === id)
    if (!payment) return
    const contract = get().contracts.find(c => c.id === contractId)
    if (!contract) return
    const newPaid = Number(Math.max(0, contract.amountPaid - payment.amount).toFixed(2))
    const newStatus = newPaid <= 0 ? 'not_paid' : newPaid >= contract.amount ? 'paid' : 'partial'
    set((s) => ({
      payments: s.payments.filter(p => p.id !== id),
      contracts: s.contracts.map(c => c.id === contractId ? { ...c, amountPaid: newPaid, paymentStatus: newStatus } : c),
    }))
    await mutate('payments', 'delete', undefined, id)
    await mutate('contracts', 'update', { amountPaid: newPaid, paymentStatus: newStatus }, contractId)
  },

  initSeed: async () => {
    if (get().loading) return
    await get().loadAll()
  },
}))
