'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Task } from '@/lib/types'
import { formatDate, newId } from '@/lib/utils'
import { useProfile } from '@/lib/useProfile'
import { Plus, Trash2, Check, Clock, Mail, UserCircle, Bell } from 'lucide-react'

const inp: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)',
  fontFamily: 'inherit', fontSize: 13, width: '100%', boxSizing: 'border-box' as const, background: '#fff',
}

export function ContractTasks({ contractId }: { contractId: string }) {
  const { tasks, addTask, updateTask, deleteTask } = useStore()
  const { profile, allProfiles } = useProfile()

  const [isAdding, setIsAdding] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    title: '', description: '', dueDate: '', dueTime: '09:00',
    assigneeId: '', reminderDate: '',
  })

  const contractTasks = tasks
    .filter(t => t.contractId === contractId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const users = allProfiles ?? []

  const getAssigneeName = (id?: string) => {
    if (!id) return null
    const u = users.find(u => u.id === id)
    return u?.name || u?.email || null
  }

  const getAssigneeEmail = (id?: string) => {
    if (!id) return null
    return users.find(u => u.id === id)?.email || null
  }

  const sendAssignEmail = async (task: Task, assigneeEmail: string, type: 'assigned' | 'reminder') => {
    const contracts = useStore.getState().contracts
    const contract = contracts.find(c => c.id === contractId)
    await fetch('/api/send-task-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task, email: assigneeEmail,
        contractNumber: contract?.number,
        type,
        assignerName: profile?.name || profile?.email || 'Коллега',
      }),
    })
  }

  const handleAddTask = async () => {
    if (!formData.title || !formData.dueDate) return
    setSending(true)
    const assigneeEmail = getAssigneeEmail(formData.assigneeId) || ''
    const newTask: Task = {
      id: newId(),
      contractId,
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      dueTime: formData.dueTime,
      status: 'pending',
      reminderEmail: assigneeEmail || profile?.email || '',
      reminderSent: false,
      assigneeId: formData.assigneeId || undefined,
      reminderDate: formData.reminderDate || undefined,
      createdAt: new Date().toISOString(),
    }
    await addTask(newTask)
    // Отправляем email о назначении если выбран исполнитель
    if (assigneeEmail && formData.assigneeId !== profile?.id) {
      await sendAssignEmail(newTask, assigneeEmail, 'assigned').catch(console.error)
    }
    setFormData({ title: '', description: '', dueDate: '', dueTime: '09:00', assigneeId: '', reminderDate: '' })
    setIsAdding(false)
    setSending(false)
  }

  const handleToggle = async (task: Task) => {
    await updateTask({ ...task, status: task.status === 'completed' ? 'pending' : 'completed' })
  }

  const handleSendReminder = async (task: Task) => {
    const email = task.reminderEmail
    if (!email) { alert('Нет email для напоминания'); return }
    setSending(true)
    try {
      await sendAssignEmail(task, email, 'reminder')
      await updateTask({ ...task, reminderSent: true })
      alert('Напоминание отправлено!')
    } catch { alert('Ошибка отправки') }
    setSending(false)
  }

  const isOverdue = (task: Task) =>
    task.status === 'pending' && task.dueDate && new Date(task.dueDate) < new Date()

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>✓ Задачи ({contractTasks.length})</div>
        <button onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)', background: isAdding ? 'var(--bg)' : '#fff', color: 'var(--maf)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Добавить задачу
        </button>
      </div>

      {isAdding && (
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Название задачи *" value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })} style={inp} />
          <textarea placeholder="Описание (опционально)" value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            style={{ ...inp, minHeight: 52, resize: 'vertical' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 4 }}>Срок выполнения *</label>
              <input type="date" value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 4 }}>Время</label>
              <input type="time" value={formData.dueTime}
                onChange={e => setFormData({ ...formData, dueTime: e.target.value })} style={inp} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 4 }}>
                <UserCircle size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Исполнитель
              </label>
              <select value={formData.assigneeId}
                onChange={e => setFormData({ ...formData, assigneeId: e.target.value })} style={inp}>
                <option value="">— Не назначен</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}{u.id === profile?.id ? ' (вы)' : ''}
                  </option>
                ))}
              </select>
              {formData.assigneeId && formData.assigneeId !== profile?.id && (
                <div style={{ fontSize: 11.5, color: 'var(--ok)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={11} /> Email будет отправлен при создании
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 4 }}>
                <Bell size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Напоминание (дата)
              </label>
              <input type="date" value={formData.reminderDate}
                onChange={e => setFormData({ ...formData, reminderDate: e.target.value })} style={inp} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setIsAdding(false)}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
              Отмена
            </button>
            <button onClick={handleAddTask} disabled={sending || !formData.title || !formData.dueDate}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--maf)', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
              {sending ? 'Создаём...' : 'Создать задачу'}
            </button>
          </div>
        </div>
      )}

      {contractTasks.length === 0
        ? <div style={{ color: 'var(--faint)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Задач нет</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {contractTasks.map(task => {
              const overdue = isOverdue(task)
              const assigneeName = getAssigneeName(task.assigneeId)
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 13px',
                  border: `1px solid ${overdue ? '#fca5a5' : task.status === 'completed' ? 'var(--line-soft)' : 'var(--line)'}`,
                  borderRadius: 11, background: overdue ? '#fff5f5' : task.status === 'completed' ? 'var(--bg)' : '#fff',
                }}>
                  <button onClick={() => handleToggle(task)}
                    style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${task.status === 'completed' ? 'var(--ok)' : 'var(--line)'}`, background: task.status === 'completed' ? 'var(--ok)' : 'transparent', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                    {task.status === 'completed' && <Check size={12} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--faint)' : overdue ? 'var(--danger)' : 'var(--ink)' }}>
                      {task.title}
                    </div>
                    {task.description && <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{task.description}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 5, fontSize: 11.5, color: 'var(--faint)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: overdue ? 'var(--danger)' : 'var(--faint)' }}>
                        <Clock size={11} /> {formatDate(task.dueDate)} {task.dueTime}
                        {overdue && <b style={{ marginLeft: 2 }}>• Просрочено</b>}
                      </span>
                      {assigneeName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#eff6ff', color: '#2f6bdc', padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>
                          <UserCircle size={11} /> {assigneeName}
                        </span>
                      )}
                      {task.reminderDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Bell size={11} /> напомнить {formatDate(task.reminderDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {task.reminderEmail && !task.reminderSent && task.status !== 'completed' && (
                      <button onClick={() => handleSendReminder(task)} title="Отправить напоминание" disabled={sending}
                        style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'none', color: 'var(--maf)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <Mail size={14} />
                      </button>
                    )}
                    {task.reminderSent && (
                      <span title="Напоминание отправлено" style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', color: 'var(--ok)' }}>
                        <Mail size={14} />
                      </span>
                    )}
                    <button onClick={() => deleteTask(task.id)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--faint)'; (e.currentTarget as HTMLElement).style.background = 'none' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}
