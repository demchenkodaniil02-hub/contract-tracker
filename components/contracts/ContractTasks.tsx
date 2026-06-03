'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Task } from '@/lib/types'
import { formatDate, newId } from '@/lib/utils'
import { useProfile } from '@/lib/useProfile'
import { Plus, Trash2, Check, Clock, Mail } from 'lucide-react'

export function ContractTasks({ contractId }: { contractId: string }) {
  const { tasks, addTask, updateTask, deleteTask } = useStore()
  const { profile } = useProfile()
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', dueTime: '09:00' })

  const contractTasks = tasks
    .filter((t) => t.contractId === contractId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const handleAddTask = async () => {
    if (!formData.title || !formData.dueDate) return
    const newTask: Task = {
      id: newId(),
      contractId,
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      dueTime: formData.dueTime,
      status: 'pending',
      reminderEmail: profile?.email || '',
      reminderSent: false,
      createdAt: new Date().toISOString(),
    }
    await addTask(newTask)
    setFormData({ title: '', description: '', dueDate: '', dueTime: '09:00' })
    setIsAdding(false)
  }

  const handleToggleTask = async (task: Task) => {
    await updateTask({
      ...task,
      status: task.status === 'completed' ? 'pending' : 'completed',
    })
  }

  const handleSendReminder = async (task: Task) => {
    if (!task.reminderEmail) {
      alert('Укажите email для уведомления')
      return
    }
    try {
      const res = await fetch('/api/send-task-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, email: task.reminderEmail, task }),
      })
      if (res.ok) {
        await updateTask({ ...task, reminderSent: true })
        alert('Напоминание отправлено!')
      }
    } catch (err) {
      console.error('Failed to send reminder', err)
      alert('Ошибка при отправке напоминания')
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>✓ Задачи ({contractTasks.length})</div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'transparent',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--maf)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
          <Plus size={14} /> Добавить задачу
        </button>
      </div>

      {isAdding && (
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Название задачи *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 13, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <textarea
            placeholder="Описание (опционально)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 13, marginBottom: 10, minHeight: 60 }}
          />
          {profile?.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-ink)', marginBottom: 10, background: 'var(--maf-soft)', padding: '6px 10px', borderRadius: 8 }}>
              <Mail size={13} style={{ color: 'var(--maf)', flexShrink: 0 }} />
              <span>Уведомление придёт на <b>{profile.email}</b></span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10 }}>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 13 }}
            />
            <input
              type="time"
              value={formData.dueTime}
              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 13 }}
            />
            <button
              onClick={handleAddTask}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--maf)',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
              Создать
            </button>
            <button
              onClick={() => setIsAdding(false)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: 13,
                cursor: 'pointer',
              }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {contractTasks.length === 0 ? (
        <div style={{ color: 'var(--faint)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
          Задач нет. {isAdding ? '' : 'Нажмите кнопку чтобы добавить первую задачу'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contractTasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '12px 13px',
                border: `1px solid ${task.status === 'completed' ? 'var(--line-soft)' : 'var(--line)'}`,
                borderRadius: 11,
                background: task.status === 'completed' ? 'var(--bg)' : '#fff',
                transition: 'border-color .14s, background .14s',
              }}>
              <button
                onClick={() => handleToggleTask(task)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: `2px solid ${task.status === 'completed' ? 'var(--ok)' : 'var(--line)'}`,
                  background: task.status === 'completed' ? 'var(--ok)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}>
                {task.status === 'completed' && <Check size={14} />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--faint)' : 'var(--ink)' }}>
                  {task.title}
                </div>
                {task.description && (
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{task.description}</div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: 'var(--faint)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {formatDate(task.dueDate)} {task.dueTime}
                  </span>
                  {task.reminderEmail && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={12} /> {task.reminderEmail === profile?.email ? 'Уведомление → вам' : task.reminderEmail}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {task.reminderEmail && !task.reminderSent && (
                  <button
                    onClick={() => handleSendReminder(task)}
                    title="Отправить напоминание"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      border: 'none',
                      background: 'none',
                      color: 'var(--maf)',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                    }}>
                    <Mail size={15} />
                  </button>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  title="Удалить"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    color: 'var(--faint)',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--faint)'; (e.currentTarget as HTMLElement).style.background = 'none' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
