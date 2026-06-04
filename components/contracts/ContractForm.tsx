'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Contract } from '@/lib/types'
import { newId } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { Portal } from '@/components/ui/Portal'
import { Plus, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Contract
}

const S = {
  input: { padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, background: '#fff', color: 'var(--ink)', width: '100%', boxSizing: 'border-box' } as React.CSSProperties,
  label: { fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 4 } as React.CSSProperties,
  field: { display: 'flex', flexDirection: 'column' } as React.CSSProperties,
}

function QuickCreate({ placeholder, onSave, onCancel }: { placeholder: string; onSave: (name: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState('')
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (val.trim()) onSave(val.trim()) } if (e.key === 'Escape') onCancel() }}
        placeholder={placeholder}
        style={{ ...S.input, flex: 1, borderColor: 'var(--maf)', outline: 'none', boxShadow: '0 0 0 2px rgba(47,107,220,.15)' }}
      />
      <button type="button" onClick={() => val.trim() && onSave(val.trim())} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--maf)', color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Создать</button>
      <button type="button" onClick={onCancel} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--faint)', flexShrink: 0 }}><X size={13} /></button>
    </div>
  )
}

export function ContractForm({ open, onClose, initial }: Props) {
  const { addContract, updateContract, addCounterparty, addObject, counterparties, objects } = useStore()
  const customers   = counterparties.filter((c) => c.type === 'customer')
  const contractors = counterparties.filter((c) => c.type === 'contractor')

  const [creating, setCreating] = useState<'object' | 'customer' | 'contractor' | null>(null)
  // Локальный список только что созданных объектов — доступны мгновенно до ре-рендера store
  const [freshObjects, setFreshObjects] = useState<{id: string, name: string}[]>([])
  const [freshCounterparties, setFreshCounterparties] = useState<{id: string, name: string, type: string}[]>([])

  const { register, handleSubmit, setValue, watch, reset } = useForm<Contract>({
    defaultValues: initial ?? {
      id: '', number: '', objectId: '', direction: 'maf',
      customerId: '', contractorId: '', amount: 0, amountPaid: 0,
      startDate: '', endDate: '', status: 'planning', paymentStatus: 'not_paid',
      notes: '', createdAt: new Date().toISOString().slice(0, 10),
    },
  })

  useEffect(() => {
    if (open) {
      reset(initial ?? {
        id: '', number: '', objectId: '', direction: 'maf',
        customerId: '', contractorId: '', amount: 0, amountPaid: 0,
        startDate: '', endDate: '', status: 'planning', paymentStatus: 'not_paid',
        notes: '', createdAt: new Date().toISOString().slice(0, 10),
      })
      setCreating(null)
      setFreshObjects([])
      setFreshCounterparties([])
    }
  }, [open, initial])

  const onSubmit = (data: Contract) => {
    if (initial) updateContract({ ...data, id: initial.id })
    else addContract({ ...data, id: newId() })
    reset(); onClose()
  }

  const handleCreateObject = async (name: string) => {
    const id = newId()
    const obj = { id, name, address: '', direction: watch('direction') || 'maf', customerId: '', status: 'active' as const, notes: '', createdAt: new Date().toISOString().slice(0, 10) }
    // Сначала добавляем в локальный список — option появляется в DOM до setValue
    setFreshObjects(prev => [...prev, { id, name }])
    setValue('objectId', id)
    setCreating(null)
    // Затем сохраняем на сервер в фоне
    try {
      await addObject(obj)
    } catch (e) {
      console.error('Ошибка создания объекта', e)
      setFreshObjects(prev => prev.filter(o => o.id !== id))
      setValue('objectId', '')
    }
  }

  const handleCreateCustomer = async (name: string) => {
    const existing = customers.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (existing) { setValue('customerId', existing.id); setCreating(null); return }
    const id = newId()
    setFreshCounterparties(prev => [...prev, { id, name, type: 'customer' }])
    setValue('customerId', id)
    setCreating(null)
    try {
      await addCounterparty({ id, name, company: '', phone: '', email: '', type: 'customer' })
    } catch (e) {
      console.error('Ошибка создания заказчика', e)
      setFreshCounterparties(prev => prev.filter(c => c.id !== id))
      setValue('customerId', '')
    }
  }

  const handleCreateContractor = async (name: string) => {
    const existing = contractors.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (existing) { setValue('contractorId', existing.id); setCreating(null); return }
    const id = newId()
    setFreshCounterparties(prev => [...prev, { id, name, type: 'contractor' }])
    setValue('contractorId', id)
    setCreating(null)
    try {
      await addCounterparty({ id, name, company: '', phone: '', email: '', type: 'contractor' })
    } catch (e) {
      console.error('Ошибка создания исполнителя', e)
      setFreshCounterparties(prev => prev.filter(c => c.id !== id))
      setValue('contractorId', '')
    }
  }

  const addBtn = (type: 'object' | 'customer' | 'contractor') => (
    <button type="button" onClick={() => setCreating(creating === type ? null : type)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--line)', background: 'none', color: 'var(--maf)', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
      <Plus size={11} /> Создать
    </button>
  )

  if (!open) return null

  return (
    <Portal>
    <div className="ct-modal-wrap" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,41,.42)', backdropFilter: 'blur(2px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="ct-modal" style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 580, boxShadow: '0 24px 70px -20px rgba(15,23,41,.5)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{initial ? 'Редактировать контракт' : 'Новый контракт'}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg)', color: 'var(--muted-ink)', cursor: 'pointer', fontSize: 18, display: 'grid', placeItems: 'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>

          {/* Номер + Направление */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={S.field}>
              <label style={S.label}>№ Контракта *</label>
              <input {...register('number', { required: true })} placeholder="МАФ-2024-001" style={S.input} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Направление *</label>
              <select style={S.input} value={watch('direction')} onChange={e => setValue('direction', e.target.value as 'maf' | 'finishing')}>
                <option value="maf">МАФ / Металлоконструкции</option>
                <option value="finishing">Отделочные работы</option>
              </select>
            </div>
          </div>

          {/* Объект */}
          <div style={S.field}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Объект</label>
              {addBtn('object')}
            </div>
            <select style={S.input} value={watch('objectId')} onChange={e => setValue('objectId', e.target.value)}>
              <option value="">Выберите объект</option>
              {freshObjects.filter(fo => !objects.find(o => o.id === fo.id)).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            {creating === 'object' && (
              <QuickCreate placeholder='Название объекта (напр. "Парк Победы")' onSave={handleCreateObject} onCancel={() => setCreating(null)} />
            )}
          </div>

          {/* Заказчик + Исполнитель */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={S.field}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ ...S.label, marginBottom: 0 }}>Заказчик *</label>
                {addBtn('customer')}
              </div>
              <select style={S.input} value={watch('customerId')} onChange={e => setValue('customerId', e.target.value)}>
                <option value="">Выберите заказчика</option>
                {freshCounterparties.filter(f => f.type === 'customer' && !customers.find(c => c.id === f.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
              </select>
              {creating === 'customer' && (
                <QuickCreate placeholder="Имя заказчика" onSave={handleCreateCustomer} onCancel={() => setCreating(null)} />
              )}
            </div>
            <div style={S.field}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ ...S.label, marginBottom: 0 }}>Исполнитель *</label>
                {addBtn('contractor')}
              </div>
              <select style={S.input} value={watch('contractorId')} onChange={e => setValue('contractorId', e.target.value)}>
                <option value="">Выберите исполнителя</option>
                {freshCounterparties.filter(f => f.type === 'contractor' && !contractors.find(c => c.id === f.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                {contractors.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
              </select>
              {creating === 'contractor' && (
                <QuickCreate placeholder="Имя исполнителя" onSave={handleCreateContractor} onCancel={() => setCreating(null)} />
              )}
            </div>
          </div>

          {/* Сумма + Оплачено */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={S.field}>
              <label style={S.label}>Сумма контракта (руб.) *</label>
              <input type="number" step="0.01" min="0" {...register('amount', { valueAsNumber: true })} style={S.input} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Оплачено (руб.)</label>
              <input type="number" step="0.01" min="0" {...register('amountPaid', { valueAsNumber: true })} style={S.input} />
            </div>
          </div>

          {/* Даты */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={S.field}>
              <label style={S.label}>Начало *</label>
              <input type="date" {...register('startDate', { required: true })} style={S.input} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Окончание *</label>
              <input type="date" {...register('endDate', { required: true })} style={S.input} />
            </div>
          </div>

          {/* Статус + Оплата */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={S.field}>
              <label style={S.label}>Статус</label>
              <select style={S.input} value={watch('status')} onChange={e => setValue('status', e.target.value as Contract['status'])}>
                <option value="planning">Планируется</option>
                <option value="active">Активный</option>
                <option value="paused">Приостановлен</option>
                <option value="completed">Завершён</option>
                <option value="cancelled">Отменён</option>
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Оплата</label>
              <select style={S.input} value={watch('paymentStatus')} onChange={e => setValue('paymentStatus', e.target.value as Contract['paymentStatus'])}>
                <option value="not_paid">Не оплачено</option>
                <option value="partial">Частично оплачено</option>
                <option value="paid">Оплачено</option>
              </select>
            </div>
          </div>

          {/* Примечания */}
          <div style={S.field}>
            <label style={S.label}>Примечания</label>
            <textarea {...register('notes')} rows={3} placeholder="Дополнительная информация..." style={{ ...S.input, resize: 'vertical' }} />
          </div>

        </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
            <button type="submit" style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #182033', background: '#182033', color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>{initial ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  )
}
