'use client'
import { usePathname } from 'next/navigation'
import { useCalculatorVersion } from '@/lib/useCalculatorVersion'
import { X, Sparkles, Download } from 'lucide-react'

const HIDE_ON = ['/login', '/reset-password', '/set-password', '/profile']

export function CalculatorUpdateToast() {
  const pathname = usePathname()
  const { isNew, url, markSeen } = useCalculatorVersion()

  if (!isNew || HIDE_ON.includes(pathname)) return null

  const openDownload = () => {
    markSeen()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fade-in" style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 150, width: 320, maxWidth: 'calc(100vw - 40px)',
      background: '#fff', borderRadius: 14, border: '1px solid var(--line)',
      boxShadow: '0 20px 50px -15px rgba(15,23,41,.35)', padding: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--maf-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Sparkles size={17} color="var(--maf)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Новая версия калькулятора</div>
          <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 3, lineHeight: 1.4 }}>
            На Яндекс.Диске обновлён файл расчётов — скачайте свежую версию.
          </div>
        </div>
        <button onClick={markSeen} title="Закрыть"
          style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'var(--bg)', color: 'var(--muted-ink)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={markSeen}
          style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1px solid var(--line)', background: '#fff', color: 'var(--muted-ink)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ОК
        </button>
        <button onClick={openDownload}
          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 9, border: 'none', background: '#2f6bdc', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download size={13} /> Скачать
        </button>
      </div>
    </div>
  )
}
