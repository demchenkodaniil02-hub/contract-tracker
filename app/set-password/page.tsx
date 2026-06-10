'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Landmark, KeyRound } from 'lucide-react'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase обрабатывает токен из хэша и автоматически логинит пользователя
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') setReady(true)
    })
    // Проверяем текущую сессию (если токен уже обработан)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
  }, [])

  const inp: React.CSSProperties = {
    padding: '11px 14px', border: '1px solid var(--line)', borderRadius: 10,
    fontFamily: 'inherit', fontSize: 14, background: '#fff', color: 'var(--ink)',
    width: '100%', boxSizing: 'border-box', outline: 'none',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Пароли не совпадают'); return }
    if (password.length < 6) { setError('Минимум 6 символов'); return }
    setError(''); setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError('Ошибка сохранения пароля. Попробуйте снова.')
    else { setSuccess(true); setTimeout(() => router.push('/'), 2000) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 70px -20px rgba(15,23,41,.2)', width: '100%', maxWidth: 420, overflow: 'hidden' }}>

        {/* Шапка */}
        <div style={{ background: '#0f1729', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(160deg, #2f6bdc, #1f4ba8)', display: 'grid', placeItems: 'center' }}>
            <Landmark size={24} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Контракт Трекер</div>
            <div style={{ color: '#93a0bb', fontSize: 12, marginTop: 2 }}>Управление заказами</div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ display: 'inline-block', background: '#eff6ff', color: '#2f6bdc', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6, letterSpacing: '0.05em', marginBottom: 16 }}>
            👤 ПРИГЛАШЕНИЕ
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Добро пожаловать!</div>
          <div style={{ fontSize: 13, color: 'var(--faint)', marginBottom: 24, lineHeight: 1.5 }}>
            Придумайте пароль для вашего аккаунта в Контракт Трекере.
          </div>

          {!ready ? (
            <div style={{ color: 'var(--faint)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
              Проверяем ссылку...
            </div>
          ) : success ? (
            <div style={{ background: 'var(--ok-soft)', color: 'var(--ok)', padding: '16px', borderRadius: 10, fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
              ✅ Пароль установлен! Входим в систему...
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 6 }}>Пароль</label>
                <input
                  autoFocus
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  required minLength={6}
                  style={inp}
                />
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 6 }}>Подтвердите пароль</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inp}
                />
              </div>

              {error && (
                <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                style={{ padding: '12px', borderRadius: 10, border: 'none', background: '#2f6bdc', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || !password || !confirm ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                <KeyRound size={17} /> {loading ? 'Сохранение...' : 'Войти в систему'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
