'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { formatMoney, newId } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Plus, Trash2, FileText } from 'lucide-react'

export function ContractKSForms({ contractId }: { contractId: string }) {
  const { ksForms, addKsForm, deleteKsForm } = useStore()
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const contractForms = ksForms
    .filter(f => f.contractId === contractId)
    .sort((a, b) => b.date.localeCompare(a.date))

  const inp: React.CSSProperties = {
    padding: '8px 11px', border: '1px solid var(--line)', borderRadius: 8,
    fontFamily: 'inherit', fontSize: 13, background: '#fff', color: 'var(--ink)',
    boxSizing: 'border-box' as const,
  }

  const handleAdd = async () => {
    const num = parseFloat(amount.replace(',', '.'))
    if (!number.trim() || !num || num <= 0) return
    setSaving(true)
    await addKsForm({
      id: newId(),
      contractId,
      number: number.trim(),
      date,
      amount: num,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    })
    setNumber(''); setAmount(''); setNotes(''); setOpen(false); setSaving(false)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} style={{ color: 'var(--maf)' }} /> История форм КС ({contractForms.length})
        </div>
        <button onClick={() => setOpen(o => !o)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--maf)', background: open ? 'var(--maf)' : 'none', color: open ? '#fff' : 'var(--maf)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Добавить КС
        </button>
      </div>

      {open && (
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="ct-payment-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 5 }}>№ формы КС *</label>
              <input
                value={number} onChange={e => setNumber(e.target.value)}
                placeholder="КС-2 №1" style={{ ...inp, width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 5 }}>Дата подписания *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, width: '100%' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 5 }}>Сумма (руб.) *</label>
            <input
              type="number" step="0.01" min="0"
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" style={{ ...inp, width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 5 }}>Примечание</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Объём работ, период..." style={{ ...inp, width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setOpen(false)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Отмена</button>
            <button onClick={handleAdd} disabled={saving || !number || !amount}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--maf)', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Сохранение...' : 'Записать КС'}
            </button>
          </div>
        </div>
      )}

      {contractForms.length === 0
        ? <div style={{ color: 'var(--faint)', fontSize: 13, padding: '8px 0' }}>Форм КС пока нет</div>
        : <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 316, overflowY: 'auto', paddingRight: 4 }}>
            {contractForms.map((f, i) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--maf)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{f.number}</span>
                    <span className="tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--maf)' }}>{formatMoney(f.amount)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>
                    {format(parseISO(f.date), 'd MMMM yyyy', { locale: ru })}
                    {f.notes && <span style={{ marginLeft: 8, color: 'var(--muted-ink)' }}>· {f.notes}</span>}
                  </div>
                </div>
                <button onClick={() => { if (confirm('Удалить эту форму КС?')) deleteKsForm(f.id) }}
                  style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--faint)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
