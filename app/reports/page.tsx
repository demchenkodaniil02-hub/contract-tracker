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
  const [debtExpanded, setDebtExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleDebt = (id: string) => setDebtExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // Платежи за выбранный год
  const yearPayments = useMemo(() =>
    payments.filter(p => p.paidAt && new Date(p.paidAt).getFullYear() === activeYear),
    [payments, activeYear]
  )

  // Оборот по исполнителям — только платежи этого года
  const turnoverReports = useMemo(() =>
    contractors.map(contractor => {
      const myContracts = contracts.filter(c => c.contractorId === contractor.id)
      const myPayments = yearPayments.filter(p => myContracts.some(c => c.id === p.contractId))
      if (!myPayments.length) return null
      const turnover = myPayments.reduce((s, p) => s + p.amount, 0)
      // Контракты в которых были платежи в этом году
      const activeContracts = myContracts.filter(c => myPayments.some(p => p.contractId === c.id))
      // Платежи по каждому контракту
      const contractsWithPayments = activeContracts.map(c => ({
        contract: c,
        paidThisYear: myPayments.filter(p => p.contractId === c.id).reduce((s, p) => s + p.amount, 0),
        obj: objects.find(o => o.id === c.objectId),
      })).sort((a, b) => b.paidThisYear - a.paidThisYear)
      return { contractor, turnover, contractsWithPayments }
    }).filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.turnover - a.turnover),
    [contractors, contracts, yearPayments, objects]
  )

  const totalTurnover = turnoverReports.reduce((s, r) => s + r.turnover, 0)

  // Задолженность — контракты с остатком, начатые до конца выбранного года
  const debtReports = useMemo(() =>
    contractors.map(contractor => {
      const myContracts = contracts.filter(c =>
        c.contractorId === contractor.id &&
        c.amountPaid < c.amount &&
        c.status !== 'cancelled' &&
        (!c.startDate || new Date(c.startDate).getFullYear() <= activeYear)
      )
      if (!myContracts.length) return null
      const totalDebt = myContracts.reduce((s, c) => s + (c.amount - c.amountPaid), 0)
      return {
        contractor,
        totalDebt,
        contracts: myContracts.map(c => ({
          contract: c,
          remaining: c.amount - c.amountPaid,
          obj: objects.find(o => o.id === c.objectId),
        })).sort((a, b) => b.remaining - a.remaining),
      }
    }).filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.totalDebt - a.totalDebt),
    [contractors, contracts, activeYear, objects]
  )

  const totalDebt = debtReports.reduce((s, r) => s + r.totalDebt, 0)

  const S = {
    card: { background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)' } as React.CSSProperties,
    th: { padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'left', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' } as React.CSSProperties,
    td: { padding: '10px 14px', fontSize: 13.5, borderBottom: '1px solid var(--line-soft)', verticalAlign: 'middle' } as React.CSSProperties,
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

      {/* ───── ОБОРОТ ───── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Оборот {activeYear}</h2>
          <span style={{ fontSize: 13, color: 'var(--faint)' }}>сколько реально оплачено исполнителям в этом году</span>
        </div>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Общий оборот', value: formatMoney(totalTurnover), color: 'var(--ok)' },
            { label: 'Исполнителей', value: String(turnoverReports.length) },
            { label: 'Контрактов с платежами', value: String(turnoverReports.reduce((s, r) => s + r.contractsWithPayments.length, 0)) },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...S.card, padding: '14px 18px' }}>
              <div style={{ fontSize: 12.5, color: 'var(--faint)', marginBottom: 4 }}>{label}</div>
              <div className="tnum" style={{ fontSize: 20, fontWeight: 700, color: color ?? 'var(--ink)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Таблица оборота */}
        {turnoverReports.length === 0
          ? <div style={{ ...S.card, padding: 32, textAlign: 'center', color: 'var(--faint)', fontSize: 15 }}>Платежей за {activeYear} год не найдено</div>
          : (
            <div style={S.card}>
              {/* Шапка */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 180px 80px', padding: '10px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg)', borderRadius: '16px 16px 0 0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)' }}>Исполнитель</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Контрактов</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Оборот {activeYear}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Доля</div>
              </div>

              {turnoverReports.map(({ contractor, turnover, contractsWithPayments }) => {
                const isOpen = expanded.has(contractor.id)
                const share = totalTurnover > 0 ? Math.round(turnover / totalTurnover * 100) : 0
                return (
                  <div key={contractor.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <button onClick={() => toggle(contractor.id)}
                      style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr 100px 180px 80px', alignItems: 'center', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isOpen ? <ChevronDown size={15} color="var(--faint)" /> : <ChevronRight size={15} color="var(--faint)" />}
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{contractor.name}</span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--muted-ink)' }}>{contractsWithPayments.length}</div>
                      <div className="tnum" style={{ textAlign: 'right', fontSize: 16, fontWeight: 700, color: 'var(--ok)' }}>{formatMoney(turnover)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <span style={{ fontSize: 12, color: 'var(--faint)' }}>{share}%</span>
                        <div style={{ width: 50, height: 5, borderRadius: 999, background: '#eceff3', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${share}%`, background: 'var(--ok)' }} />
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--line-soft)', background: 'var(--bg)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={S.th}>№ Контракта</th>
                              <th style={S.th}>Объект</th>
                              <th style={{ ...S.th, textAlign: 'right' }}>Оплачено в {activeYear}</th>
                              <th style={{ ...S.th, textAlign: 'right' }}>Всего по контракту</th>
                              <th style={{ ...S.th, textAlign: 'right' }}>Остаток</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contractsWithPayments.map(({ contract: c, paidThisYear, obj }) => (
                              <tr key={c.id} style={{ cursor: 'pointer' }}
                                onClick={() => window.open(`/contracts/${c.id}`, '_blank')}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                <td style={S.td}><span style={{ fontWeight: 700, color: '#2f6bdc' }}>{c.number}</span></td>
                                <td style={S.td}>{obj?.name ?? '—'}</td>
                                <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: 'var(--ok)' }} className="tnum">{formatMoney(paidThisYear)}</td>
                                <td style={{ ...S.td, textAlign: 'right' }} className="tnum">{formatMoney(c.amountPaid)}</td>
                                <td style={{ ...S.td, textAlign: 'right', color: c.amount - c.amountPaid > 0 ? 'var(--danger)' : 'var(--ok)', fontWeight: 600 }} className="tnum">{formatMoney(c.amount - c.amountPaid)}</td>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 180px 80px', padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', borderRadius: '0 0 16px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-ink)' }}>Итого</div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{turnoverReports.reduce((s, r) => s + r.contractsWithPayments.length, 0)}</div>
                <div className="tnum" style={{ textAlign: 'right', fontSize: 16, fontWeight: 700, color: 'var(--ok)' }}>{formatMoney(totalTurnover)}</div>
                <div />
              </div>
            </div>
          )
        }
      </div>

      {/* ───── ЗАДОЛЖЕННОСТЬ ───── */}
      {debtReports.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Задолженность</h2>
            <span style={{ fontSize: 13, color: 'var(--faint)' }}>контракты с неоплаченным остатком на {activeYear} год</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Общий долг', value: formatMoney(totalDebt), color: 'var(--danger)' },
              { label: 'Контрактов с долгом', value: String(debtReports.reduce((s, r) => s + r.contracts.length, 0)) },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...S.card, padding: '14px 18px' }}>
                <div style={{ fontSize: 12.5, color: 'var(--faint)', marginBottom: 4 }}>{label}</div>
                <div className="tnum" style={{ fontSize: 20, fontWeight: 700, color: color ?? 'var(--ink)' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 180px', padding: '10px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg)', borderRadius: '16px 16px 0 0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)' }}>Исполнитель</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Контрактов</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Остаток долга</div>
            </div>

            {debtReports.map(({ contractor, totalDebt: debt, contracts: ctrs }) => {
              const isOpen = debtExpanded.has(contractor.id)
              return (
                <div key={contractor.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <button onClick={() => toggleDebt(contractor.id)}
                    style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr 100px 180px', alignItems: 'center', fontFamily: 'inherit', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isOpen ? <ChevronDown size={15} color="var(--faint)" /> : <ChevronRight size={15} color="var(--faint)" />}
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{contractor.name}</span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--muted-ink)' }}>{ctrs.length}</div>
                    <div className="tnum" style={{ textAlign: 'right', fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>{formatMoney(debt)}</div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--line-soft)', background: 'var(--bg)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={S.th}>№ Контракта</th>
                            <th style={S.th}>Объект</th>
                            <th style={{ ...S.th, textAlign: 'right' }}>Сумма</th>
                            <th style={{ ...S.th, textAlign: 'right' }}>Оплачено</th>
                            <th style={{ ...S.th, textAlign: 'right' }}>Остаток</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ctrs.map(({ contract: c, remaining, obj }) => (
                            <tr key={c.id} style={{ cursor: 'pointer' }}
                              onClick={() => window.open(`/contracts/${c.id}`, '_blank')}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                              <td style={S.td}><span style={{ fontWeight: 700, color: '#2f6bdc' }}>{c.number}</span></td>
                              <td style={S.td}>{obj?.name ?? '—'}</td>
                              <td style={{ ...S.td, textAlign: 'right' }} className="tnum">{formatMoney(c.amount)}</td>
                              <td style={{ ...S.td, textAlign: 'right', color: 'var(--ok)', fontWeight: 600 }} className="tnum">{formatMoney(c.amountPaid)}</td>
                              <td style={{ ...S.td, textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }} className="tnum">{formatMoney(remaining)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 180px', padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', borderRadius: '0 0 16px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-ink)' }}>Итого</div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{debtReports.reduce((s, r) => s + r.contracts.length, 0)}</div>
              <div className="tnum" style={{ textAlign: 'right', fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>{formatMoney(totalDebt)}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
