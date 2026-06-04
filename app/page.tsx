'use client'
import { useEffect, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { formatMoney, formatDate, isOverdue, isDueSoon, statusLabel } from '@/lib/utils'
import { DirectionBadge } from '@/components/contracts/StatusBadge'
import { ContractStatus } from '@/lib/types'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO, startOfMonth, addMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AlertCircle, Clock, XCircle } from 'lucide-react'

function formatAmountLabel(value: number) {
  if (value < 1) {
    return `${Math.round(value * 1000).toLocaleString('ru-RU')} тыс. ₽`
  }
  const formatted = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, '')
  return `${formatted} млн. ₽`
}

function KpiCard({ label, value, sub, valueColor }: { label: string; value: string | number; sub?: string; valueColor?: string }) {
  return (
    <div className="ct-card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 13, color: 'var(--muted-ink)', fontWeight: 500 }}>{label}</div>
      <div className="tnum" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '8px 0 6px', color: valueColor || 'var(--ink)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { contracts, objects, counterparties, payments, initSeed } = useStore()
  useEffect(() => { initSeed() }, [])

  const enriched = useMemo(() => contracts.map((c) => ({
    ...c,
    status: isOverdue(c.endDate, c.status) ? 'overdue' as ContractStatus : c.status,
  })), [contracts])

  const totalAmount = enriched.reduce((s, c) => s + c.amount, 0)
  const totalPaid   = enriched.reduce((s, c) => s + c.amountPaid, 0)
  const activeCount    = enriched.filter((c) => c.status === 'active').length
  const overdueCount   = enriched.filter((c) => c.status === 'overdue').length
  const completedCount = enriched.filter((c) => c.status === 'completed').length

  const mafTotal      = enriched.filter((c) => c.direction === 'maf').reduce((s, c) => s + c.amount, 0)
  const finishingTotal = enriched.filter((c) => c.direction === 'finishing').reduce((s, c) => s + c.amount, 0)

  const overdue = enriched.filter((c) => c.status === 'overdue')
  const dueSoon = enriched.filter((c) => isDueSoon(c.endDate, c.status))

  const forecastData = useMemo(() => {
    const now = new Date()
    return [0, 1, 2].map(offset => {
      const monthStart = startOfMonth(addMonths(now, offset))
      const label = format(monthStart, 'LLLL yyyy', { locale: ru })
      const active = enriched.filter(c => c.status === 'active' || c.status === 'planning')
      const expected = active.reduce((s, c) => {
        const remaining = c.amount - c.amountPaid
        if (remaining <= 0) return s
        const endDate = parseISO(c.endDate)
        // Не включаем контракт если он уже закончился до начала этого месяца
        if (endDate < monthStart) return s
        const monthsLeft = Math.max(1, Math.ceil((endDate.getTime() - now.getTime()) / (30 * 86400000)))
        return s + remaining / monthsLeft
      }, 0)
      return { month: label, expected: Math.round(expected) }
    })
  }, [enriched])

  const totalExpected = forecastData.reduce((s, m) => s + m.expected, 0)
  const totalDebt = enriched.filter(c => c.status !== 'cancelled').reduce((s, c) => s + (c.amount - c.amountPaid), 0)

  // График истории оплат — стек по контрактам, сгруппированный по месяцам
  const { paymentChartData, paymentContractKeys } = useMemo(() => {
    if (!payments.length) return { paymentChartData: [], paymentContractKeys: [] }

    // Собираем все уникальные контракты из платежей
    const contractIds = [...new Set(payments.map(p => p.contractId))]
    const contractKeys = contractIds.map(id => {
      const c = contracts.find(c => c.id === id)
      return { id, label: c?.number ?? id.slice(0, 8) }
    })

    // Группируем по месяцам
    const map: Record<string, Record<string, number> & { month: string }> = {}
    payments.forEach(p => {
      if (!p.paidAt) return
      const key   = format(startOfMonth(parseISO(p.paidAt)), 'yyyy-MM')
      const label = format(startOfMonth(parseISO(p.paidAt)), 'MMM yyyy', { locale: ru })
      if (!map[key]) map[key] = { month: label } as any
      const contractLabel = contractKeys.find(k => k.id === p.contractId)?.label ?? p.contractId
      map[key][contractLabel] = (map[key][contractLabel] ?? 0) + p.amount / 1000000
    })

    const data = Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
    return { paymentChartData: data, paymentContractKeys: contractKeys }
  }, [payments, contracts])

  return (
    <div className="fade-in ct-page" style={{ padding: '26px 30px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1500 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Главная</h1>
        <span style={{ fontSize: 13, color: 'var(--faint)' }}>Обновлено: сегодня</span>
      </div>

      {overdueCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--danger-soft)', border: '1px solid #f3d3d3',
          borderRadius: 14, padding: '14px 18px', color: '#b23232', fontSize: 14,
        }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', display: 'grid', placeItems: 'center', color: 'var(--danger)', flexShrink: 0 }}>
            <AlertCircle size={18} />
          </div>
          <span><b>Просрочено {overdueCount} контракт{overdueCount === 1 ? '' : overdueCount < 5 ? 'а' : 'ов'}</b> — требуется внимание</span>
          <Link href="/contracts" style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 13, color: '#b23232', textDecoration: 'none', opacity: 0.75 }}>Смотреть →</Link>
        </div>
      )}

      {/* KPI */}
      <div className="ct-grid-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <KpiCard label="Контрактов всего" value={enriched.length} sub={`Завершено: ${completedCount}`} />
        <KpiCard label="Общая сумма"      value={formatMoney(totalAmount)} sub={`${enriched.length} контрактов`} />
        <KpiCard label="Оплачено"         value={formatMoney(totalPaid)} sub={`Остаток: ${formatMoney(totalAmount - totalPaid)}`} valueColor="var(--ok)" />
        <KpiCard label="Активных"         value={activeCount} sub="выполняются сейчас" />
      </div>

      {/* Directions */}
      <div className="ct-grid-direction" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { id: 'maf', label: 'МАФ / Металлоконструкции', color: 'var(--maf)', total: mafTotal },
          { id: 'finishing', label: 'Отделочные работы', color: 'var(--otd)', total: finishingTotal },
        ].map(({ id, label, color, total }) => {
          const dir = id as 'maf' | 'finishing'
          return (
            <div key={id} className="ct-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label}
              </div>
              <div className="tnum" style={{ fontSize: 28, fontWeight: 700, color, margin: '12px 0 4px', letterSpacing: '-0.02em' }}>{formatMoney(total)}</div>
              <div style={{ fontSize: 13, color: 'var(--faint)' }}>
                {enriched.filter(c => c.direction === dir).length} контрактов · {objects.filter(o => o.direction === dir).length} объектов
              </div>
              <div style={{ marginTop: 16, borderTop: '1px solid var(--line-soft)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['active', 'completed', 'planning', 'overdue'] as ContractStatus[]).map((st) => {
                  const cnt = enriched.filter(c => c.direction === dir && c.status === st).length
                  if (!cnt) return null
                  return (
                    <div key={st} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--muted-ink)' }}>{statusLabel[st]}</span>
                      <b className="tnum">{cnt}</b>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* График истории оплат */}
      <div className="ct-card" style={{ padding: '20px 22px' }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>История оплат по договорам</div>
        <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>млн. ₽ · по дате внесения оплаты</div>
        {paymentChartData.length === 0
          ? <div style={{ color: 'var(--faint)', fontSize: 13, padding: '32px 0', textAlign: 'center' }}>Оплат пока нет — добавьте их в карточках контрактов</div>
          : <ResponsiveContainer width="100%" height={240} style={{ marginTop: 16 }}>
              <BarChart data={paymentChartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--faint)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--faint)' }} tickFormatter={v => `${v.toFixed(1)}М`} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  formatter={(v: unknown, name: unknown) => [formatMoney(Number(v) * 1000000), String(name)]}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--line)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted-ink)' }} />
                {paymentContractKeys.map((k, i) => {
                  const colors = ['#2f6bdc','#e07a1a','#1f8a5b','#e0325f','#9b5de5','#0891b2','#f59e0b','#10b981','#ec4899','#6366f1','#14b8a6','#f97316','#84cc16','#8b5cf6','#ef4444','#06b6d4','#a855f7','#22c55e','#fb923c','#3b82f6']
                  return <Bar key={k.id} dataKey={k.label} name={k.label} stackId="a" fill={colors[i % colors.length]} radius={i === paymentContractKeys.length - 1 ? [4,4,0,0] : [0,0,0,0]} />
                })}
              </BarChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Прогноз поступлений */}
      <div className="ct-card" style={{ padding: '20px 22px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Прогноз поступлений</div>
        <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 16 }}>
          Ожидается получить за 3 месяца: <b className="tnum" style={{ color: 'var(--ink)' }}>{formatMoney(totalExpected)}</b>
          {totalDebt > 0 && <> · Дебиторка: <b className="tnum" style={{ color: 'var(--danger)' }}>{formatMoney(totalDebt)}</b></>}
        </div>
        <div className="ct-grid-forecast" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {forecastData.map((m, i) => (
            <div key={i} style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 18px', borderLeft: `4px solid ${i === 0 ? 'var(--maf)' : i === 1 ? 'var(--ok)' : 'var(--warn)'}` }}>
              <div style={{ fontSize: 12, color: 'var(--muted-ink)', textTransform: 'capitalize', marginBottom: 6 }}>{m.month}</div>
              <div className="tnum" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{formatMoney(m.expected)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panels */}
      <div className="ct-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Overdue */}
        <div className="ct-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600, fontSize: 14.5, color: 'var(--danger)', marginBottom: 8 }}>
            <XCircle size={18} /> Просроченные контракты
          </div>
          {overdue.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--faint)', fontSize: 13, padding: '28px 0' }}>Просроченных нет</div>
            : overdue.map((c) => {
                const obj      = objects.find((o) => o.id === c.objectId)
                const customer = counterparties.find((x) => x.id === c.customerId)
                return (
                  <Link key={c.id} href={`/contracts/${c.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '11px 0', borderTop: '1px solid var(--line-soft)', textDecoration: 'none', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{c.number}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 3 }}>{obj?.name} · {customer?.name}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--faint)', whiteSpace: 'nowrap' }}>
                      до {formatDate(c.endDate)}
                      <div style={{ marginTop: 6 }}><DirectionBadge direction={c.direction} /></div>
                    </div>
                  </Link>
                )
              })
          }
        </div>

        {/* Due soon */}
        <div className="ct-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600, fontSize: 14.5, color: 'var(--warn)', marginBottom: 8 }}>
            <Clock size={18} /> Заканчиваются в течение 30 дней
          </div>
          {dueSoon.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--faint)', fontSize: 13, padding: '28px 0' }}>Дедлайнов нет</div>
            : dueSoon.map((c) => {
                const obj      = objects.find((o) => o.id === c.objectId)
                const customer = counterparties.find((x) => x.id === c.customerId)
                return (
                  <Link key={c.id} href={`/contracts/${c.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '11px 0', borderTop: '1px solid var(--line-soft)', textDecoration: 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{c.number}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 3 }}>{obj?.name} · {customer?.name}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--warn)', whiteSpace: 'nowrap' }}>
                      до {formatDate(c.endDate)}
                      <div style={{ marginTop: 6 }}><DirectionBadge direction={c.direction} /></div>
                    </div>
                  </Link>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}
