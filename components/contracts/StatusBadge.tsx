import { ContractStatus, Direction, PaymentStatus } from '@/lib/types'

export function StatusBadge({ status }: { status: ContractStatus }) {
  const map: Record<ContractStatus, { label: string; cls: string }> = {
    planning:  { label: 'Планируется', cls: 'muted' },
    active:    { label: 'Активный',    cls: 'success' },
    completed: { label: 'Завершён',    cls: 'success' },
    paused:    { label: 'Приостановлен', cls: 'warn' },
    cancelled: { label: 'Отменён',     cls: 'danger' },
    overdue:   { label: 'Просрочен',   cls: 'danger' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'muted' }
  return <span className={`ct-badge ${cls}`}><span className="bdot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />{label}</span>
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; cls: string }> = {
    not_paid: { label: 'Не оплачено', cls: 'danger' },
    partial:  { label: 'Частично',    cls: 'warn' },
    paid:     { label: 'Оплачено',    cls: 'success' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'muted' }
  return <span className={`ct-badge ${cls}`}>{label}</span>
}

export function DirectionBadge({ direction }: { direction: Direction }) {
  return (
    <span className={`ct-badge ${direction === 'maf' ? 'maf' : 'otd'}`}>
      {direction === 'maf' ? 'МАФ / Металл' : 'Отделка'}
    </span>
  )
}
