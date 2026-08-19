'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { useProfile } from '@/lib/useProfile'
import { formatDate } from '@/lib/utils'
import { ListChecks, X, Clock } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

const PUBLIC = ['/login', '/reset-password', '/set-password']
const SESSION_KEY = 'ct_tasks_modal_shown'

function taskWord(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'задача'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'задачи'
  return 'задач'
}

export function MyTasksModal() {
  const pathname = usePathname()
  const router = useRouter()
  const { tasks, contracts, initSeed } = useStore()
  const { profile, loading } = useProfile()
  const [open, setOpen] = useState(false)

  useEffect(() => { initSeed() }, [initSeed])

  const myTasks = profile
    ? tasks
        .filter(t => t.assigneeId === profile.id && t.status === 'pending')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    : []

  useEffect(() => {
    if (loading || !profile?.name?.trim() || PUBLIC.includes(pathname)) return
    if (myTasks.length === 0) return
    if (typeof window === 'undefined' || sessionStorage.getItem(SESSION_KEY)) return
    setOpen(true)
  }, [loading, profile, myTasks.length, pathname])

  if (!open) return null

  const close = () => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setOpen(false)
  }

  const goTo = (contractId: string) => {
    close()
    router.push(`/contracts/${contractId}`)
  }

  return (
    <Portal>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,41,.55)', backdropFilter: 'blur(3px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px -20px rgba(15,23,41,.4)', overflow: 'hidden' }}>
          {/* Шапка */}
          <div style={{ background: '#0f1729', padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(160deg, #2f6bdc, #1f4ba8)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <ListChecks size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Ваши задачи</div>
              <div style={{ color: '#93a0bb', fontSize: 12, marginTop: 2 }}>
                {myTasks.length} невыполненн{myTasks.length % 10 === 1 && myTasks.length % 100 !== 11 ? 'ая' : 'ых'} {taskWord(myTasks.length)}
              </div>
            </div>
            <button onClick={close} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,.08)', color: '#93a0bb', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>

          {/* Список задач */}
          <div style={{ overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {myTasks.map(t => {
              const contract = contracts.find(c => c.id === t.contractId)
              const overdue = t.dueDate && new Date(t.dueDate) < new Date()
              return (
                <button key={t.id} onClick={() => goTo(t.contractId)}
                  style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px', borderRadius: 12, border: `1px solid ${overdue ? '#fca5a5' : 'var(--line)'}`, background: overdue ? '#fff5f5' : '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = overdue ? '#fee2e2' : 'var(--bg)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = overdue ? '#fff5f5' : '#fff'}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{t.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: overdue ? 'var(--danger)' : 'var(--faint)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} /> {formatDate(t.dueDate)} {t.dueTime}
                      {overdue && <b style={{ marginLeft: 2 }}>· Просрочено</b>}
                    </span>
                    {contract && (
                      <span style={{ color: 'var(--maf)', fontWeight: 600 }}>{contract.number}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Футер */}
          <div style={{ padding: '14px 26px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
            <button onClick={close}
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#2f6bdc', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Понятно
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
