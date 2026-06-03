'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Building2, Users, HardHat, LogOut, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'

const navItems = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/contracts', label: 'Контракты', icon: FileText },
  { href: '/objects', label: 'Объекты', icon: Building2 },
  { href: '/counterparties', label: 'Контрагенты', icon: Users },
]

function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?' }

export function Sidebar() {
  const pathname = usePathname()
  const { profile } = useProfile()
  const [mobileOpen, setMobileOpen] = useState(false)
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }
  const close = () => setMobileOpen(false)

  const sidebarContent = (
    <>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'linear-gradient(160deg, #2f6bdc, #1f4ba8)', color: '#fff', flexShrink: 0 }}>
          <HardHat size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.15 }}>КонтрактТрекер</div>
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

      {/* Legend */}
      <div style={{ marginTop: 'auto', padding: '14px 12px 4px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12, color: '#8a96af' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2f6bdc', display: 'inline-block' }} />МАФ / Металл
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#e07a1a', display: 'inline-block' }} />Отделка
        </div>
      </div>

      {/* Профиль */}
      {profile && (
        <Link href="/profile" onClick={close} style={{ margin: '4px 16px 0', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, textDecoration: 'none', background: pathname === '/profile' ? '#2f6bdc' : 'rgba(255,255,255,.05)', transition: 'background .15s' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: profile.avatarColor, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
            {initials(profile.name || profile.email)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name || profile.email}</div>
            <div style={{ color: '#93a0bb', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.email}</div>
          </div>
        </Link>
      )}
      <button onClick={handleLogout} style={{ margin: '6px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: 'none', background: 'rgba(214,69,69,.12)', color: '#f87171', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', width: 'calc(100% - 32px)' }}>
        <LogOut size={16} /> Выйти
      </button>
    </>
  )

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button className="mobile-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Меню">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay — mobile only */}
      <div className={`mobile-sidebar-overlay${mobileOpen ? ' open' : ''}`} onClick={close} />

      {/* Sidebar */}
      <aside className={`ct-sidebar${mobileOpen ? ' open' : ''}`} style={{
        width: 236, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
        background: '#0f1729', color: '#aeb9cf',
        display: 'flex', flexDirection: 'column', padding: '22px 16px', gap: 22,
        zIndex: 200, overflowY: 'auto',
      }}>
        {sidebarContent}
      </aside>
    </>
  )
}
