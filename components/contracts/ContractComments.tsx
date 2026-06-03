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

  const inp: React.CSSProperties = { padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'inherit', fontSize: 13.5, background: '#fff', color: 'var(--ink)', width: '100%', boxSizing: 'border-box' }

  const authorName = profile?.name || profile?.email || '...'
  const bg = profile?.avatarColor || avatarColor(authorName)

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>💬 Комментарии ({contractComments.length})</div>

      <div className="ct-comments-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Форма ввода */}
        <div className="ct-comments-divider" style={{ borderRight: '1px solid var(--line-soft)', paddingRight: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: bg, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
              {initials(authorName)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: 'var(--muted-ink)', fontWeight: 600, marginBottom: 6 }}>{authorName}</div>
              <textarea value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd() }}
                placeholder="Написать комментарий..."
                rows={3} style={{ ...inp, resize: 'none', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }} />
              <button onClick={handleAdd} disabled={sending || !text.trim()}
                style={{ marginTop: 8, width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: sending ? '#93a0bb' : '#2f6bdc', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Send size={14} /> {sending ? '...' : 'Отправить'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 6, textAlign: 'center' }}>Ctrl+Enter для отправки</div>
            </div>
          </div>
        </div>

        {/* Список комментариев */}
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {contractComments.length === 0
            ? <div style={{ color: 'var(--faint)', fontSize: 13, paddingTop: 8 }}>Пока нет комментариев</div>
            : contractComments.map((c) => (
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
              ))
          }
        </div>
      </div>
    </div>
  )
}
