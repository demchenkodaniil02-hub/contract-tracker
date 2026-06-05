'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Building2, Users, Landmark, LogOut, Menu, X, UserCircle, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePresence } from '@/lib/usePresence'

const navItems = [
  { href: '/', label: 'Главная', icon: LayoutDashboard },
  { href: '/contracts', label: 'Контракты', icon: FileText },
  { href: '/objects', label: 'Объекты', icon: Building2 },
  { href: '/counterparties', label: 'Контрагенты', icon: Users },
  { href: '/reports', label: 'Отчёты', icon: BarChart3 },
  { href: '/profile', label: 'Профиль', icon: UserCircle },
]

const PUBLIC = ['/login', '/reset-password', '/set-password']

function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?' }

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { onlineUsers, currentUserId } = usePresence()
  const [mobileOpen, setMobileOpen] = useState(false)
  const logoClicks = useRef(0)
  const logoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }
  const close = () => setMobileOpen(false)

  const handleLogoClick = () => {
    logoClicks.current += 1
    if (logoTimer.current) clearTimeout(logoTimer.current)
    if (logoClicks.current >= 5) {
      logoClicks.current = 0
      router.push('/activity')
    } else {
      logoTimer.current = setTimeout(() => { logoClicks.current = 0 }, 2000)
    }
  }

  // Не показываем на публичных страницах
  if (PUBLIC.includes(pathname)) return null

  return (
    <>
      {/* Кнопка-гамбургер — только на мобильных */}
      <button className="mobile-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Меню">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Оверлей — закрывает сайдбар при клике */}
      <div className={`mobile-sidebar-overlay${mobileOpen ? ' open' : ''}`} onClick={close} />

      {/* Сайдбар */}
      <aside className={`ct-sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px' }}>
          <div onClick={handleLogoClick} style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'linear-gradient(160deg, #2f6bdc, #1f4ba8)', color: '#fff', flexShrink: 0, cursor: 'pointer' }}>
            <Landmark size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.15 }}>Контракт Трекер</div>
            <div style={{ fontSize: 11.5, color: '#93a0bb', marginTop: 2 }}>Управление заказами</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={close} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 9,
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                color: active ? '#fff' : '#aeb9cf',
                background: active ? '#2f6bdc' : 'transparent',
                boxShadow: active ? '0 6px 16px -6px #2f6bdc' : 'none',
                transition: 'background .15s, color .15s',
              }}>
                <Icon size={18} style={{ opacity: 0.9, flexShrink: 0 }} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Онлайн */}
        <div style={{ marginTop: 'auto' }} />
        {onlineUsers.length > 0 && (
          <div style={{ margin: '0 16px', padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,.05)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7a99', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Онлайн · {onlineUsers.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {onlineUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: u.avatarColor, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 9 }}>
                      {initials(u.name || u.email)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '1.5px solid #0f1729' }} />
                  </div>
                  <span style={{ fontSize: 12, color: u.id === currentUserId ? '#fff' : '#aeb9cf', fontWeight: u.id === currentUserId ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.name || u.email}{u.id === currentUserId ? ' (вы)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleLogout} style={{ margin: '6px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: 'none', background: 'rgba(214,69,69,.12)', color: '#f87171', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', width: 'calc(100% - 32px)' }}>
          <LogOut size={16} /> Выйти
        </button>
      </aside>
    </>
  )
}
