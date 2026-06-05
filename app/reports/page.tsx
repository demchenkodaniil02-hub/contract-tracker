'use client'
import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { formatMoney } from '@/lib/utils'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const { contracts, counterparties, objects } = useStore()

  const contractors = counterparties.filter(c => c.type === 'contractor')

  // Доступные годы из контрактов
  const years = useMemo(() => {
    const set = new Set<number>()
    contracts.forEach(c => {
      if (c.startDate) set.add(new Date(c.startDate).getFullYear())
      if (c.endDate)   set.add(new Date(c.endDate).getFullYear())
    })
    return Array.from(set).sort((a, b) => b - a)
  }, [contracts])

  const [selectedYear, setSelectedYear] = useState<number>(years[0] ?? new Date().getFullYear())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  // Контракты активные в выбранном году (начаты до конца года и не завершены до начала года)
  const yearContracts = useMemo(() =>
    contracts.filter(c => {
      const start = c.startDate ? new Date(c.startDate).getFullYear() : null
      const end   = c.endDate   ? new Date(c.endDate).getFullYear()   : null
      if (!start && !end) return false
      return (!start || start <= selectedYear) && (!end || end >= selectedYear)
    }),
    [contracts, selectedYear]
  )

  // Итоги по исполнителям
  const contractorReports = useMemo(() =>
    contractors.map(contractor => {
      const ctrs = yearContracts.filter(c => c.contractorId === contractor.id)
      if (!ctrs.length) return null

      const totalAmount = ctrs.reduce((s, c) => s + c.amount, 0)
      const totalPaid   = ctrs.reduce((s, c) => s + c.amountPaid, 0)

      return { contractor, contracts: ctrs, totalAmount, totalPaid, remaining: totalAmount - totalPaid }
    }).filter((r): r is NonNullable<typeof r> => r !== null),
    [contractors, yearContracts]
  )

  const grandTotal = useMemo(() => ({
    amount:       contractorReports.reduce((s, r) => s + r.totalAmount, 0),
    paid:         contractorReports.reduce((s, r) => s + r.totalPaid, 0),
    remaining:    contractorReports.reduce((s, r) => s + r.remaining, 0),
    contracts:    contractorReports.reduce((s, r) => s + r.contracts.length, 0),
  }), [contractorReports])

  const S = {
    card: { background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)' } as React.CSSProperties,
    th: { padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'left', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' } as React.CSSProperties,
    td: { padding: '10px 14px', fontSize: 13.5, borderBottom: '1px solid var(--line-soft)', verticalAlign: 'middle' } as React.CSSProperties,
  }

  return (
    <div className="fade-in ct-page" style={{ padding: '26px 30px 40px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1500 }}>

      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Отчёты</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--line)', background: y === selectedYear ? '#2f6bdc' : '#fff', color: y === selectedYear ? '#fff' : 'var(--ink)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Итоговая строка */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Контрактов', value: String(grandTotal.contracts), color: undefined },
          { label: 'Общая сумма', value: formatMoney(grandTotal.amount), color: undefined },
          { label: 'Оплачено', value: formatMoney(grandTotal.paid), color: 'var(--ok)' },
          { label: 'Остаток', value: formatMoney(grandTotal.remaining), color: 'var(--danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...S.card, padding: '14px 18px' }}>
            <div style={{ fontSize: 12.5, color: 'var(--faint)', marginBottom: 4 }}>{label}</div>
            <div className="tnum" style={{ fontSize: 18, fontWeight: 700, color: color ?? 'var(--ink)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* По каждому исполнителю */}
      {contractorReports.length === 0
        ? <div style={{ ...S.card, padding: 40, textAlign: 'center', color: 'var(--faint)', fontSize: 15 }}>Нет данных за {selectedYear} год</div>
        : contractorReports.map(({ contractor, contracts: ctrs, totalAmount, totalPaid, remaining }) => {
            const isOpen = expanded.has(contractor.id)
            const pct = totalAmount > 0 ? Math.round(totalPaid / totalAmount * 100) : 0

            return (
              <div key={contractor.id} style={S.card}>
                {/* Шапка исполнителя */}
                <button onClick={() => toggle(contractor.id)}
                  style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit', textAlign: 'left' }}>
                  {isOpen ? <ChevronDown size={16} color="var(--faint)" /> : <ChevronRight size={16} color="var(--faint)" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{contractor.name}</div>
                    {contractor.company && <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 2 }}>{contractor.company}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <Stat label="Контрактов" value={String(ctrs.length)} />
                    <Stat label="Сумма" value={formatMoney(totalAmount)} />
                    <Stat label="Оплачено" value={formatMoney(totalPaid)} color="var(--ok)" />
                    <Stat label="Остаток" value={formatMoney(remaining)} color="var(--danger)" />
                    {/* Прогресс */}
                    <div style={{ width: 80, textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 4 }}>{pct}%</div>
                      <div style={{ height: 6, borderRadius: 999, background: '#eceff3', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--ok)' : 'var(--maf)', borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Таблица контрактов */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--line-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg)' }}>
                          <th style={S.th}>№ Контракта</th>
                          <th style={S.th}>Объект</th>
                          <th style={S.th}>Начало</th>
                          <th style={S.th}>Окончание</th>
                          <th style={{ ...S.th, textAlign: 'right' }}>Сумма</th>
                          <th style={{ ...S.th, textAlign: 'right' }}>Оплачено</th>
                          <th style={{ ...S.th, textAlign: 'right' }}>Остаток</th>
                          <th style={{ ...S.th, textAlign: 'center' }}>%</th>
                          <th style={S.th}>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ctrs.map(c => {
                          const obj = objects.find(o => o.id === c.objectId)
                          const rem = c.amount - c.amountPaid
                          const p = c.amount > 0 ? Math.round(c.amountPaid / c.amount * 100) : 0
                          const statusLabel: Record<string, string> = { planning: 'Планируется', active: 'Активен', completed: 'Завершён', paused: 'Приостановлен', cancelled: 'Отменён', overdue: 'Просрочен' }
                          const statusColor: Record<string, string> = { active: '#1f8a5b', completed: '#16a34a', planning: '#6b7280', paused: '#e07a1a', cancelled: '#6b7280', overdue: 'var(--danger)' }
                          return (
                            <tr key={c.id} style={{ cursor: 'pointer' }}
                              onClick={() => window.open(`/contracts/${c.id}`, '_blank')}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                              <td style={S.td}><span style={{ fontWeight: 700, color: '#2f6bdc' }}>{c.number}</span></td>
                              <td style={S.td}>{obj?.name ?? '—'}</td>
                              <td style={{ ...S.td, color: 'var(--muted-ink)' }}>{c.startDate ? new Date(c.startDate).toLocaleDateString('ru') : '—'}</td>
                              <td style={{ ...S.td, color: 'var(--muted-ink)' }}>{c.endDate   ? new Date(c.endDate).toLocaleDateString('ru')   : '—'}</td>
                              <td style={{ ...S.td, textAlign: 'right' }} className="tnum">{formatMoney(c.amount)}</td>
                              <td style={{ ...S.td, textAlign: 'right', color: 'var(--ok)', fontWeight: 600 }} className="tnum">{formatMoney(c.amountPaid)}</td>
                              <td style={{ ...S.td, textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }} className="tnum">{formatMoney(rem)}</td>
                              <td style={{ ...S.td, textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                                  <div style={{ width: 48, height: 5, borderRadius: 999, background: '#eceff3', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${p}%`, background: p >= 100 ? 'var(--ok)' : 'var(--maf)' }} />
                                  </div>
                                  <span style={{ fontSize: 12, color: 'var(--faint)', minWidth: 28 }}>{p}%</span>
                                </div>
                              </td>
                              <td style={S.td}><span style={{ color: statusColor[c.status] ?? 'var(--ink)', fontWeight: 500, fontSize: 13 }}>{statusLabel[c.status] ?? c.status}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'var(--bg)' }}>
                          <td colSpan={4} style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--muted-ink)', fontWeight: 600 }}>Итого: {ctrs.length} контрактов</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }} className="tnum">{formatMoney(totalAmount)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--ok)' }} className="tnum">{formatMoney(totalPaid)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }} className="tnum">{formatMoney(remaining)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )
          })
      }
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11.5, color: 'var(--faint)', marginBottom: 2 }}>{label}</div>
      <div className="tnum" style={{ fontSize: 14, fontWeight: 700, color: color ?? 'var(--ink)', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}
