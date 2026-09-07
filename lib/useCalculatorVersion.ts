'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const SEEN_KEY = 'ct_calculator_seen_version'

export function useCalculatorVersion() {
  const [modified, setModified] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/calculator-info')
      .then(r => r.json())
      .then((j: { version: string | null }) => {
        if (!j.version) return
        setVersion(j.version)
        setModified(j.version)

        let seen: string | null = null
        try { seen = localStorage.getItem(SEEN_KEY) } catch {}

        if (seen === null) {
          // Первый запуск фичи в этом браузере — считаем текущую версию базовой,
          // чтобы не показать ложное "есть обновление" всем сразу после деплоя
          try { localStorage.setItem(SEEN_KEY, j.version) } catch {}
        } else if (seen !== j.version) {
          setIsNew(true)
        }
      })
      .catch(() => {})
  }, [])

  const markSeen = () => {
    if (!version) return
    try { localStorage.setItem(SEEN_KEY, version) } catch {}
    setIsNew(false)
  }

  // Только для админа — отметить, что только что загруженная версия калькулятора новая
  const publishNewVersion = async () => {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    const res = await fetch('/api/calculator-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(j.error || 'Не удалось отметить новую версию')

    setVersion(j.version)
    setModified(j.version)
    try { localStorage.setItem(SEEN_KEY, j.version) } catch {}
    setIsNew(false)
  }

  return { isNew, modified, markSeen, publishNewVersion }
}
