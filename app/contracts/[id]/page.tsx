'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { WorkStage } from '@/lib/types'
import { formatMoney, formatDate, isOverdue, newId, stageStatusLabel, stageStatusColor, cn } from '@/lib/utils'
import { StatusBadge, PaymentBadge, DirectionBadge } from '@/components/contracts/StatusBadge'
import { ContractForm } from '@/components/contracts/ContractForm'
import { ContractComments } from '@/components/contracts/ContractComments'
import { ContractDocuments } from '@/components/contracts/ContractDocuments'
import { ContractTasks } from '@/components/contracts/ContractTasks'
import { ContractHistory } from '@/components/contracts/ContractHistory'
import { ContractPayments } from '@/components/contracts/ContractPayments'
import { ContractKSForms } from '@/components/contracts/ContractKSForms'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Pencil, Plus, Trash2, CheckCircle2 } from 'lucide-react'

function StageRow({ stage, onUpdate, onDelete }: { stage: WorkStage; onUpdate: (s: WorkStage) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(stage)

  if (!editing) {
    return (
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3 font-medium text-slate-800">{stage.title}</td>
        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(stage.plannedStart)}</td>
        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(stage.plannedEnd)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-20">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${stage.progressPercent}%` }} />
            </div>
            <span className="text-xs text-slate-600 w-8 text-right">{stage.progressPercent}%</span>
          </div>
        </td>
        <td className="px-4 py-3 text-right font-medium">{formatMoney(stage.amount)}</td>
        <td className="px-4 py-3">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', stageStatusColor[stage.status])}>
            {stageStatusLabel[stage.status]}
          </span>
        </td>
        <td className="px-4 py-3">
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={() => setEditing(true)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Pencil size={13} /></button>
            <button onClick={() => onDelete(stage.id)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Trash2 size={13} /></button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="bg-blue-50">
      <td className="px-2 py-2"><Input value={local.title} onChange={(e) => setLocal({ ...local, title: e.target.value })} className="h-7 text-sm" /></td>
      <td className="px-2 py-2"><Input type="date" value={local.plannedStart} onChange={(e) => setLocal({ ...local, plannedStart: e.target.value })} className="h-7 text-sm" /></td>
      <td className="px-2 py-2"><Input type="date" value={local.plannedEnd} onChange={(e) => setLocal({ ...local, plannedEnd: e.target.value })} className="h-7 text-sm" /></td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-2">
          <Input type="number" min={0} max={100} value={local.progressPercent} onChange={(e) => setLocal({ ...local, progressPercent: Number(e.target.value) })} className="h-7 text-sm w-16" />
          <span className="text-xs text-slate-500">%</span>
        </div>
      </td>
      <td className="px-2 py-2"><Input type="number" value={local.amount} onChange={(e) => setLocal({ ...local, amount: Number(e.target.value) })} className="h-7 text-sm" /></td>
      <td className="px-2 py-2">
        <Select value={local.status} onValueChange={(v) => setLocal({ ...local, status: v as WorkStage['status'] })}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="in_progress">Выполняется</SelectItem>
            <SelectItem value="completed">Завершён</SelectItem>
            <SelectItem value="delayed">Задержка</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-2">
        <button onClick={() => { onUpdate(local).catch(console.error); setEditing(false) }} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#2f6bdc', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><CheckCircle2 size={13} /></button>
      </td>
    </tr>
  )
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { contracts, objects, counterparties, stages, ksForms, addStage, updateStage, deleteStage, addContract, initSeed } = useStore()
  const [pageLoading, setPageLoading] = useState(true)
  useEffect(() => {
    initSeed().finally(() => setPageLoading(false))
  }, [initSeed])

  const [editOpen, setEditOpen] = useState(false)


  const contract = contracts.find((c) => c.id === id)
  const contractStages = stages.filter((s) => s.contractId === id).sort((a, b) => a.plannedStart.localeCompare(b.plannedStart))

  if (pageLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 20 }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid var(--line)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderTopColor: 'var(--maf)', animation: 'spin 0.8s linear infinite' }} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Загрузка контракта</div>
      <div style={{ fontSize: 13, color: 'var(--faint)' }}>Получаем данные из базы...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!contract) return (
    <div className="p-6 text-slate-500">
      Контракт не найден.{' '}
      <button className="text-blue-600 underline" onClick={() => router.push('/contracts')}>Назад</button>
    </div>
  )

  const obj = objects.find((o) => o.id === contract.objectId)
  const customer = counterparties.find((c) => c.id === contract.customerId)
  const contractor = counterparties.find((c) => c.id === contract.contractorId)
  const effectiveStatus = isOverdue(contract.endDate, contract.status) ? 'overdue' as const : contract.status

  const paidPct = contract.amount > 0 ? Math.round((contract.amountPaid / contract.amount) * 100) : 0
  const remaining = contract.amount - contract.amountPaid
  const ksTotal = ksForms.filter(f => f.contractId === id).reduce((s, f) => s + f.amount, 0)
  const ksRemaining = Math.abs(ksTotal - contract.amountPaid)
  const stagesTotal = contractStages.reduce((s, x) => s + x.amount, 0)
  const stagePct = stagesTotal > 0
    ? Math.round(contractStages.reduce((s, x) => s + x.amount * x.progressPercent / 100, 0) / stagesTotal * 100)
    : 0

  function addNewStage() {
    addStage({
      id: newId(),
      contractId: id,
      title: 'Новый этап',
      plannedStart: contract!.startDate,
      plannedEnd: contract!.endDate,
      actualStart: '',
      actualEnd: '',
      progressPercent: 0,
      amount: 0,
      status: 'pending',
    }).catch(console.error)
  }

  const ganttStart = contractStages.length ? contractStages[0].plannedStart : contract.startDate
  const ganttEnd = contract.endDate
  const totalDays = Math.max(1, Math.ceil((new Date(ganttEnd).getTime() - new Date(ganttStart).getTime()) / 86400000))

  function ganttLeft(date: string) {
    return Math.max(0, Math.ceil((new Date(date).getTime() - new Date(ganttStart).getTime()) / 86400000) / totalDays * 100)
  }
  function ganttWidth(start: string, end: string) {
    return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) / totalDays * 100)
  }

  return (
    <div className="fade-in ct-page" style={{ padding: '26px 30px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Шапка */}
      <div className="ct-contract-header" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/contracts')} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--muted-ink)', flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em' }}>{contract.number}</h1>
        <DirectionBadge direction={contract.direction} />
        <StatusBadge status={effectiveStatus} />
        <PaymentBadge status={contract.paymentStatus} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setEditOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--line)', background: '#fff', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            <Pencil size={14} />Редактировать
          </button>
        </div>
      </div>

      {/* Детали + Финансы — в одну строку */}
      <div className="ct-contract-info-wrap" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 20px', boxShadow: 'var(--card-shadow)' }}>
        {/* Детали */}
        <div className="ct-contract-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 24px', minWidth: 0, overflow: 'hidden' }}>
          <Detail label="Объект" value={obj?.name ?? '—'} />
          <Detail label="Заказчик" value={customer?.name ?? '—'} />
          <Detail label="Исполнитель" value={contractor?.name ?? '—'} />
          <Detail label="Начало" value={formatDate(contract.startDate)} />
          <Detail label="Окончание" value={formatDate(contract.endDate)} />
          {contract.notes && <div style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--muted-ink)', borderTop: '1px solid var(--line-soft)', paddingTop: 8, marginTop: 4 }}>{contract.notes}</div>}
        </div>
        {/* Финансы */}
        <div className="ct-contract-finance" style={{ paddingLeft: 24, borderLeft: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 280 }}>
          <div className="ct-contract-finance-nums" style={{ display: 'flex', gap: 20 }}>
            <Fin label="Сумма" value={formatMoney(contract.amount)} />
            <Fin label="Оплачено" value={formatMoney(contract.amountPaid)} color="var(--ok)" />
            <Fin label="Остаток" value={formatMoney(remaining)} color="var(--danger)" />
          </div>
          {ksTotal > 0 && (
            <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 10, display: 'flex', gap: 20 }}>
              <Fin label="Закрыто КС" value={formatMoney(ksTotal)} color="var(--maf)" />
              <Fin label="Остаток по КС" value={formatMoney(ksRemaining)} color={ksRemaining > 0 ? 'var(--warn)' : 'var(--ok)'} />
            </div>
          )}
          {/* Прогресс-бар на всю ширину под цифрами */}
          <div>
            <div style={{ height: 8, borderRadius: 999, background: '#eceff3', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${paidPct}%`, borderRadius: 999, background: paidPct >= 100 ? 'var(--ok)' : 'var(--maf)', transition: 'width .5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--faint)' }}>0%</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: paidPct >= 100 ? 'var(--ok)' : 'var(--maf)' }}>{paidPct}% оплачено</span>
              <span style={{ fontSize: 11, color: 'var(--faint)' }}>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 колонки, блоки с внутренним скроллом */}
      <div className="ct-contract-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ContractPayments contractId={id} />
          <ContractKSForms contractId={id} />
          <ContractComments contractId={id} />
          <ContractHistory contractId={id} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ContractDocuments contractId={id} />
          <ContractTasks contractId={id} />
        </div>
      </div>

      <ContractForm open={editOpen} onClose={() => setEditOpen(false)} initial={contract} />
    </div>
  )

  function Detail({ label, value }: { label: string; value: string }) {
    return (
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: 'var(--faint)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div title={value} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    )
  }

  function Fin({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12.5, color: 'var(--faint)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: color ?? 'var(--ink)', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    )
  }
}
