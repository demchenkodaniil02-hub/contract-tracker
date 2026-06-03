'use client'
import { create } from 'zustand'
import { Contract, Counterparty, WorkObject, WorkStage, Comment, Document, ContractHistory, Task, Payment } from './types'
import { supabase } from './supabase'

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
      const res = await fetch('/api/load-all')
      if (!res.ok) throw new Error('load-all failed: ' + res.status)
      const data = await res.json()
      set({
        contracts: data.contracts ?? [],
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
    await supabase.from('contract_history').insert(h)
    set((s) => ({ history: [h, ...s.history] }))
  },
  loadHistory: async (contractId) => {
    const { data } = await supabase.from('contract_history').select('*').eq('contractId', contractId).order('createdAt', { ascending: false })
    set({ history: data ?? [] })
  },

  // Contracts
  addContract: async (c) => {
    await supabase.from('contracts').insert(c)
    set((s) => ({ contracts: [...s.contracts, c] }))
    const { data: sess } = await supabase.auth.getSession()
    const user = sess.session?.user
    const { data: prof } = user ? await supabase.from('profiles').select('name,email').eq('id', user.id).single() : { data: null }
    const author = prof?.name || prof?.email || user?.email || 'Система'
    await supabase.from('contract_history').insert({ id: Math.random().toString(36).slice(2), contractId: c.id, action: 'Создан контракт', author, createdAt: new Date().toISOString() })
  },
  updateContract: async (c) => {
    const old = get().contracts.find(x => x.id === c.id)
    await supabase.from('contracts').update(c).eq('id', c.id)
    set((s) => ({ contracts: s.contracts.map((x) => (x.id === c.id ? c : x)) }))
    const { data: sess } = await supabase.auth.getSession()
    const user = sess.session?.user
    const { data: prof } = user ? await supabase.from('profiles').select('name,email').eq('id', user.id).single() : { data: null }
    const author = prof?.name || prof?.email || user?.email || 'Система'
    if (old) {
      const changes: { field: string; oldValue: string; newValue: string }[] = []
      if (old.status !== c.status) changes.push({ field: 'Статус', oldValue: old.status, newValue: c.status })
      if (old.amount !== c.amount) changes.push({ field: 'Сумма', oldValue: String(old.amount), newValue: String(c.amount) })
      if (old.amountPaid !== c.amountPaid) changes.push({ field: 'Оплачено', oldValue: String(old.amountPaid), newValue: String(c.amountPaid) })
      if (old.endDate !== c.endDate) changes.push({ field: 'Дата окончания', oldValue: old.endDate, newValue: c.endDate })
      if (old.paymentStatus !== c.paymentStatus) changes.push({ field: 'Статус оплаты', oldValue: old.paymentStatus, newValue: c.paymentStatus })
      for (const ch of changes) {
        await supabase.from('contract_history').insert({ id: Math.random().toString(36).slice(2), contractId: c.id, action: 'Изменено поле', ...ch, author, createdAt: new Date().toISOString() })
      }
      if (changes.length === 0) {
        await supabase.from('contract_history').insert({ id: Math.random().toString(36).slice(2), contractId: c.id, action: 'Обновлён контракт', author, createdAt: new Date().toISOString() })
      }
    }
  },
  deleteContract: async (id) => {
    await supabase.from('contracts').delete().eq('id', id)
    set((s) => ({ contracts: s.contracts.filter((x) => x.id !== id) }))
  },

  // Objects
  addObject: async (o) => {
    await supabase.from('objects').insert(o)
    set((s) => ({ objects: [...s.objects, o] }))
  },
  updateObject: async (o) => {
    await supabase.from('objects').update(o).eq('id', o.id)
    set((s) => ({ objects: s.objects.map((x) => (x.id === o.id ? o : x)) }))
  },
  deleteObject: async (id) => {
    await supabase.from('objects').delete().eq('id', id)
    set((s) => ({ objects: s.objects.filter((x) => x.id !== id) }))
  },

  // Stages
  addStage: async (stage) => {
    await supabase.from('stages').insert(stage)
    set((s) => ({ stages: [...s.stages, stage] }))
  },
  updateStage: async (stage) => {
    await supabase.from('stages').update(stage).eq('id', stage.id)
    set((s) => ({ stages: s.stages.map((x) => (x.id === stage.id ? stage : x)) }))
  },
  deleteStage: async (id) => {
    await supabase.from('stages').delete().eq('id', id)
    set((s) => ({ stages: s.stages.filter((x) => x.id !== id) }))
  },

  // Counterparties
  addCounterparty: async (cp) => {
    await supabase.from('counterparties').insert(cp)
    set((s) => ({ counterparties: [...s.counterparties, cp] }))
  },
  updateCounterparty: async (cp) => {
    await supabase.from('counterparties').update(cp).eq('id', cp.id)
    set((s) => ({ counterparties: s.counterparties.map((x) => (x.id === cp.id ? cp : x)) }))
  },
  deleteCounterparty: async (id) => {
    await supabase.from('counterparties').delete().eq('id', id)
    set((s) => ({ counterparties: s.counterparties.filter((x) => x.id !== id) }))
  },

  // Comments
  addComment: async (c) => {
    await supabase.from('comments').insert(c)
    set((s) => ({ comments: [c, ...s.comments] }))
  },
  deleteComment: async (id) => {
    await supabase.from('comments').delete().eq('id', id)
    set((s) => ({ comments: s.comments.filter((x) => x.id !== id) }))
  },

  // Documents
  addDocument: async (d) => {
    await supabase.from('documents').insert(d)
    set((s) => ({ documents: [d, ...s.documents] }))
  },
  deleteDocument: async (id) => {
    await supabase.from('documents').delete().eq('id', id)
    set((s) => ({ documents: s.documents.filter((x) => x.id !== id) }))
  },
  syncDocuments: async () => {
    try {
      await fetch('/api/sync-docs')
    } catch (err) {
      console.warn('sync-docs failed', err)
    }
    const { data } = await supabase.from('documents').select('*').order('uploadedAt', { ascending: false })
    set({ documents: data ?? [] })
  },

  // Tasks
  addTask: async (t) => {
    await supabase.from('tasks').insert(t)
    set((s) => ({ tasks: [t, ...s.tasks] }))
  },
  updateTask: async (t) => {
    await supabase.from('tasks').update(t).eq('id', t.id)
    set((s) => ({ tasks: s.tasks.map((x) => (x.id === t.id ? t : x)) }))
  },
  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) }))
  },

  addPayment: async (p) => {
    await supabase.from('payments').insert(p)
    // Обновляем amountPaid контракта
    const contract = get().contracts.find(c => c.id === p.contractId)
    if (contract) {
      const newPaid = Number((contract.amountPaid + p.amount).toFixed(2))
      await supabase.from('contracts').update({ amountPaid: newPaid }).eq('id', p.contractId)
      set((s) => ({
        payments: [p, ...s.payments],
        contracts: s.contracts.map(c => c.id === p.contractId ? { ...c, amountPaid: newPaid } : c),
      }))
    }
  },
  deletePayment: async (id, contractId) => {
    const payment = get().payments.find(p => p.id === id)
    if (!payment) return
    await supabase.from('payments').delete().eq('id', id)
    const contract = get().contracts.find(c => c.id === contractId)
    if (contract) {
      const newPaid = Number(Math.max(0, contract.amountPaid - payment.amount).toFixed(2))
      await supabase.from('contracts').update({ amountPaid: newPaid }).eq('id', contractId)
      set((s) => ({
        payments: s.payments.filter(p => p.id !== id),
        contracts: s.contracts.map(c => c.id === contractId ? { ...c, amountPaid: newPaid } : c),
      }))
    }
  },

  initSeed: async () => {
    if (get().loading) return
    await get().loadAll()
  },
}))
