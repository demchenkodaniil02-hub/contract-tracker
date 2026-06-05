'use client'
import { useState } from 'react'
import { useProfile } from '@/lib/useProfile'
import { HardHat, Save } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

export function FirstLoginModal() {
  const { profile, updateProfile } = useProfile()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  // Показываем если профиль загружен, но имя не заполнено (только email-prefix)
  const needsSetup = profile && !profile.name

  if (!needsSetup) return null

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await updateProfile({ name: name.trim() })
    setSaving(false)
  }

  const inp: React.CSSProperties = {
    padding: '11px 14px', border: '1px solid var(--line)', borderRadius: 10,
    fontFamily: 'inherit', fontSize: 14, background: '#fff', color: 'var(--ink)',
    width: '100%', boxSizing: 'border-box', outline: 'none',
  }

  return (
    <Portal>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,41,.55)', backdropFilter: 'blur(3px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 70px -20px rgba(15,23,41,.4)', overflow: 'hidden' }}>
          {/* Шапка */}
          <div style={{ background: '#0f1729', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(160deg, #2f6bdc, #1f4ba8)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <HardHat size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Добро пожаловать!</div>
              <div style={{ color: '#93a0bb', fontSize: 12, marginTop: 2 }}>Укажите ваше имя для начала работы</div>
            </div>
          </div>

          {/* Форма */}
          <div style={{ padding: 28 }}>
            <div style={{ fontSize: 13, color: 'var(--muted-ink)', marginBottom: 18, lineHeight: 1.5 }}>
              Ваше имя будет отображаться в комментариях и истории изменений контрактов.
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 6 }}>Имя</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                placeholder="Иванов Иван Иванович"
                style={inp}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: name.trim() ? '#2f6bdc' : '#c0cbdf', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Save size={16} /> {saving ? 'Сохранение...' : 'Продолжить'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
