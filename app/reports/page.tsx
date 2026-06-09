'use client'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { formatMoney } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

export default function ReportsPage() {
  const { contracts, counterparties, objects, payments, initSeed } = useStore()

  useEffect(() => { initSeed() }, [])

  const contractors = counterparties.filter(c => c.type === 'contractor')

  // Доступные годы из истории оплат
  const years = useMemo(() => {
    const set = new Set<number>()
    payments.forEach(p => { if (p.paidAt) set.add(new Date(p.paidAt).getFullYear()) })
    return Array.from(set).sort((a, b) => b - a)
  }, [payments])

  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  // Обновляем выбранный год когда загрузятся данные
  useEffect(() => {
    if (years.length > 0 && selectedYear === null) setSelectedYear(years[0])
  }, [years])

  const activeYear = selectedYear ?? years[0] ?? new Date().getFullYear()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  // Оплаты за выбранный год
  const yearPayments = useMemo(() =>
    payments.filter(p => p.paidAt && new Date(p.paidAt).getFullYear() === activeYear),
    [payments, activeYear]
  )

  // Итоги по исполнителям: только по контрактам у которых были оплаты в этом году
  const contractorReports = useMemo(() =>
    contractors.map(contractor => {
      // Контракты этого исполнителя у которых были оплаты в выбранном году
      const contractorContracts = contracts.filter(c => c.contractorId === contractor.id)
      const ctrs = contractorContracts.filter(c => {
        const hadPaymentThisYear = yearPayments.some(p => p.contractId === c.id)
        const contractStartYear = c.startDate ? new Date(c.startDate).getFullYear() : activeYear
        const hasUnpaidBalance = c.amountPaid < c.amount && contractStartYear <= activeYear
        return hadPaymentThisYear || hasUnpaidBalance
      })
      if (!ctrs.length) return null

      const totalAmount = ctrs.reduce((s, c) => s + c.amount, 0)
      // Оплачено в году — сумма из payments за этот год
      const paidInYear  = yearPayments.filter(p => ctrs.some(c => c.id === p.contractId)).reduce((s, p) => s + p.amount, 0)
      // Оплачено всего по контракту (amountPaid)
      const totalPaid   = ctrs.reduce((s, c) => s + c.amountPaid, 0)
      const remaining   = totalAmount - totalPaid

      return { contractor, contracts: ctrs, totalAmount, paidInYear, totalPaid, remaining }
    }).filter((r): r is NonNullable<typeof r> => r !== null),
    [contractors, contracts, yearPayments]
  )

  const grandTotal = useMemo(() => ({
    amount:     contractorReports.reduce((s, r) => s + r.totalAmount, 0),
    paidInYear: contractorReports.reduce((s, r) => s + r.paidInYear, 0),
    totalPaid:  contractorReports.reduce((s, r) => s + r.totalPaid, 0),
    remaining:  contractorReports.reduce((s, r) => s + r.remaining, 0),
    contracts:  contractorReports.reduce((s, r) => s + r.contracts.length, 0),
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
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--line)', background: y === activeYear ? '#2f6bdc' : '#fff', color: y === activeYear ? '#fff' : 'var(--ink)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Итоговая строка */}
      <div className="ct-reports-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        {[
          { label: 'Контрактов', value: String(grandTotal.contracts), color: undefined },
          { label: 'Сумма по контрактам', value: formatMoney(grandTotal.amount), color: undefined },
          { label: `Оплачено в ${activeYear}`, value: formatMoney(grandTotal.paidInYear), color: 'var(--ok)' },
          { label: 'Оплачено всего', value: formatMoney(grandTotal.totalPaid), color: 'var(--ok)' },
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
        ? <div style={{ ...S.card, padding: 40, textAlign: 'center', color: 'var(--faint)', fontSize: 15 }}>Нет данных за {activeYear} год</div>
        : (
          <div style={S.card}>
            <div className="ct-reports-table">
            <div className="ct-reports-table-inner">
            {/* Шапка колонок */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 160px 160px 160px 160px 90px', gap: 0, padding: '10px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg)', borderRadius: '16px 16px 0 0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)' }}>Исполнитель</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Контрактов</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Сумма</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Оплачено в {activeYear}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Оплачено всего</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>Остаток</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', textAlign: 'right' }}>%</div>
            </div>

            {contractorReports.map(({ contractor, contracts: ctrs, totalAmount, paidInYear, totalPaid, remaining }) => {
            const isOpen = expanded.has(contractor.id)
            const pct = totalAmount > 0 ? Math.round(totalPaid / totalAmount * 100) : 0

            return (
              <div key={contractor.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                {/* Строка исполнителя */}
                <button onClick={() => toggle(contractor.id)}
                  style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr 90px 160px 160px 160px 160px 90px', alignItems: 'center', fontFamily: 'inherit', textAlign: 'left', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isOpen ? <ChevronDown size={15} color="var(--faint)" /> : <ChevronRight size={15} color="var(--faint)" />}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{contractor.name}</div>
                      {contractor.company && <div style={{ fontSize: 12, color: 'var(--faint)' }}>{contractor.company}</div>}
                    </div>
                  </div>
                  <div className="tnum" style={{ textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{ctrs.length}</div>
                  <div className="tnum" style={{ textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{formatMoney(totalAmount)}</div>
                  <div className="tnum" style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--ok)' }}>{formatMoney(paidInYear)}</div>
                  <div className="tnum" style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--ok)' }}>{formatMoney(totalPaid)}</div>
                  <div className="tnum" style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>{formatMoney(remaining)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--faint)' }}>{pct}%</span>
                    <div style={{ width: 60, height: 5, borderRadius: 999, background: '#eceff3', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--ok)' : 'var(--maf)' }} />
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
          })}
          </div></div>
          </div>
        )
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
