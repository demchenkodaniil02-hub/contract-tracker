'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'

type ShotResult = 'hit' | 'miss'
type Phase = 'connecting' | 'waiting' | 'battle' | 'finished'

function generateBoard(): boolean[][] {
  const b: boolean[][] = Array(10).fill(null).map(() => Array(10).fill(false))
  const ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]

  const ok = (r: number, c: number, sz: number, h: boolean) => {
    for (let i = 0; i < sz; i++) {
      const [row, col] = h ? [r, c + i] : [r + i, c]
      if (row >= 10 || col >= 10) return false
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const [nr, nc] = [row + dr, col + dc]
          if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && b[nr][nc]) return false
        }
    }
    return true
  }

  for (const sz of ships) {
    let placed = false, tries = 0
    while (!placed && tries++ < 500) {
      const h = Math.random() > 0.5
      const r = Math.floor(Math.random() * 10)
      const c = Math.floor(Math.random() * 10)
      if (ok(r, c, sz, h)) {
        for (let i = 0; i < sz; i++) h ? (b[r][c + i] = true) : (b[r + i][c] = true)
        placed = true
      }
    }
    if (!placed) return generateBoard()
  }
  return b
}

function countAlive(board: boolean[][], hits: Set<string>) {
  let n = 0
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 10; c++)
      if (board[r][c] && !hits.has(`${r},${c}`)) n++
  return n
}

const TOTAL = 20

