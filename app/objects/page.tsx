'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { WorkObject, Direction } from '@/lib/types'
import { formatMoney, newId } from '@/lib/utils'
import { DirectionBadge } from '@/components/contracts/StatusBadge'
import { Plus, Pencil, Trash2, MapPin, Users, Search, Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { Portal } from '@/components/ui/Portal'

const S = {
  card: { background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)' } as React.CSSProperties,
  btn: (primary?: boolean, dark?: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 15px',
    borderRadius: 10, border: `1px solid ${dark ? '#182033' : 'var(--line)'}`,
    background: dark ? '#182033' : '#fff', color: dark ? '#fff' : 'var(--ink)',
    fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  }),
  input: { padding: '10px 13px', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'inherit', fontSize: 13.5, background: '#fff', color: 'var(--ink)', width: '100%', boxSizing: 'border-box' } as React.CSSProperties,
  label: { fontSize: 12.5, fontWeight: 600, color: 'var(--muted-ink)' } as React.CSSProperties,
}

function ObjectFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: WorkObject }) {
  const { addObject, updateObject, counterparties } = useStore()
  const customers = counterparties.filter((c) => c.type === 'customer')
  const { register, handleSubmit, setValue, watch, reset } = useForm<WorkObject>({
    defaultValues: initial ?? { id: '', name: '', address: '', direction: 'maf', customerId: '', status: 'active', notes: '', createdAt: new Date().toISOString().slice(0, 10) },
  })

  useEffect(() => {
    if (open) reset(initial ?? { id: '', name: '', address: '', direction: 'maf', customerId: '', status: 'active', notes: '', createdAt: new Date().toISOString().slice(0, 10) })
  }, [open, initial])

  const onSubmit = (data: WorkObject) => {
    if (initial) updateObject({ ...data, id: initial.id })
    else addObject({ ...data, id: newId() })
    reset(); onClose()
  }

  if (!open) return null
  return (
    <Portal>
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,41,.42)', backdropFilter: 'blur(2px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, boxShadow: '0 24px 70px -20px rgba(15,23,41,.5)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{initial ? 'Редактировать объект' : 'Новый объект'}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg)', color: 'var(--muted-ink)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={S.label}>Название объекта *</label>
              <input {...register('name', { required: true })} placeholder='Парк "Дружба"' style={S.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={S.label}>Адрес</label>
              <input {...register('address')} placeholder="ул. Центральная, 12" style={S.input} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={S.label}>Направление</label>
                <select style={S.input} value={watch('direction')} onChange={e => setValue('direction', e.target.value as Direction)}>
                  <option value="maf">МАФ / Металл</option>
                  <option value="finishing">Отделка</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={S.label}>Статус</label>
                <select style={S.input} value={watch('status')} onChange={e => setValue('status', e.target.value as WorkObject['status'])}>
                  <option value="active">Активный</option>
                  <option value="completed">Завершён</option>
                  <option value="archived">Архив</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={S.label}>Заказчик</label>
              <select style={S.input} value={watch('customerId')} onChange={e => setValue('customerId', e.target.value)}>
                <option value="">Выберите заказчика</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={S.label}>Примечания</label>
              <textarea {...register('notes')} rows={2} style={{ ...S.input, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
            <button type="button" onClick={onClose} style={S.btn()}>Отмена</button>
            <button type="submit" style={S.btn(true, true)}>{initial ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  )
}

export default function ObjectsPage() {
  const { objects, contracts, counterparties, deleteObject, initSeed } = useStore()
  useEffect(() => { initSeed() }, [])

  const [search, setSearch] = useState('')
  const [filterDirection, setFilterDirection] = useState<Direction | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WorkObject | undefined>()

  const filtered = objects.filter((o) => {
    if (filterDirection !== 'all' && o.direction !== filterDirection) return false
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const customer = counterparties.find((c) => c.id === o.customerId)
      return o.name.toLowerCase().includes(q) || o.address.toLowerCase().includes(q) || (customer?.name.toLowerCase().includes(q) ?? false)
    }
    return true
  })

  const statusLabels: Record<string, string> = { active: 'Активный', completed: 'Завершён', archived: 'Архив' }
  const statusColors: Record<string, string> = { active: 'var(--ok)', completed: 'var(--maf)', archived: 'var(--faint)' }

  return (
    <div className="fade-in ct-page" style={{ padding: '26px 30px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1500 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Объекты</h1>
        <button style={S.btn(false, true)} onClick={() => { setEditing(undefined); setFormOpen(true) }}><Plus size={16} /> Новый объект</button>
      </div>

      {/* Filters */}
      <div style={{ ...S.card, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--faint)' }} />
          <input placeholder="Поиск по названию, адресу, заказчику..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...S.input, paddingLeft: 38 }} />
        </div>
        <select style={{ ...S.input, width: 'auto', minWidth: 160 }} value={filterDirection} onChange={e => setFilterDirection(e.target.value as Direction | 'all')}>
          <option value="all">Все направления</option>
          <option value="maf">МАФ / Металл</option>
          <option value="finishing">Отделка</option>
        </select>
        <select style={{ ...S.input, width: 'auto', minWidth: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Все статусы</option>
          <option value="active">Активный</option>
          <option value="completed">Завершён</option>
          <option value="archived">Архив</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--faint)', padding: '56px 0', fontSize: 14 }}>Объектов не найдено</div>
      )}

      <div className="ct-objects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {filtered.map((obj) => {
          const customer    = counterparties.find((c) => c.id === obj.customerId)
          const objContracts = contracts.filter((c) => c.objectId === obj.id)
          const totalAmount  = objContracts.reduce((s, c) => s + c.amount, 0)
          // Направление берём из контрактов (большинство голосов), если контрактов нет — из объекта
          const dirFromContracts = objContracts.length > 0
            ? (objContracts.filter(c => c.direction === 'finishing').length >= objContracts.filter(c => c.direction === 'maf').length ? 'finishing' : 'maf') as Direction
            : obj.direction
          return (
            <div key={obj.id} style={{ ...S.card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, transition: 'transform .14s, box-shadow .14s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(20,30,55,.05), 0 18px 40px -22px rgba(20,30,55,.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0, background: dirFromContracts === 'maf' ? 'var(--maf-soft)' : 'var(--otd-soft)', color: dirFromContracts === 'maf' ? 'var(--maf)' : 'var(--otd)' }}>
                  <Building2 size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>{obj.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <DirectionBadge direction={dirFromContracts} />
                    <span className="ct-badge" style={{ background: obj.status === 'active' ? 'var(--ok-soft)' : 'var(--maf-soft)', color: statusColors[obj.status] }}>
                      {statusLabels[obj.status]}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={() => { setEditing(obj); setFormOpen(true) }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Pencil size={15} /></button>
                  <button onClick={() => { if (confirm('Удалить объект?')) deleteObject(obj.id) }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Trash2 size={15} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--muted-ink)' }}>
                {obj.address && <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}><MapPin size={14} style={{ color: 'var(--faint)', flexShrink: 0 }} /><span>{obj.address}</span></div>}
                {customer    && <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}><Users size={14} style={{ color: 'var(--faint)', flexShrink: 0 }} /><span>{customer.name}</span></div>}
              </div>

              {obj.notes && <div style={{ fontSize: 12.5, color: 'var(--faint)', fontStyle: 'italic' }}>{obj.notes}</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line-soft)', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontSize: 13 }}>
                  <b className="tnum">{objContracts.length}</b>
                  <span style={{ color: 'var(--muted-ink)' }}> контракта · </span>
                  <b className="tnum">{formatMoney(totalAmount)}</b>
                </span>
                <Link href={`/contracts?object=${obj.id}`} style={{ color: 'var(--maf)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Контракты →</Link>
              </div>
            </div>
          )
        })}
      </div>

      <ObjectFormModal open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
    </div>
  )
}
