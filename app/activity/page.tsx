'use client'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { History, Plus, Pencil, Trash2, Search, Undo2, Check } from 'lucide-react'
import Link from 'next/link'

const S = {
  card: { background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)' } as React.CSSProperties,
  input: { padding: '10px 13px', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'inherit', fontSize: 13.5, background: '#fff', color: 'var(--ink)', width: '100%', boxSizing: 'border-box' } as React.CSSProperties,
}

type Kind = 'create' | 'edit' | 'delete'

function classify(action: string): Kind {
  if (action.startsWith('Удал')) return 'delete'
  if (action.startsWith('Измен')) return 'edit'
  return 'create'
}

const KIND_META: Record<Kind, { label: string; color: string; bg: string; icon: typeof Plus }> = {
  create: { label: 'Создание', color: 'var(--ok)', bg: 'var(--ok-soft)', icon: Plus },
  edit:   { label: 'Изменение', color: 'var(--maf)', bg: 'var(--maf-soft)', icon: Pencil },
  delete: { label: 'Удаление', color: 'var(--danger)', bg: 'var(--danger-soft)', icon: Trash2 },
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'd MMMM yyyy, HH:mm', { locale: ru }) } catch { return dateStr }
}

export default function ActivityPage() {
  const { history, contracts, initSeed, restoreEntity } = useStore()
  const [pageLoading, setPageLoading] = useState(true)
  useEffect(() => { initSeed().finally(() => setPageLoading(false)) }, [initSeed])

  const [filterKind, setFilterKind] = useState<Kind | 'all'>('all')
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(50)
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

  const enriched = useMemo(() => history.map(h => ({ ...h, kind: classify(h.action) })), [history])

  const counts = useMemo(() => ({
    all: enriched.length,
    create: enriched.filter(h => h.kind === 'create').length,
    edit: enriched.filter(h => h.kind === 'edit').length,
    delete: enriched.filter(h => h.kind === 'delete').length,
  }), [enriched])

  const filtered = useMemo(() => {
    let list = enriched
    if (filterKind !== 'all') list = list.filter(h => h.kind === filterKind)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(h => h.action.toLowerCase().includes(q) || h.author.toLowerCase().includes(q))
    }
    return list
  }, [enriched, filterKind, search])

  if (pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--faint)', fontSize: 14 }}>Загрузка...</div>
    </div>
  )

  return (
    <div className="fade-in ct-page" style={{ padding: '26px 30px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <History size={22} style={{ color: 'var(--maf)' }} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Журнал изменений</h1>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: '#eceff3', borderRadius: 11 }}>
          {([
            { key: 'all', label: `Все (${counts.all})` },
            { key: 'create', label: `Создания (${counts.create})` },
            { key: 'edit', label: `Изменения (${counts.edit})` },
            { key: 'delete', label: `Удаления (${counts.delete})` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setFilterKind(t.key)}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'background .15s',
                background: filterKind === t.key ? '#fff' : 'none', color: filterKind === t.key ? 'var(--ink)' : 'var(--muted-ink)',
                boxShadow: filterKind === t.key ? '0 1px 3px rgba(20,30,55,.1)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', maxWidth: 320, flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--faint)' }} />
          <input placeholder="Поиск по описанию или автору..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...S.input, paddingLeft: 38 }} />
        </div>
      </div>

      <div style={{ ...S.card, padding: 4 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--faint)', padding: '56px 0', fontSize: 14 }}>Ничего не найдено</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.slice(0, visible).map((h, i) => {
              const meta = KIND_META[h.kind]
              const Icon = meta.icon
              const contract = contracts.find(c => c.id === h.contractId)
              return (
                <div key={h.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: meta.bg, color: meta.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.45 }}>
                      {h.action}
                      {h.field && h.field !== '__restore__' && (
                        <span style={{ color: 'var(--muted-ink)' }}>
                          {' '}— <b>{h.field}</b>:{' '}
                          <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{h.oldValue}</span>
                          {' → '}
                          <span style={{ color: 'var(--ok)' }}>{h.newValue}</span>
                        </span>
                      )}
                      {contract && (
                        <>
                          {' · '}
                          <Link href={`/contracts/${contract.id}`} style={{ color: 'var(--maf)', textDecoration: 'none', fontWeight: 600 }}>
                            {contract.number}
                          </Link>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 3 }}>
                      {h.author} · {formatDateTime(h.createdAt)}
                    </div>
                  </div>
                  {h.field === '__restore__' && (
                    restoreState[h.id] === 'done' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--ok)', flexShrink: 0, padding: '6px 4px' }}>
                        <Check size={14} /> Восстановлено
                      </span>
                    ) : (
                      <button onClick={() => handleRestore(h.id)} disabled={restoreState[h.id] === 'busy'}
                        title={restoreState[h.id] === 'error' ? 'Ошибка восстановления, попробуйте снова' : 'Восстановить'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
                          padding: '6px 12px', borderRadius: 8, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${restoreState[h.id] === 'error' ? 'var(--danger)' : 'var(--line)'}`,
                          background: '#fff', color: restoreState[h.id] === 'error' ? 'var(--danger)' : 'var(--ink)',
                        }}>
                        <Undo2 size={13} /> {restoreState[h.id] === 'busy' ? 'Восстановление...' : restoreState[h.id] === 'error' ? 'Ошибка, повторить' : 'Восстановить'}
                      </button>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {visible < filtered.length && (
        <button onClick={() => setVisible(v => v + 50)}
          style={{ alignSelf: 'center', padding: '9px 20px', borderRadius: 10, border: '1px solid var(--line)', background: '#fff', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
          Показать ещё ({filtered.length - visible})
        </button>
      )}
    </div>
  )
}
