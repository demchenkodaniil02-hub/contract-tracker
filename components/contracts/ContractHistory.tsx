'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { Clock, Undo2, Check } from 'lucide-react'

export function ContractHistory({ contractId }: { contractId: string }) {
  const { history, restoreEntity } = useStore()
  const [restoreState, setRestoreState] = useState<Record<string, 'busy' | 'done' | 'error'>>({})

  const handleRestore = async (historyId: string) => {
    setRestoreState(s => ({ ...s, [historyId]: 'busy' }))
    try {
      await restoreEntity(historyId)
      setRestoreState(s => ({ ...s, [historyId]: 'done' }))
    } catch (err) {
      console.error(err)
      setRestoreState(s => ({ ...s, [historyId]: 'error' }))
    }
  }

  const contractHistory = history.filter(h => h.contractId === contractId)

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={16} style={{ color: 'var(--maf)' }} />
        История изменений
      </div>

      {contractHistory.length === 0
        ? <div style={{ color: 'var(--faint)', fontSize: 13, padding: '8px 0' }}>История пуста</div>
        : <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 280, overflowY: 'auto' }}>
            {contractHistory.map((h, i) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--maf)', flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>
                    {h.action}
                    {h.field && h.field !== '__restore__' && (
                      <span style={{ color: 'var(--muted-ink)', fontWeight: 400 }}>
                        {' '}— <b>{h.field}</b>:{' '}
                        <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{h.oldValue}</span>
                        {' → '}
                        <span style={{ color: 'var(--ok)' }}>{h.newValue}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 2 }}>
                    {h.author} · {formatDate(h.createdAt)}
                  </div>
                </div>
                {h.field === '__restore__' && (
                  restoreState[h.id] === 'done' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--ok)', flexShrink: 0 }}>
                      <Check size={13} /> Восстановлено
                    </span>
                  ) : (
                    <button onClick={() => handleRestore(h.id)} disabled={restoreState[h.id] === 'busy'}
                      title={restoreState[h.id] === 'error' ? 'Ошибка восстановления, попробуйте снова' : 'Восстановить'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                        padding: '5px 10px', borderRadius: 7, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${restoreState[h.id] === 'error' ? 'var(--danger)' : 'var(--line)'}`,
                        background: '#fff', color: restoreState[h.id] === 'error' ? 'var(--danger)' : 'var(--ink)',
                      }}>
                      <Undo2 size={12} /> {restoreState[h.id] === 'busy' ? '...' : restoreState[h.id] === 'error' ? 'Ошибка' : 'Восстановить'}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
      }
    </div>
  )
}
