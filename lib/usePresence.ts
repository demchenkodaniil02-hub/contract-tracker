'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

interface OnlineUser {
  id: string
  name: string
  email: string
  avatarColor: string
}

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    async function init() {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id
      if (!userId) return
      setCurrentUserId(userId)

      const ping = async () => {
        // Обновляем lastSeen через сервер
        await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }).catch(() => {})

        // Получаем список онлайн
        const res = await fetch('/api/presence').catch(() => null)
        if (!res?.ok) return
        const data = await res.json()
        setOnlineUsers(data.users ?? [])
      }

      await ping()
      interval = setInterval(ping, 30000)
    }

    init()
    return () => clearInterval(interval)
  }, [])

  return { onlineUsers, currentUserId }
}
