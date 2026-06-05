'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SECRET = ['ArrowLeft', 'ArrowLeft', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight']

export function KonamiListener() {
  const router = useRouter()
  const seq = useRef<string[]>([])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      seq.current = [...seq.current, e.key].slice(-SECRET.length)
      if (seq.current.join(',') === SECRET.join(',')) {
        seq.current = []
        router.push('/sea')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  return null
}
