'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { useProfile } from '@/lib/useProfile'
import { Task } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Check, Clock, Trash2, ListChecks } from 'lucide-react'

const S = {
  card: { background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)' } as React.CSSProperties,
}

const TABS = [
  { key: 'active', label: 'Активные' },
  { key: 'completed', label: 'Выполненные' },
  { key: 'all', label: 'Все' },
] as const

export default function TasksPage() {
  const { tasks, contracts, updateTask, deleteTask, initSeed } = useStore()
  const { profile } = useProfile()
  const [tab, setTab] = useState<typeof TABS[number]['key']>('active')

  useEffect(() => { initSeed() }, [])

  const myTasks = tasks.filter(t => t.assigneeId === profile?.id)

  const filtered = myTasks
    .filter(t => {
      if (tab === 'active') return t.status === 'pending'
      if (tab === 'completed') return t.status === 'completed'
      return true
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const activeCount = myTasks.filter(t => t.status === 'pending').length
  const completedCount = myTasks.filter(t => t.status === 'completed').length

  const isOverdue = (task: Task) =>
    task.status === 'pending' && task.dueDate && new Date(task.dueDate) < new Date()

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
          ? <div style={{ textAlign: 'center', color: 'var(--faint)', padding: '56px 0', fontSize: 14 }}>Задач нет</div>
          : filtered.map(task => {
              const overdue = isOverdue(task)
              const contract = contracts.find(c => c.id === task.contractId)
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 13, padding: '14px 15px',
                  border: `1px solid ${overdue ? '#fca5a5' : task.status === 'completed' ? 'var(--line-soft)' : 'var(--line)'}`,
                  borderRadius: 12, background: overdue ? '#fff5f5' : task.status === 'completed' ? 'var(--bg)' : '#fff',
                }}>
                  <button onClick={() => handleToggle(task)}
                    style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${task.status === 'completed' ? 'var(--ok)' : 'var(--line)'}`, background: task.status === 'completed' ? 'var(--ok)' : 'transparent', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                    {task.status === 'completed' && <Check size={13} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--faint)' : overdue ? 'var(--danger)' : 'var(--ink)' }}>
                      {task.title}
                    </div>
                    {task.description && <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 3 }}>{task.description}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 12, color: 'var(--faint)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: overdue ? 'var(--danger)' : 'var(--faint)' }}>
                        <Clock size={11} /> {formatDate(task.dueDate)} {task.dueTime}
                        {overdue && <b style={{ marginLeft: 2 }}>· Просрочено</b>}
                      </span>
                      {contract && (
                        <Link href={`/contracts/${contract.id}`} style={{ color: 'var(--maf)', fontWeight: 600, textDecoration: 'none' }}>
                          {contract.number}
                        </Link>
                      )}
                    </div>
                  </div>

                  <button onClick={() => deleteTask(task.id)}
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
    </div>
  )
}
