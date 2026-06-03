'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { formatDate, newId } from '@/lib/utils'
import { useProfile } from '@/lib/useProfile'
import { Trash2, Send } from 'lucide-react'

const AVATAR_PALETTE = ['#2f6bdc', '#1f8a5b', '#e07a1a', '#9b5de5', '#e0325f']
function avatarColor(name: string) { return AVATAR_PALETTE[(name.charCodeAt(0) || 0) % AVATAR_PALETTE.length] }
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }

export function ContractComments({ contractId }: { contractId: string }) {
  const { comments, addComment, deleteComment } = useStore()
  const { profile } = useProfile()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const contractComments = comments
    .filter((c) => c.contractId === contractId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const handleAdd = async () => {
    if (!text.trim() || sending) return
    const authorName = profile?.name || profile?.email || 'Пользователь'
    setSending(true)
    try {
      await addComment({ id: newId(), contractId, author: authorName, text: text.trim(), createdAt: new Date().toISOString() })
      setText('')
    } finally {
      setSending(false)
    }
  }

  const inp: React.CSSProperties = { padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'inherit', fontSize: 13.5, background: '#fff', color: 'var(--ink)', width: '100%', boxSizing: 'border-box' }
  const authorName = profile?.name || profile?.email || '...'
  const bg = profile?.avatarColor || avatarColor(authorName)
  const hasComments = contractComments.length > 0

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>💬 Комментарии ({contractComments.length})</div>

      {/* Список комментариев — показываем только если есть */}
      {hasComments && (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14, maxHeight: 320, overflowY: 'auto' }}>
          {contractComments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatarColor(c.author), color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                {initials(c.author)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author}</span>
                  <span style={{ fontSize: 11, color: 'var(--faint)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{formatDate(c.createdAt)}</span>
                </div>
                <div style={{ fontSize: 13, color: '#3a4254', marginTop: 3, lineHeight: 1.5 }}>{c.text}</div>
              </div>
              <button onClick={() => deleteComment(c.id).catch(console.error)}
                style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--faint)' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Форма ввода — компактная когда нет комментариев */}
      <div style={{ display: 'flex', gap: 10, alignItems: hasComments ? 'flex-start' : 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
          {initials(authorName)}
        </div>
        <div style={{ flex: 1 }}>
          <textarea value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd() }}
            placeholder={hasComments ? 'Ответить...' : 'Написать комментарий... (Ctrl+Enter для отправки)'}
            rows={text.length > 0 ? 3 : 1}
            style={{ ...inp, resize: 'none', lineHeight: 1.5, transition: 'height .15s' }} />
        </div>
        <button onClick={handleAdd} disabled={sending || !text.trim()}
          style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: text.trim() ? '#2f6bdc' : 'var(--line)', color: text.trim() ? '#fff' : 'var(--faint)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'background .15s' }}>
          <Send size={14} /> {sending ? '...' : 'Отправить'}
        </button>
      </div>
    </div>
  )
}
