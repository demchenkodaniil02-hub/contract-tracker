'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { ContractHistory } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, FileText } from 'lucide-react'
import Link from 'next/link'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d} дн. назад`
  if (h > 0) return `${h} ч. назад`
  if (m > 0) return `${m} мин. назад`
  return 'только что'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ActivityPage() {
  const { contracts, loadAll, loading } = useStore()
  const [history, setHistory] = useState<ContractHistory[]>([])
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadAll().then(() => {
      // Load full history directly
      fetch('/api/load-all').then(r => r.json()).then(data => {
        if (Array.isArray(data.history)) {
          setHistory(data.history.sort((a: ContractHistory, b: ContractHistory) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ))
        }
      })
    })
  }, [])

  const getContractNumber = (contractId: string) =>
    contracts.find(c => c.id === contractId)?.number ?? contractId.slice(0, 8)

  const filtered = history.filter(h => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      h.action?.toLowerCase().includes(q) ||
      h.author?.toLowerCase().includes(q) ||
      h.field?.toLowerCase().includes(q) ||
      h.newValue?.toLowerCase().includes(q) ||
      getContractNumber(h.contractId).toLowerCase().includes(q)
    )
  })

  const groupedByDate = filtered.reduce<Record<string, ContractHistory[]>>((acc, h) => {
    const day = new Date(h.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
    if (!acc[day]) acc[day] = []
    acc[day].push(h)
    return acc
  }, {})

  return (
    <div className="fade-in ct-page" style={{ padding: '26px 30px 40px', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--muted-ink)', flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>История изменений</h1>
        <span style={{ fontSize: 12, color: 'var(--faint)', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 6, padding: '2px 8px' }}>
          {history.length} записей
        </span>
      </div>

      {/* Поиск */}
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Clock size={15} color="var(--faint)" />
        <input
          placeholder="Поиск по действию, автору, контракту..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 14, background: 'transparent', color: 'var(--ink)' }}
        />
      </div>

      {loading && history.length === 0 && (
        <div style={{ color: 'var(--faint)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Загрузка...</div>
      )}

      {!loading && history.length === 0 && (
        <div style={{ color: 'var(--faint)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>История пуста</div>
      )}

      {Object.entries(groupedByDate).map(([day, items]) => (
        <div key={day} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
            {day}
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
            {items.map((h, i) => {
              const contractNum = getContractNumber(h.contractId)
              return (
                <div key={h.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: i < items.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  {/* Иконка */}
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                    <FileText size={14} color="var(--maf)" />
                  </div>

                  {/* Контент */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>{h.action}</span>
                      {h.field && (
                        <span style={{ fontSize: 12, color: 'var(--faint)', background: 'var(--bg)', padding: '1px 7px', borderRadius: 4 }}>
                          {h.field}
                        </span>
                      )}
                    </div>

                    {h.oldValue !== undefined && h.newValue !== undefined && (
                      <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--muted-ink)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ textDecoration: 'line-through', color: 'var(--faint)' }}>{h.oldValue || '—'}</span>
                        <span style={{ color: 'var(--faint)' }}>→</span>
                        <span style={{ color: 'var(--ok)', fontWeight: 600 }}>{h.newValue || '—'}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, fontSize: 12, color: 'var(--faint)' }}>
                      {h.author && <span style={{ fontWeight: 500 }}>{h.author}</span>}
                      {h.author && <span>·</span>}
                      <Link href={`/contracts/${h.contractId}`} style={{ color: 'var(--maf)', textDecoration: 'none', fontWeight: 600 }}>
                        № {contractNum}
                      </Link>
                      <span>·</span>
                      <span title={formatDate(h.createdAt)}>{timeAgo(h.createdAt)}</span>
                    </div>
                  </div>

                  {/* Время */}
                  <div style={{ fontSize: 11.5, color: 'var(--faint)', flexShrink: 0, paddingTop: 2 }}>
                    {new Date(h.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