export default function SeaPage() {
  const { profile } = useProfile()

  const myBoard = useRef<boolean[][]>(generateBoard())
  const myHitsReceived = useRef<Set<string>>(new Set())

  const [myShots, setMyShots] = useState<Map<string, ShotResult>>(new Map())
  const [enemyShots, setEnemyShots] = useState<Map<string, ShotResult>>(new Map())
  const [pending, setPending] = useState<string | null>(null)

  const [phase, setPhase] = useState<Phase>('connecting')
  const [opponent, setOpponent] = useState<{ id: string; name: string } | null>(null)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [winner, setWinner] = useState<'me' | 'opponent' | null>(null)
  const [myAlive, setMyAlive] = useState(TOTAL)
  const [enemyAlive, setEnemyAlive] = useState(TOTAL)
  const [log, setLog] = useState<string[]>([])

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const myId = useRef('')
  const oppId = useRef('')
  const gameOver = useRef(false)

  const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 8))

  useEffect(() => {
    if (!profile) return
    myId.current = profile.id
    const myName = profile.name || profile.email

    const ch = supabase.channel('battleship-v1', {
      config: { presence: { key: profile.id } },
    })
    channelRef.current = ch

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ name: string }>()
      const players = Object.entries(state)
        .map(([id, metas]) => ({ id, name: (metas[0] as { name: string }).name || id }))
        .sort((a, b) => a.id.localeCompare(b.id))

      if (players.length < 2) {
        setPhase('waiting')
        setOpponent(null)
      } else {
        const opp = players.find(p => p.id !== profile.id)
        if (opp && !gameOver.current) {
          oppId.current = opp.id
          setOpponent(opp)
          const first = players[0].id === profile.id
          setIsMyTurn(first)
          setPhase('battle')
          addLog(first ? '🎯 Первый ход — ваш!' : `🎯 Первый ход — ${opp.name}`)
        }
      }
    })

    ch.on('broadcast', { event: 'shot' }, ({ payload }: { payload: { r: number; c: number; from: string } }) => {
      if (payload.from === myId.current) return
      const { r, c } = payload
      const key = `${r},${c}`
      const hit = myBoard.current[r][c]
      myHitsReceived.current.add(key)
      const alive = countAlive(myBoard.current, myHitsReceived.current)
      setMyAlive(alive)
      setEnemyShots(prev => new Map(prev).set(key, hit ? 'hit' : 'miss'))

      ch.send({ type: 'broadcast', event: 'result', payload: { r, c, hit, alive, from: payload.from } })

      if (alive === 0) {
        gameOver.current = true
        setPhase('finished')
        setWinner('opponent')
        addLog('💀 Все ваши корабли потоплены!')
      } else {
        addLog(hit ? `💥 ${opponent?.name ?? 'Соперник'} попал в [${r + 1},${c + 1}]` : `〰️ ${opponent?.name ?? 'Соперник'} промахнулся [${r + 1},${c + 1}]`)
        setIsMyTurn(!hit)
      }
    })

    ch.on('broadcast', { event: 'result' }, ({ payload }: { payload: { r: number; c: number; hit: boolean; alive: number; from: string } }) => {
      if (payload.from !== myId.current) return
      const key = `${payload.r},${payload.c}`
      setPending(null)
      setMyShots(prev => new Map(prev).set(key, payload.hit ? 'hit' : 'miss'))
      setEnemyAlive(payload.alive)

      if (payload.alive === 0) {
        gameOver.current = true
        setPhase('finished')
        setWinner('me')
        addLog('🏆 Вы потопили весь флот!')
      } else {
        addLog(payload.hit ? `💥 Вы попали в [${payload.r + 1},${payload.c + 1}]!` : `〰️ Промах [${payload.r + 1},${payload.c + 1}]`)
        setIsMyTurn(payload.hit)
      }
    })

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ name: myName })
        setPhase('waiting')
      }
    })

    return () => { ch.unsubscribe() }
  }, [profile])

  const shoot = useCallback((r: number, c: number) => {
    if (!isMyTurn || phase !== 'battle' || gameOver.current) return
    const key = `${r},${c}`
    if (myShots.has(key) || pending) return
    setPending(key)
    channelRef.current?.send({ type: 'broadcast', event: 'shot', payload: { r, c, from: myId.current } })
  }, [isMyTurn, phase, myShots, pending])

  const C = 34

  const cell = (r: number, c: number, isEnemy: boolean) => {
    const key = `${r},${c}`
    let bg = '#0d1f3c'
    let text = ''
    let cursor = 'default'

    if (isEnemy) {
      if (key === pending) { bg = '#1e40af'; text = '?' }
      else if (myShots.get(key) === 'hit') { bg = '#dc2626'; text = '✕' }
      else if (myShots.get(key) === 'miss') { bg = '#1e3a5f'; text = '·' }
      else if (isMyTurn && phase === 'battle') { cursor = 'crosshair'; bg = '#0f2d5c' }
    } else {
      const hit = enemyShots.get(key)
      const isShip = myBoard.current[r][c]
      if (hit === 'hit') { bg = '#dc2626'; text = '✕' }
      else if (hit === 'miss') { bg = '#1e3a5f'; text = '·' }
      else if (isShip) { bg = '#1d4ed8' }
    }

    return (
      <div key={key} onClick={() => isEnemy && shoot(r, c)}
        onMouseEnter={e => { if (isEnemy && isMyTurn && phase === 'battle' && !myShots.has(key) && key !== pending) (e.currentTarget as HTMLElement).style.background = '#2563eb' }}
        onMouseLeave={e => { if (isEnemy && !myShots.has(key) && key !== pending) (e.currentTarget as HTMLElement).style.background = isMyTurn && phase === 'battle' ? '#0f2d5c' : '#0d1f3c' }}
        style={{ width: C, height: C, background: bg, border: '1px solid #1e3a6e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700, cursor, borderRadius: 3, transition: 'background .08s', userSelect: 'none' }}>
        {text}
      </div>
    )
  }

  const grid = (isEnemy: boolean) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(10, ${C}px)`, gap: 2 }}>
      {Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => cell(r, c, isEnemy)))}
    </div>
  )

  const turnMsg = phase === 'battle'
    ? isMyTurn ? '🎯 Ваш ход — выберите клетку' : `⏳ Ход ${opponent?.name ?? 'соперника'}...`
    : phase === 'finished'
    ? winner === 'me' ? '🏆 Победа!' : '💀 Поражение'
    : ''

  return (
    <div style={{ minHeight: '100vh', background: '#060e1f', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Segoe UI', sans-serif", gap: 24 }}>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>⚓ Морской бой</div>
        <div style={{ fontSize: 12, color: '#3b5280', marginTop: 4, letterSpacing: '.1em', textTransform: 'uppercase' }}>Контракт Трекер · Секретный режим</div>
      </div>

      {phase === 'connecting' && (
        <div style={{ fontSize: 16, color: '#6b7a99' }}>Подключение...</div>
      )}

      {phase === 'waiting' && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 64 }}>🚢</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Ждём соперника</div>
          <div style={{ fontSize: 13, color: '#4a6080', maxWidth: 320, lineHeight: 1.6 }}>
            Пусть коллега тоже зайдёт сюда — как только подключится, игра начнётся автоматически
          </div>
          <div style={{ marginTop: 8, padding: '8px 16px', background: '#0d1f3c', borderRadius: 8, fontSize: 12, color: '#3b82f6', fontFamily: 'monospace' }}>
            ← ← ↓ ↓ → →
          </div>
        </div>
      )}

      {(phase === 'battle' || phase === 'finished') && (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: phase === 'finished' ? (winner === 'me' ? '#22c55e' : '#ef4444') : '#93c5fd', textAlign: 'center' }}>
            {turnMsg}
          </div>

          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#4a6080', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Ваши корабли · {myAlive}/{TOTAL} целы
              </div>
              {grid(false)}
            </div>

            <div style={{ minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 20 }}>
              <div style={{ background: '#0d1f3c', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#6b7a99', lineHeight: 1.8 }}>
                {log.length === 0 ? <span style={{ color: '#3b5280' }}>Лог игры пуст</span> : log.map((l, i) => <div key={i}>{l}</div>)}
              </div>
              {phase === 'finished' && (
                <button onClick={() => window.location.reload()}
                  style={{ padding: '10px', borderRadius: 10, border: 'none', background: '#1d4ed8', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Реванш
                </button>
              )}
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#4a6080', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {opponent?.name ?? 'Соперник'} · {enemyAlive}/{TOTAL} целы
              </div>
              {grid(true)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
