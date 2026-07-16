'use client'
import { create } from 'zustand'
import { Contract, Counterparty, WorkObject, WorkStage, Comment, Document, ContractHistory, Task, Payment, KsForm } from './types'
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
  ksForms: KsForm[]
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

  // KS form actions
  addKsForm: (f: KsForm) => Promise<void>
  deleteKsForm: (id: string) => Promise<void>

  // History actions
  addHistory: (h: ContractHistory) => Promise<void>
  logChange: (contractId: string, action: string) => Promise<void>
  logDeletion: (table: string, contractId: string, label: string, data: unknown) => Promise<void>
  restoreEntity: (historyId: string) => Promise<void>

  // Seed
  initSeed: () => Promise<void>
}

export const useStore = create<AppState>()((set, get) => ({
  contracts: [],
  objects: [],
  stages: [],
  counterparties: [],
  ksForms: [],
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
        ksForms: data.ksForms ?? [],
        history: data.history ?? [],
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
  logChange: async (contractId, action) => {
    try {
      const author = await getAuthorName()
      await get().addHistory({ id: Math.random().toString(36).slice(2), contractId, action, author, createdAt: new Date().toISOString() })
    } catch (err) {
      console.error('history log failed', err)
    }
  },
  // Сохраняем снимок удалённой записи прямо в истории — так её можно вернуть без отдельной "корзины"/схемы БД
  logDeletion: async (table, contractId, label, data) => {
    try {
      const author = await getAuthorName()
      await get().addHistory({
        id: Math.random().toString(36).slice(2),
        contractId,
        action: label,
        field: '__restore__',
        oldValue: JSON.stringify({ table, data }),
        author,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('history log failed', err)
    }
  },
  restoreEntity: async (historyId) => {
    const entry = get().history.find(h => h.id === historyId)
    if (!entry || entry.field !== '__restore__' || !entry.oldValue) throw new Error('Нечего восстанавливать')
    const { table, data } = JSON.parse(entry.oldValue) as { table: string; data: any }

    if (table === 'ks_forms') {
      await mutate('ks_forms', 'insert', {
        id: data.id, contract_id: data.contractId, number: data.number,
        date: data.date, amount: data.amount, notes: data.notes, created_at: data.createdAt,
      })
      set((s) => ({ ksForms: [data, ...s.ksForms] }))
    } else if (table === 'payments') {
      await mutate('payments', 'insert', data)
      set((s) => ({ payments: [data, ...s.payments] }))
      const contract = get().contracts.find(c => c.id === data.contractId)
      if (contract) {
        const newPaid = Number((contract.amountPaid + data.amount).toFixed(2))
        const newStatus = newPaid <= 0 ? 'not_paid' : newPaid >= contract.amount ? 'paid' : 'partial'
        set((s) => ({ contracts: s.contracts.map(c => c.id === contract.id ? { ...c, amountPaid: newPaid, paymentStatus: newStatus } : c) }))
        await mutate('contracts', 'update', { amountPaid: newPaid, paymentStatus: newStatus }, contract.id)
      }
    } else {
      await mutate(table, 'insert', data)
      if (table === 'contracts') set((s) => ({ contracts: [...s.contracts, data as Contract] }))
      else if (table === 'objects') set((s) => ({ objects: [...s.objects, data as WorkObject] }))
      else if (table === 'counterparties') set((s) => ({ counterparties: [...s.counterparties, data as Counterparty] }))
      else if (table === 'stages') set((s) => ({ stages: [...s.stages, data as WorkStage] }))
    }

    await get().logChange(entry.contractId, `Восстановлено: ${entry.action}`)
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
    const contract = get().contracts.find(c => c.id === id)
    set((s) => ({ contracts: s.contracts.filter((x) => x.id !== id) }))
    await mutate('contracts', 'delete', undefined, id)
    if (contract) await get().logDeletion('contracts', id, `Удалён контракт ${contract.number}`.trim(), contract)
  },

  // Objects
  addObject: async (o) => {
    await mutate('objects', 'insert', o)
    set((s) => ({ objects: [...s.objects, o] }))
    await get().logChange('', `Добавлен объект: ${o.name}`)
  },
  updateObject: async (o) => {
    set((s) => ({ objects: s.objects.map((x) => (x.id === o.id ? o : x)) }))
    await mutate('objects', 'update', o, o.id)
  },
  deleteObject: async (id) => {
    const obj = get().objects.find(x => x.id === id)
    set((s) => ({ objects: s.objects.filter((x) => x.id !== id) }))
    await mutate('objects', 'delete', undefined, id)
    if (obj) await get().logDeletion('objects', '', `Удалён объект: ${obj.name}`, obj)
  },

  // Stages
  addStage: async (stage) => {
    await mutate('stages', 'insert', stage)
    set((s) => ({ stages: [...s.stages, stage] }))
    await get().logChange(stage.contractId, `Добавлен этап: ${stage.title}`)
  },
  updateStage: async (stage) => {
    const old = get().stages.find(x => x.id === stage.id)
    set((s) => ({ stages: s.stages.map((x) => (x.id === stage.id ? stage : x)) }))
    await mutate('stages', 'update', stage, stage.id)
    if (old) {
      const changes: string[] = []
      if (old.title !== stage.title) changes.push(`название «${old.title}» → «${stage.title}»`)
      if (old.amount !== stage.amount) changes.push(`сумма ${old.amount.toLocaleString('ru-RU')} → ${stage.amount.toLocaleString('ru-RU')} ₽`)
      if (old.status !== stage.status) changes.push(`статус ${old.status} → ${stage.status}`)
      if (old.progressPercent !== stage.progressPercent) changes.push(`прогресс ${old.progressPercent}% → ${stage.progressPercent}%`)
      if (changes.length) await get().logChange(stage.contractId, `Изменён этап «${stage.title}»: ${changes.join(', ')}`)
    }
  },
  deleteStage: async (id) => {
    const stage = get().stages.find(x => x.id === id)
    set((s) => ({ stages: s.stages.filter((x) => x.id !== id) }))
    await mutate('stages', 'delete', undefined, id)
    if (stage) await get().logDeletion('stages', stage.contractId, `Удалён этап: ${stage.title}`, stage)
  },

  // Counterparties
  addCounterparty: async (cp) => {
    await mutate('counterparties', 'insert', cp)
    set((s) => ({ counterparties: [...s.counterparties, cp] }))
    await get().logChange('', `Добавлен контрагент: ${cp.name}`)
  },
  updateCounterparty: async (cp) => {
    set((s) => ({ counterparties: s.counterparties.map((x) => (x.id === cp.id ? cp : x)) }))
    await mutate('counterparties', 'update', cp, cp.id)
  },
  deleteCounterparty: async (id) => {
    const cp = get().counterparties.find(x => x.id === id)
    set((s) => ({ counterparties: s.counterparties.filter((x) => x.id !== id) }))
    await mutate('counterparties', 'delete', undefined, id)
    if (cp) await get().logDeletion('counterparties', '', `Удалён контрагент: ${cp.name}`, cp)
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
    await get().logChange(d.contractId, `Загружен документ: ${d.fileName}`)
  },
  deleteDocument: async (id) => {
    const doc = get().documents.find(d => d.id === id)
    set((s) => ({ documents: s.documents.filter((x) => x.id !== id) }))
    if (doc) await get().logChange(doc.contractId, `Удалён документ: ${doc.fileName}`)
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
    await get().logChange(p.contractId, `Добавлен платёж: ${p.amount.toLocaleString('ru-RU')} ₽`)
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
    await get().logDeletion('payments', contractId, `Удалён платёж: ${payment.amount.toLocaleString('ru-RU')} ₽`, payment)
  },

  addKsForm: async (f) => {
    set((s) => ({ ksForms: [f, ...s.ksForms] }))
    await mutate('ks_forms', 'insert', {
      id: f.id,
      contract_id: f.contractId,
      number: f.number,
      date: f.date,
      amount: f.amount,
      notes: f.notes,
      created_at: f.createdAt,
    })
    await get().logChange(f.contractId, `Добавлена КС №${f.number}`)
  },
  deleteKsForm: async (id) => {
    const form = get().ksForms.find(f => f.id === id)
    set((s) => ({ ksForms: s.ksForms.filter(f => f.id !== id) }))
    await mutate('ks_forms', 'delete', undefined, id)
    if (form) await get().logDeletion('ks_forms', form.contractId, `Удалена КС №${form.number}`, form)
  },

  initSeed: async () => {
    if (get().loading) return
    await get().loadAll()
  },
}))
