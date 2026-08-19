'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { useProfile } from '@/lib/useProfile'
import { Task } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Check, Clock, Trash2, ListChecks, X, UserCircle, ArrowRight } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

const S = {
  card: { background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)' } as React.CSSProperties,
}

const TABS = [
  { key: 'active', label: 'Активные' },
  { key: 'completed', label: 'Выполненные' },
  { key: 'all', label: 'Все' },
] as const

const VIEWS = [
  { key: 'assigned-to-me', label: 'Мне назначены' },
  { key: 'assigned-by-me', label: 'Поставленные мной' },
] as const

const isOverdue = (task: Task) =>
  task.status === 'pending' && !!task.dueDate && new Date(task.dueDate) < new Date()

type LifeStatus = 'in_progress' | 'done' | 'overdue'

function lifeStatus(task: Task): LifeStatus {
  if (task.status === 'completed') return 'done'
  if (isOverdue(task)) return 'overdue'
  return 'in_progress'
}

const LIFE_STATUS_LABEL: Record<LifeStatus, string> = { in_progress: 'В работе', done: 'Выполнена', overdue: 'Просрочена' }
const LIFE_STATUS_CLS: Record<LifeStatus, string> = { in_progress: 'info', done: 'success', overdue: 'danger' }

function TaskDetailModal({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { tasks, contracts, updateTask, deleteTask } = useStore()
  const { profile, allProfiles } = useProfile()
  const router = useRouter()

  const task = tasks.find(t => t.id === taskId)
  if (!task) return null

  const contract = contracts.find(c => c.id === task.contractId)
  const overdue = isOverdue(task)
  const getName = (id?: string) => {
    if (!id) return null
    const u = allProfiles.find(u => u.id === id)
    return u?.name || u?.email || null
  }
  const assigneeName = getName(task.assigneeId)
  const assignerName = getName(task.assignedById)

  const statusLabel = task.status === 'completed' ? 'Выполнена' : task.status === 'cancelled' ? 'Отменена' : 'Активна'
  const statusColor = task.status === 'completed' ? 'var(--ok)' : overdue ? 'var(--danger)' : 'var(--maf)'

  const goToContract = () => { onClose(); router.push(`/contracts/${task.contractId}`) }

  return (
    <Portal>
      <div onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,41,.5)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={e => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px -20px rgba(15,23,41,.4)', overflow: 'hidden' }}>

          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{task.title}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: statusColor, marginTop: 4 }}>
                {statusLabel}{overdue && task.status === 'pending' ? ' · Просрочено' : ''}
              </div>
            </div>
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg)', color: 'var(--muted-ink)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>
            {task.description && (
              <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>{task.description}</div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: overdue ? 'var(--danger)' : 'var(--muted-ink)' }}>
              <Clock size={14} /> {formatDate(task.dueDate)} {task.dueTime}
            </div>

            {contract && (
              <Link href={`/contracts/${contract.id}`} onClick={onClose}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--maf)', fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
                Договор {contract.number} <ArrowRight size={13} />
              </Link>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, borderTop: '1px solid var(--line-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--muted-ink)' }}>
                <UserCircle size={13} /> Исполнитель: <b style={{ color: 'var(--ink)' }}>{assigneeName ?? 'Не назначен'}</b>
              </div>
              {task.assignedById && assignerName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--muted-ink)' }}>
                  <UserCircle size={13} /> Назначил: <b style={{ color: 'var(--ink)' }}>{assignerName}{task.assignedById === profile?.id ? ' (вы)' : ''}</b>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', flexShrink: 0, display: 'flex', gap: 8 }}>
            {profile?.id === task.assigneeId && (
              <button onClick={() => updateTask({ ...task, status: task.status === 'completed' ? 'pending' : 'completed' })}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: task.status === 'completed' ? 'var(--bg)' : '#2f6bdc', color: task.status === 'completed' ? 'var(--ink)' : '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                {task.status === 'completed' ? 'Вернуть в работу' : 'Отметить выполненной'}
              </button>
            )}
            <button onClick={goToContract}
              style={{ flex: profile?.id === task.assigneeId ? 'none' : 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: '#fff', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              К договору
            </button>
            <button onClick={() => { deleteTask(task.id); onClose() }}
              style={{ width: 40, borderRadius: 10, border: '1px solid var(--line)', background: '#fff', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default function TasksPage() {
  const { tasks, contracts, updateTask, deleteTask, initSeed } = useStore()
  const { profile, allProfiles } = useProfile()
  const [view, setView] = useState<typeof VIEWS[number]['key']>('assigned-to-me')
  const [tab, setTab] = useState<typeof TABS[number]['key']>('active')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  useEffect(() => { initSeed() }, [])

  const getName = (id?: string) => {
    if (!id) return null
    const u = allProfiles.find(u => u.id === id)
    return u?.name || u?.email || null
  }

  const assignedToMe = tasks.filter(t => t.assigneeId === profile?.id)
  const assignedByMe = tasks.filter(t => t.assignedById === profile?.id && t.assigneeId !== profile?.id)
  const base = view === 'assigned-to-me' ? assignedToMe : assignedByMe

  const filtered = base
    .filter(t => {
      if (tab === 'active') return t.status === 'pending'
      if (tab === 'completed') return t.status === 'completed'
      return true
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const activeCount = base.filter(t => t.status === 'pending').length
  const completedCount = base.filter(t => t.status === 'completed').length

  const handleToggle = async (task: Task) => {
    await updateTask({ ...task, status: task.status === 'completed' ? 'pending' : 'completed' })
  }

  return (
    <div className="fade-in ct-page" style={{ padding: '26px 30px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(160deg, #2f6bdc, #1f4ba8)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <ListChecks size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Мои задачи</h1>
          <div style={{ fontSize: 13, color: 'var(--faint)', marginTop: 2 }}>
            {activeCount} активных · {completedCount} выполненных
          </div>
        </div>
      </div>

      {/* Мне назначены / Поставленные мной */}
      <div style={{ display: 'flex', gap: 6 }}>
        {VIEWS.map(v => (
          <button key={v.key} onClick={() => setView(v.key)}
            style={{
              padding: '9px 18px', borderRadius: 10, border: `1px solid ${view === v.key ? '#182033' : 'var(--line)'}`,
              background: view === v.key ? '#182033' : '#fff', color: view === v.key ? '#fff' : 'var(--muted-ink)',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Табы */}
      <div style={{ display: 'flex', gap: 6 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', borderRadius: 9, border: `1px solid ${tab === t.key ? '#2f6bdc' : 'var(--line)'}`,
              background: tab === t.key ? '#eff6ff' : '#fff', color: tab === t.key ? '#2f6bdc' : 'var(--muted-ink)',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Список */}
      <div style={{ ...S.card, padding: filtered.length === 0 ? 0 : 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0
          ? <div style={{ textAlign: 'center', color: 'var(--faint)', padding: '56px 0', fontSize: 14 }}>
              {view === 'assigned-to-me' ? 'Задач нет' : 'Вы никому не поставили задач'}
            </div>
          : filtered.map(task => {
              const overdue = isOverdue(task)
              const contract = contracts.find(c => c.id === task.contractId)
              const status = lifeStatus(task)
              return (
                <div key={task.id} onClick={() => setSelectedTaskId(task.id)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 13, padding: '14px 15px', cursor: 'pointer',
                  border: `1px solid ${overdue ? '#fca5a5' : task.status === 'completed' ? 'var(--line-soft)' : 'var(--line)'}`,
                  borderRadius: 12, background: overdue ? '#fff5f5' : task.status === 'completed' ? 'var(--bg)' : '#fff',
                }}>
                  {view === 'assigned-to-me' ? (
                    <button onClick={e => { e.stopPropagation(); handleToggle(task) }}
                      style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${task.status === 'completed' ? 'var(--ok)' : 'var(--line)'}`, background: task.status === 'completed' ? 'var(--ok)' : 'transparent', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                      {task.status === 'completed' && <Check size={13} />}
                    </button>
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--bg)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                      <ListChecks size={13} style={{ color: 'var(--faint)' }} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--faint)' : overdue ? 'var(--danger)' : 'var(--ink)' }}>
                      {task.title}
                    </div>
                    {task.description && <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 3 }}>{task.description}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 12, color: 'var(--faint)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: overdue ? 'var(--danger)' : 'var(--faint)' }}>
                        <Clock size={11} /> {formatDate(task.dueDate)} {task.dueTime}
                      </span>
                      {contract && (
                        <Link href={`/contracts/${contract.id}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--maf)', fontWeight: 600, textDecoration: 'none' }}>
                          {contract.number}
                        </Link>
                      )}
                      {view === 'assigned-by-me' && (
                        <>
                          <span className={`ct-badge ${LIFE_STATUS_CLS[status]}`} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                            {LIFE_STATUS_LABEL[status]}
                          </span>
                          {getName(task.assigneeId) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <UserCircle size={11} /> {getName(task.assigneeId)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <button onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                    style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--faint)'; (e.currentTarget as HTMLElement).style.background = 'none' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })
        }
      </div>

      {selectedTaskId && <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
    </div>
  )
}
