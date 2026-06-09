'use client'
import { useState, useEffect } from 'react'
import { useProfile } from '@/lib/useProfile'
import { Save, UserPlus, Mail, Download } from 'lucide-react'

function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?' }

export default function ProfilePage() {
  const { profile, loading, updateProfile } = useProfile()
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    if (profile?.name && !name) setName(profile.name)
  }, [profile])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--faint)', fontSize: 14 }}>Загрузка...</div>
    </div>
  )

  const currentName = name

  const inp: React.CSSProperties = { padding: '10px 13px', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'inherit', fontSize: 13.5, background: '#fff', color: 'var(--ink)', width: '100%', boxSizing: 'border-box' }

  const handleSave = async () => {
    await updateProfile({ name: currentName })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviteStatus('sending')
    setInviteError('')
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setInviteError(json.error || 'Ошибка'); setInviteStatus('error'); return }
      setInviteStatus('sent')
      setInviteEmail('')
      setTimeout(() => setInviteStatus('idle'), 4000)
    } catch {
      setInviteError('Ошибка соединения')
      setInviteStatus('error')
    }
  }

  return (
    <div className="fade-in ct-page ct-profile-page" style={{ padding: '26px 30px', maxWidth: 600 }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 24 }}>Мой профиль</h1>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 28 }}>
        {/* Аватар */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: profile?.avatarColor || '#2f6bdc', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 26, flexShrink: 0 }}>
            {initials(currentName || profile?.email || '')}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{currentName || profile?.email}</div>
            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 4 }}>{profile?.email}</div>
          </div>
        </div>

        {/* Форма */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 6 }}>Имя / ФИО</label>
            <input
              value={currentName}
              onChange={e => setName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              style={inp}
            />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 8 }}>Email</label>
            <div style={{ padding: '10px 13px', background: 'var(--bg)', border: '1px solid var(--line-soft)', borderRadius: 10, fontSize: 13.5, color: 'var(--muted-ink)' }}>
              {profile?.email}
            </div>
          </div>

          <button onClick={handleSave} style={{ padding: '11px', borderRadius: 10, border: 'none', background: saved ? '#1f8a5b' : '#2f6bdc', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, transition: 'background .2s' }}>
            <Save size={17} /> {saved ? 'Сохранено!' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Пригласить коллегу */}
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 28, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <UserPlus size={18} color="#2f6bdc" />
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Пригласить пользователя</span>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--faint)', lineHeight: 1.5 }}>
          Пользователь получит письмо со ссылкой для входа. После перехода по ссылке он задаст пароль и получит доступ к системе.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--faint)' }} />
            <input
              type="email"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); if (inviteStatus === 'error') setInviteStatus('idle') }}
              onKeyDown={e => { if (e.key === 'Enter') handleInvite() }}
              placeholder="email@company.ru"
              style={{ ...inp, paddingLeft: 36 }}
            />
          </div>
          <button
            onClick={handleInvite}
            disabled={inviteStatus === 'sending' || !inviteEmail.trim()}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: inviteStatus === 'sent' ? '#1f8a5b' : '#2f6bdc', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: inviteStatus === 'sending' || !inviteEmail.trim() ? 'not-allowed' : 'pointer', opacity: inviteStatus === 'sending' || !inviteEmail.trim() ? 0.7 : 1, whiteSpace: 'nowrap', transition: 'background .2s' }}>
            {inviteStatus === 'sending' ? 'Отправка...' : inviteStatus === 'sent' ? 'Отправлено!' : 'Пригласить пользователя'}
          </button>
        </div>
        {inviteStatus === 'error' && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--danger)' }}>{inviteError}</div>
        )}
      </div>

      {/* Скачать программу */}
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 28, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Download size={18} color="#2f6bdc" />
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Рабочая программа</span>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--faint)', lineHeight: 1.5 }}>
          Скачайте рабочую программу с Яндекс Диска для работы на компьютере.
        </p>
        <a
          href="https://disk.yandex.ru/d/FyB9cgJMVl4VHg"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, border: 'none', background: '#2f6bdc', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
          <Download size={16} /> Скачать с Яндекс Диска
        </a>
      </div>
    </div>
  )
}
