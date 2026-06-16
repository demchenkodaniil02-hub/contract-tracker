'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { formatMoney, isOverdue } from '@/lib/utils'
import { Search, FileText, Building2, Users, X } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { StatusBadge, DirectionBadge } from '@/components/contracts/StatusBadge'
import type { ContractStatus } from '@/lib/types'

interface Result {
  type: 'contract' | 'object' | 'counterparty'
  id: string
  title: string
  subtitle: string
  href: string
  meta?: React.ReactNode
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { contracts, objects, counterparties } = useStore()

  // Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50) }
    else { setQuery(''); setCursor(0) }
  }, [open])

  const results: Result[] = (() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Result[] = []

    // Контракты
    contracts.forEach(c => {
      const obj = objects.find(o => o.id === c.objectId)
      const customer = counterparties.find(x => x.id === c.customerId)
      const contractor = counterparties.find(x => x.id === c.contractorId)
      const hay = [c.number, obj?.name, customer?.name, contractor?.name].join(' ').toLowerCase()
      if (!hay.includes(q)) return
      const status = isOverdue(c.endDate, c.status) ? 'overdue' as ContractStatus : c.status
      out.push({
        type: 'contract', id: c.id,
        title: c.number,
        subtitle: [obj?.name, customer?.name].filter(Boolean).join(' · '),
        href: `/contracts/${c.id}`,
        meta: <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <DirectionBadge direction={c.direction} />
          <StatusBadge status={status} />
          <span style={{ fontSize: 12, color: 'var(--faint)' }}>{formatMoney(c.amount)}</span>
        </div>,
      })
    })

    // Объекты
    objects.forEach(o => {
      const hay = [o.name, o.address].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return
      const count = contracts.filter(c => c.objectId === o.id).length
      out.push({
        type: 'object', id: o.id,
        title: o.name,
        subtitle: o.address ?? '',
        href: `/objects`,
        meta: <span style={{ fontSize: 12, color: 'var(--faint)' }}>{count} контрактов</span>,
      })
    })

    // Контрагенты
    counterparties.forEach(cp => {
      const hay = [cp.name, cp.company, cp.phone, cp.email].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return
      const count = contracts.filter(c => c.customerId === cp.id || c.contractorId === cp.id).length
      out.push({
        type: 'counterparty', id: cp.id,
        title: cp.name,
        subtitle: [cp.company, cp.phone].filter(Boolean).join(' · '),
        href: `/counterparties`,
        meta: <span style={{ fontSize: 12, color: 'var(--faint)' }}>{count} контрактов</span>,
      })
    })

    return out.slice(0, 20)
  })()

  useEffect(() => { setCursor(0) }, [query])

  const go = useCallback((href: string) => {
    router.push(href)
    setOpen(false)
  }, [router])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && results[cursor]) go(results[cursor].href)
  }

  const TypeIcon = ({ type }: { type: Result['type'] }) => {
    if (type === 'contract')    return <FileText size={15} color="#2f6bdc" />
    if (type === 'object')      return <Building2 size={15} color="#e07a1a" />
    return <Users size={15} color="#9b5de5" />
  }

  const groupLabel: Record<Result['type'], string> = {
    contract: 'Контракты',
    object: 'Объекты',
    counterparty: 'Контрагенты',
  }

  // Группируем результаты
  const grouped: { type: Result['type']; items: Result[] }[] = []
  const seen = new Set<Result['type']>()
  for (const r of results) {
    if (!seen.has(r.type)) { seen.add(r.type); grouped.push({ type: r.type, items: [] }) }
    grouped.find(g => g.type === r.type)!.items.push(r)
  }

  let flatIdx = -1

  return (
    <>
      {/* Кнопка в сайдбаре — добавляется снаружи через useGlobalSearch */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 9, border: 'none',
          background: 'rgba(255,255,255,.07)', color: '#aeb9cf',
          fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
          cursor: 'pointer', width: '100%', marginBottom: 4,
        }}
      >
        <Search size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>Поиск</span>
      </button>

      {open && (
        <Portal>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,41,.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
          >
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600, boxShadow: '0 24px 80px -20px rgba(15,23,41,.5)', overflow: 'hidden', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
              {/* Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <Search size={18} color="var(--faint)" style={{ flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Поиск по контрактам, объектам, контрагентам..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', background: 'transparent' }}
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'grid', placeItems: 'center' }}>
                    <X size={15} />
                  </button>
                )}
                <kbd onClick={() => setOpen(false)} style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 6, padding: '2px 6px', color: 'var(--faint)', cursor: 'pointer' }}>Esc</kbd>
              </div>

              {/* Results */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {!query && (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--faint)', fontSize: 14 }}>
                    Начните вводить для поиска
                  </div>
                )}
                {query && results.length === 0 && (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--faint)', fontSize: 14 }}>
                    Ничего не найдено по «{query}»
                  </div>
                )}
                {grouped.map(({ type, items }) => (
                  <div key={type}>
                    <div style={{ padding: '10px 20px 4px', fontSize: 11, fontWeight: 700, color: 'var(--faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {groupLabel[type]}
                    </div>
                    {items.map(r => {
                      flatIdx++
                      const idx = flatIdx
                      const active = cursor === idx
                      return (
                        <div key={r.id} onClick={() => go(r.href)}
                          onMouseEnter={() => setCursor(idx)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer', background: active ? '#f0f4ff' : 'transparent', transition: 'background .1s' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: active ? '#dbeafe' : 'var(--bg)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <TypeIcon type={r.type} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{r.title}</div>
                            {r.subtitle && <div style={{ fontSize: 12, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitle}</div>}
                          </div>
                          <div>{r.meta}</div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {results.length > 0 && (
                <div style={{ padding: '8px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 16, fontSize: 11, color: 'var(--faint)' }}>
                  <span>↑↓ навигация</span>
                  <span>Enter открыть</span>
                  <span>Esc закрыть</span>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
