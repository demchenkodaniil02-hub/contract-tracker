'use client'
import { useState, useEffect } from 'react'
import { TicTacToe } from './TicTacToe'

const SECRET = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown']

export function SecretGame() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const buf: string[] = []
    const handler = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown'].includes(e.key)) { buf.length = 0; return }
      buf.push(e.key)
      if (buf.length > SECRET.length) buf.shift()
      if (buf.join(',') === SECRET.join(',')) setOpen(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!open) return null
  return <TicTacToe onClose={() => setOpen(false)} />
}
