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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Pencil, Plus, Trash2, CheckCircle2, Copy } from 'lucide-react'

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
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDelete(stage.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
        <Button size="icon" className="h-7 w-7" onClick={() => { onUpdate(local).catch(console.error); setEditing(false) }}>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </Button>
      </td>
    </tr>
  )
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { contracts, objects, counterparties, stages, addStage, updateStage, deleteStage, addContract, initSeed } = useStore()
  const [pageLoading, setPageLoading] = useState(true)
  useEffect(() => {
    initSeed().finally(() => setPageLoading(false))
  }, [initSeed])

  const [editOpen, setEditOpen] = useState(false)

  async function handleDuplicate() {
    if (!contract) return
    const newContract = { ...contract, id: Math.random().toString(36).slice(2) + Date.now().toString(36), number: `${contract.number}-копия`, status: 'planning' as const, paymentStatus: 'not_paid' as const, amountPaid: 0, createdAt: new Date().toISOString().slice(0, 10) }
    await addContract(newContract)
    router.push(`/contracts/${newContract.id}`)
  }

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

  const S = {
    panel: { background: '#fff', border: '1px solid var(--line)', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 } as React.CSSProperties,
    panelHead: { padding: '12px 16px', borderBottom: '1px solid var(--line-soft)', fontWeight: 700, fontSize: 13.5, flexShrink: 0 } as React.CSSProperties,
    panelBody: { flex: 1, overflowY: 'auto', padding: '12px 16px' } as React.CSSProperties,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }} className="ct-page">

      {/* Шапка */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/contracts')} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--muted-ink)', flexShrink: 0 }}>
          <ArrowLeft size={15} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>{contract.number}</span>
        <DirectionBadge direction={contract.direction} />
        <StatusBadge status={effectiveStatus} />
        <PaymentBadge status={contract.paymentStatus} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button size="sm" variant="outline" onClick={handleDuplicate}><Copy className="w-3.5 h-3.5 mr-1" />Дублировать</Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil className="w-3.5 h-3.5 mr-1" />Редактировать</Button>
        </div>
      </div>

      {/* Основной грид — 3 колонки */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 320px', gridTemplateRows: '1fr 1fr', gap: 12, padding: 12, minHeight: 0 }}>

        {/* Колонка 1, строка 1: Детали + Финансы */}
        <div style={{ ...S.panel, gridRow: '1', gridColumn: '1' }}>
          <div style={S.panelHead}>Детали контракта</div>
          <div style={{ ...S.panelBody, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Row label="Объект" value={obj?.name ?? '—'} />
            <Row label="Заказчик" value={customer?.name ?? '—'} />
            <Row label="Исполнитель" value={contractor?.name ?? '—'} />
            <Row label="Начало" value={formatDate(contract.startDate)} />
            <Row label="Окончание" value={formatDate(contract.endDate)} />
            {contract.notes && <div style={{ fontSize: 12, color: 'var(--muted-ink)', background: 'var(--bg)', borderRadius: 8, padding: '8px 10px', marginTop: 4 }}>{contract.notes}</div>}
            <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--faint)' }}>Сумма</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{formatMoney(contract.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--faint)' }}>Оплачено</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ok)' }}>{formatMoney(contract.amountPaid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--faint)' }}>Остаток</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>{formatMoney(remaining)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: '#eceff3' }}>
                <div style={{ height: '100%', width: `${paidPct}%`, borderRadius: 999, background: paidPct >= 100 ? 'var(--ok)' : 'var(--maf)', transition: 'width .4s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--faint)', textAlign: 'right', marginTop: 4 }}>{paidPct}% оплачено</div>
            </div>
          </div>
        </div>

        {/* Колонка 1, строка 2: История оплат */}
        <div style={{ ...S.panel, gridRow: '2', gridColumn: '1' }}>
          <div style={S.panelHead}>История оплат</div>
          <div style={S.panelBody}><ContractPayments contractId={id} /></div>
        </div>

        {/* Колонка 2, обе строки: Комментарии */}
        <div style={{ ...S.panel, gridRow: '1 / 3', gridColumn: '2' }}>
          <div style={S.panelHead}>Комментарии</div>
          <div style={S.panelBody}><ContractComments contractId={id} /></div>
        </div>

        {/* Колонка 3, строка 1: Задачи */}
        <div style={{ ...S.panel, gridRow: '1', gridColumn: '3' }}>
          <div style={S.panelHead}>Задачи</div>
          <div style={S.panelBody}><ContractTasks contractId={id} /></div>
        </div>

        {/* Колонка 3, строка 2: Документы */}
        <div style={{ ...S.panel, gridRow: '2', gridColumn: '3' }}>
          <div style={S.panelHead}>Документы</div>
          <div style={S.panelBody}><ContractDocuments contractId={id} /></div>
        </div>

      </div>

      <ContractForm open={editOpen} onClose={() => setEditOpen(false)} initial={contract} />
    </div>
  )

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{value}</span>
      </div>
    )
  }
}
