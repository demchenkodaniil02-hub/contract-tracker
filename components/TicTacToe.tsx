'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { X as XIcon, RotateCcw } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

type Cell = '' | 'X' | 'O'
type Board = Cell[]
interface GameState { board: Board; turn: 'X' | 'O'; winner: '' | 'X' | 'O' | 'draw' }

const INIT: GameState = { board: Array(9).fill(''), turn: 'X', winner: '' }
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

function checkWinner(board: Board): GameState['winner'] {
  for (const [a,b,c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a] as 'X' | 'O'
  }
  return board.every(c => c) ? 'draw' : ''
}

const X_COLOR = '#2f6bdc'
const O_COLOR = '#e04040'

export function TicTacToe({ onClose }: { onClose: () => void }) {
  const [game, setGame] = useState<GameState>(INIT)
  const [myRole, setMyRole] = useState<'X' | 'O' | null>(null)
  const [playerCount, setPlayerCount] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel>

    supabase.auth.getUser().then(async ({ data }) => {
      const myId = data.user?.id ?? `guest-${Math.random().toString(36).slice(2, 8)}`

      ch = supabase.channel('ct-ttt-v1', { config: { presence: { key: myId } } })
      channelRef.current = ch

      ch
        .on('presence', { event: 'sync' }, () => {
          const state = ch.presenceState<{ role: 'X' | 'O' }>()
          const count = Object.keys(state).length
          setPlayerCount(count)
          const mine = state[myId]?.[0]
          if (mine?.role) setMyRole(mine.role)
        })
        .on('broadcast', { event: 'state' }, ({ payload }) => {
          setGame(payload as GameState)
        })
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') return
          // determine role before tracking
          const existing = ch.presenceState()
          const others = Object.keys(existing).filter(k => k !== myId)
          const role: 'X' | 'O' = others.length === 0 ? 'X' : 'O'
          setMyRole(role)
          await ch.track({ role })
        })
    })

    return () => { if (ch) supabase.removeChannel(ch) }
  }, [])

  const move = useCallback(async (i: number) => {
    if (!myRole || !channelRef.current) return
    if (game.board[i] || game.winner || game.turn !== myRole) return
    const board = [...game.board] as Board
    board[i] = myRole
    const winner = checkWinner(board)
    const next: GameState = { board, turn: myRole === 'X' ? 'O' : 'X', winner }
    setGame(next)
    await channelRef.current.send({ type: 'broadcast', event: 'state', payload: next })
  }, [myRole, game])

  const reset = useCallback(async () => {
    if (!channelRef.current) return
    setGame(INIT)
    await channelRef.current.send({ type: 'broadcast', event: 'state', payload: INIT })
  }, [])

  const waiting = playerCount < 2
  const myTurn = !!myRole && game.turn === myRole && !game.winner && !waiting

  return (
    <Portal>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,41,.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '28px 32px', width: 340, boxShadow: '0 24px 80px -20px rgba(15,23,41,.5)', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--faint)' }}>
            <XIcon size={15} />
          </button>

          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Крестики-нолики</div>
          <div style={{ fontSize: 13, color: 'var(--muted-ink)', marginBottom: 16 }}>
            {myRole
              ? <>Вы: <b style={{ color: myRole === 'X' ? X_COLOR : O_COLOR }}>{myRole === 'X' ? '✕ Крестики' : '○ Нолики'}</b></>
              : 'Наблюдатель'}
            {' · '}{playerCount}/2 игроков
          </div>

          <div style={{
            textAlign: 'center', marginBottom: 16, minHeight: 22, fontSize: 14, fontWeight: 600,
            color: game.winner === 'draw' ? 'var(--muted-ink)'
              : game.winner ? (game.winner === myRole ? '#16a34a' : '#dc2626')
              : myTurn ? X_COLOR : 'var(--faint)',
          }}>
            {waiting ? '⏳ Ожидание второго игрока...'
              : game.winner === 'draw' ? '🤝 Ничья!'
              : game.winner ? (game.winner === myRole ? '🎉 Вы победили!' : '😢 Вы проиграли')
              : myTurn ? '👆 Ваш ход'
              : `Ход ${game.turn === 'X' ? '✕' : '○'}`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {game.board.map((cell, i) => {
              const winLine = (game.winner && game.winner !== 'draw')
                ? LINES.find(([a, b, c]) => game.board[a] === game.winner && game.board[b] === game.winner && game.board[c] === game.winner)
                : null
              const isWin = !!winLine?.includes(i)
              return (
                <button key={i} onClick={() => move(i)} style={{
                  height: 76, borderRadius: 12,
                  border: `2px solid ${isWin ? (game.winner === 'X' ? X_COLOR : O_COLOR) : 'var(--line)'}`,
                  background: isWin ? (game.winner === 'X' ? '#eff4ff' : '#fff0f0') : (!cell && myTurn ? '#fafbfd' : '#fff'),
                  cursor: !cell && myTurn ? 'pointer' : 'default',
                  fontSize: 30, fontWeight: 700,
                  color: cell === 'X' ? X_COLOR : O_COLOR,
                  transition: 'all .12s',
                  display: 'grid', placeItems: 'center',
                  transform: isWin ? 'scale(1.05)' : 'scale(1)',
                }}>
                  {cell === 'X' ? '✕' : cell === 'O' ? '○' : ''}
                </button>
              )
            })}
          </div>

          {(game.winner || game.board.some(c => c)) && (
            <button onClick={reset} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RotateCcw size={15} /> Новая игра
            </button>
          )}
        </div>
      </div>
    </Portal>
  )
}
