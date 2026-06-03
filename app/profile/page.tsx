'use client'
import { useState, useEffect } from 'react'
import { useProfile } from '@/lib/useProfile'
import { Save } from 'lucide-react'

function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?' }

export default function ProfilePage() {
  const { profile, loading, updateProfile } = useProfile()
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

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

  return (
    <div className="fade-in" style={{ padding: '26px 30px', maxWidth: 600 }}>
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
    </div>
  )
}
