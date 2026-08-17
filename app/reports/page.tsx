'use client'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { formatMoney } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

export default function ReportsPage() {
  const { contracts, counterparties, objects, payments, initSeed } = useStore()
  useEffect(() => { initSeed() }, [])

  const contractors = counterparties.filter(c => c.type === 'contractor')

  const years = useMemo(() => {
    const set = new Set<number>()
    payments.forEach(p => { if (p.paidAt) set.add(new Date(p.paidAt).getFullYear()) })
    return Array.from(set).sort((a, b) => b - a)
  }, [payments])

  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  useEffect(() => {
    if (years.length > 0 && selectedYear === null) setSelectedYear(years[0])
  }, [years])

  const activeYear = selectedYear ?? years[0] ?? new Date().getFullYear()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // Платежи за выбранный год
  const yearPayments = useMemo(() =>
    payments.filter(p => p.paidAt && new Date(p.paidAt).getFullYear() === activeYear),
    [payments, activeYear]
  )

  // Оборот и задолженность по исполнителям в одной сводке — раскрытие показывает
  // по каждому контракту сразу и оплату за год, и остаток
  const contractorReports = useMemo(() =>
    contractors.map(contractor => {
      const myContracts = contracts.filter(c => c.contractorId === contractor.id)
      const myYearPayments = yearPayments.filter(p => myContracts.some(c => c.id === p.contractId))
      const turnover = myYearPayments.reduce((s, p) => s + p.amount, 0)

      const debtEligible = myContracts.filter(c =>
        c.amountPaid < c.amount &&
        c.status !== 'cancelled' &&
        (!c.startDate || new Date(c.startDate).getFullYear() <= activeYear)
      )
      const debt = debtEligible.reduce((s, c) => s + (c.amount - c.amountPaid), 0)

      const relevantIds = new Set<string>([...myYearPayments.map(p => p.contractId), ...debtEligible.map(c => c.id)])
      const rows = myContracts.filter(c => relevantIds.has(c.id)).map(c => ({
        contract: c,
        paidThisYear: myYearPayments.filter(p => p.contractId === c.id).reduce((s, p) => s + p.amount, 0),
        remaining: c.amount - c.amountPaid,
        obj: objects.find(o => o.id === c.objectId),
      })).sort((a, b) => b.remaining - a.remaining || b.paidThisYear - a.paidThisYear)

      return { contractor, turnover, debt, rows }
    }).filter(r => r.turnover > 0 || r.debt > 0)
      .sort((a, b) => b.turnover - a.turnover),
    [contractors, contracts, yearPayments, activeYear, objects]
  )

  const totalTurnover = contractorReports.reduce((s, r) => s + r.turnover, 0)
  const totalDebt = contractorReports.reduce((s, r) => s + r.debt, 0)
  const totalContractsCount = contractorReports.reduce((s, r) => s + r.rows.length, 0)

  const S = {
    card: { background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)' } as React.CSSProperties,
    th: { padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'left', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' } as React.CSSProperties,
    td: { padding: '10px 14px', fontSize: 13.5, borderBottom: '1px solid var(--line-soft)', verticalAlign: 'middle' } as React.CSSProperties,
    // Ячейка CSS-грида по умолчанию не сжимается меньше своего контента и наезжает на соседей —
    // overflow:hidden убирает этот "grid blowout", minWidth:0 подстраховывает
    cell: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as React.CSSProperties,
  }

  return (
    <div className="fade-in ct-page" style={{ padding: '26px 30px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Заголовок + выбор года */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Отчёты</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--line)', background: y === activeYear ? '#2f6bdc' : '#fff', color: y === activeYear ? '#fff' : 'var(--ink)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* ───── ИСПОЛНИТЕЛИ: ОБОРОТ И ЗАДОЛЖЕННОСТЬ ───── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Исполнители</h2>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 320px))', gap: 12, justifyContent: 'start' }}>
          {[
            { label: 'Общий оборот', value: formatMoney(totalTurnover), color: 'var(--ok)' },
            { label: 'Общий долг', value: formatMoney(totalDebt), color: 'var(--danger)' },
            { label: 'Исполнителей', value: String(contractorReports.length) },
            { label: 'Контрактов', value: String(totalContractsCount) },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...S.card, padding: '14px 18px' }}>
              <div style={{ fontSize: 12.5, color: 'var(--faint)', marginBottom: 4 }}>{label}</div>
              <div className="tnum" style={{ fontSize: 20, fontWeight: 700, color: color ?? 'var(--ink)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Таблица */}
        {contractorReports.length === 0
          ? <div style={{ ...S.card, padding: 32, textAlign: 'center', color: 'var(--faint)', fontSize: 15 }}>Данных за {activeYear} год не найдено</div>
          : (
            <div style={{ ...S.card, overflow: 'hidden' }}>
            <div className="table-scroll" style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 700 }}>
              {/* Шапка */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px 170px 170px', padding: '10px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
                <div style={{ ...S.cell, fontSize: 12, fontWeight: 700, color: 'var(--faint)' }}>Исполнитель</div>
                <div style={{ ...S.cell, fontSize: 12, fontWeight: 700, color: 'var(--faint)' }}>Оборот {activeYear}</div>
                <div style={{ ...S.cell, fontSize: 12, fontWeight: 700, color: 'var(--faint)' }}>Задолженность</div>
                <div style={{ ...S.cell, fontSize: 12, fontWeight: 700, color: 'var(--faint)' }}>Всего</div>
              </div>

              {contractorReports.map(({ contractor, turnover, debt, rows }) => {
                const isOpen = expanded.has(contractor.id)
                return (
                  <div key={contractor.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <button onClick={() => toggle(contractor.id)}
                      style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr 170px 170px 170px', alignItems: 'center', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div style={{ ...S.cell, display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isOpen ? <ChevronDown size={15} color="var(--faint)" style={{ flexShrink: 0 }} /> : <ChevronRight size={15} color="var(--faint)" style={{ flexShrink: 0 }} />}
                        <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contractor.name}</span>
                      </div>
                      <div className="tnum" style={{ ...S.cell, fontSize: 15, fontWeight: 700, color: turnover > 0 ? 'var(--ok)' : 'var(--faint)' }}>{turnover > 0 ? formatMoney(turnover) : '—'}</div>
                      <div className="tnum" style={{ ...S.cell, fontSize: 15, fontWeight: 700, color: debt > 0 ? 'var(--danger)' : 'var(--faint)' }}>{debt > 0 ? formatMoney(debt) : '—'}</div>
                      <div className="tnum" style={{ ...S.cell, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{formatMoney(turnover + debt)}</div>
                    </button>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--line-soft)', background: 'var(--bg)' }}>
                        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                          <colgroup>
                            <col style={{ width: '160px' }} />
                            <col />
                            <col style={{ width: '170px' }} />
                            <col style={{ width: '170px' }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th style={S.th}>№ Контракта</th>
                              <th style={S.th}>Объект</th>
                              <th style={S.th}>Оплачено в {activeYear}</th>
                              <th style={S.th}>Остаток</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map(({ contract: c, paidThisYear, remaining, obj }) => (
                              <tr key={c.id} style={{ cursor: 'pointer' }}
                                onClick={() => window.open(`/contracts/${c.id}`, '_blank')}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                <td style={{ ...S.td, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ fontWeight: 700, color: '#2f6bdc' }}>{c.number}</span></td>
                                <td style={{ ...S.td, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{obj?.name ?? '—'}</td>
                                <td style={{ ...S.td, fontWeight: 700, color: paidThisYear > 0 ? 'var(--ok)' : 'var(--faint)' }} className="tnum">{paidThisYear > 0 ? formatMoney(paidThisYear) : '—'}</td>
                                <td style={{ ...S.td, color: remaining > 0 ? 'var(--danger)' : 'var(--ok)', fontWeight: 600 }} className="tnum">{formatMoney(remaining)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Итог */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px 170px 170px', padding: '12px 20px', background: 'var(--bg)' }}>
                <div style={{ ...S.cell, fontSize: 13, fontWeight: 700, color: 'var(--muted-ink)' }}>Итого</div>
                <div className="tnum" style={{ ...S.cell, fontSize: 16, fontWeight: 700, color: 'var(--ok)' }}>{formatMoney(totalTurnover)}</div>
                <div className="tnum" style={{ ...S.cell, fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>{formatMoney(totalDebt)}</div>
                <div className="tnum" style={{ ...S.cell, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{formatMoney(totalTurnover + totalDebt)}</div>
              </div>
            </div>
            </div>
            </div>
          )
        }
      </div>

    </div>
  )
}
