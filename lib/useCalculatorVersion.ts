'use client'
import { useEffect, useState } from 'react'

const SEEN_KEY = 'ct_calculator_seen_version'

export function useCalculatorVersion() {
  const [modified, setModified] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/calculator-info')
      .then(r => r.json())
      .then((j: { version: string | null; modified: string | null }) => {
        if (!j.version) return
        setVersion(j.version)
        setModified(j.modified)

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

  return { isNew, modified, markSeen }
}
