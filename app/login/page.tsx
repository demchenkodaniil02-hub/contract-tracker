'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Landmark, LogIn, Mail } from 'lucide-react'

type Mode = 'login' | 'forgot'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const inp: React.CSSProperties = {
    padding: '11px 14px', border: '1px solid var(--line)', borderRadius: 10,
    fontFamily: 'inherit', fontSize: 14, background: '#fff', color: 'var(--ink)',
    width: '100%', boxSizing: 'border-box', outline: 'none',
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('РќРµРІРµСЂРЅС‹Р№ email РёР»Рё РїР°СЂРѕР»СЊ')
      setLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) setError('РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё РїРёСЃСЊРјР°. РџСЂРѕРІРµСЂСЊС‚Рµ email.')
    else setSuccess(`РџРёСЃСЊРјРѕ РѕС‚РїСЂР°РІР»РµРЅРѕ РЅР° ${email}. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕС‡С‚Сѓ.`)
  }

  return (
    <div className="ct-login-page" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="ct-login-card" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 70px -20px rgba(15,23,41,.2)', width: '100%', maxWidth: 400, overflow: 'hidden' }}>

        {/* РЁР°РїРєР° */}
        <div style={{ background: '#0f1729', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(160deg, #2f6bdc, #1f4ba8)', display: 'grid', placeItems: 'center' }}>
            <Landmark size={24} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>РљРѕРЅС‚СЂР°РєС‚ РўСЂРµРєРµСЂ</div>
            <div style={{ color: '#93a0bb', fontSize: 12, marginTop: 2 }}>РЈРїСЂР°РІР»РµРЅРёРµ Р·Р°РєР°Р·Р°РјРё</div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          {mode === 'login' ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Р’С…РѕРґ РІ СЃРёСЃС‚РµРјСѓ</div>
              <div style={{ fontSize: 13, color: 'var(--faint)', marginBottom: 24 }}>Р’РІРµРґРёС‚Рµ РІР°С€Рё РґР°РЅРЅС‹Рµ РґР»СЏ РІС…РѕРґР°</div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 6 }}>РџР°СЂРѕР»СЊ</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="вЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂў" required style={inp} />
                </div>

                {error && <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500 }}>{error}</div>}

                <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 10, border: 'none', background: '#2f6bdc', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                  <LogIn size={17} /> {loading ? 'Р’С…РѕРґ...' : 'Р’РѕР№С‚Рё'}
                </button>

                <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                  style={{ background: 'none', border: 'none', color: 'var(--maf)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', padding: 0, textAlign: 'center' }}>
                  Р—Р°Р±С‹Р»Рё РїР°СЂРѕР»СЊ?
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РїР°СЂРѕР»СЏ</div>
              <div style={{ fontSize: 13, color: 'var(--faint)', marginBottom: 24 }}>Р’РІРµРґРёС‚Рµ email вЂ” РїСЂРёС€Р»С‘Рј СЃСЃС‹Р»РєСѓ РґР»СЏ СЃР±СЂРѕСЃР° РїР°СЂРѕР»СЏ</div>

              {success ? (
                <div style={{ background: 'var(--ok-soft)', color: 'var(--ok)', padding: '16px', borderRadius: 10, fontSize: 14, fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>
                  вњ… {success}
                </div>
              ) : (
                <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted-ink)', display: 'block', marginBottom: 6 }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required style={inp} />
                  </div>

                  {error && <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500 }}>{error}</div>}

                  <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 10, border: 'none', background: '#2f6bdc', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Mail size={17} /> {loading ? 'РћС‚РїСЂР°РІРєР°...' : 'РћС‚РїСЂР°РІРёС‚СЊ СЃСЃС‹Р»РєСѓ'}
                  </button>
                </form>
              )}

              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                style={{ background: 'none', border: 'none', color: 'var(--muted-ink)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', padding: 0, marginTop: 16, display: 'block', textAlign: 'center', width: '100%' }}>
                в†ђ Р’РµСЂРЅСѓС‚СЊСЃСЏ Рє РІС…РѕРґСѓ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

