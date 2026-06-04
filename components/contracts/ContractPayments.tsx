'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { formatMoney, newId } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Plus, Trash2, Wallet } from 'lucide-react'

export function ContractPayments({ contractId }: { contractId: string }) {
  const { payments, addPayment, deletePayment } = useStore()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const contractPayments = payments
    .filter(p => p.contractId === contractId)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))

  const inp: React.CSSProperties = {
    padding: '8px 11px', border: '1px solid var(--line)', borderRadius: 8,
    fontFamily: 'inherit', fontSize: 13, background: '#fff', color: 'var(--ink)',
    boxSizing: 'border-box' as const,
  }

  const handleAdd = async () => {
    const num = parseFloat(amount.replace(',', '.'))
    if (!num || num <= 0) return
    setSaving(true)
    await addPayment({
      id: newId(),
      contractId,
      amount: num,
      paidAt,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    })
    setAmount(''); setNote(''); setOpen(false); setSaving(false)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wallet size={16} style={{ color: 'var(--ok)' }} /> История оплат ({contractPayments.length})
        </div>
        <button onClick={() => setOpen(o => !o)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ok)', background: open ? 'var(--ok)' : 'none', color: open ? '#fff' : 'var(--ok)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Добавить оплату
        </button>
      </div>

      {/* Форма добавления */}
      {open && (
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="ct-payment-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 5 }}>Сумма (руб.) *</label>
              <input
                type="number" step="0.01" min="0"
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" style={{ ...inp, width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 5 }}>Дата оплаты *</label>
              <input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} style={{ ...inp, width: '100%' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 5 }}>Примечание</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Аванс, частичная оплата..." style={{ ...inp, width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setOpen(false)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Отмена</button>
            <button onClick={handleAdd} disabled={saving || !amount}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--ok)', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Сохранение...' : 'Записать оплату'}
            </button>
          </div>
        </div>
      )}

      {/* Список платежей */}
      {contractPayments.length === 0
        ? <div style={{ color: 'var(--faint)', fontSize: 13, padding: '8px 0' }}>Оплат пока нет</div>
        : <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
            {contractPayments.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="tnum" style={{ fontWeight: 700, fontSize: 14, color: 'var(--ok)' }}>+{formatMoney(p.amount)}</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>
                    {format(parseISO(p.paidAt), 'd MMMM yyyy', { locale: ru })}
                    {p.note && <span style={{ marginLeft: 8, color: 'var(--muted-ink)' }}>· {p.note}</span>}
                  </div>
                </div>
                <button onClick={() => { if (confirm('Удалить эту оплату?')) deletePayment(p.id, contractId) }}
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
