'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Profile } from './types'

const COLORS = ['#2f6bdc', '#1f8a5b', '#e07a1a', '#9b5de5', '#e0325f']

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      if (!user) { setLoading(false); return }

      try {
        // Через сервер — обходит блокировку Supabase
        const res = await fetch(`/api/profile?userId=${user.id}`)
        const json = await res.json()

        if (json.profile) {
          setProfile(json.profile)
        } else {
          // Создаём профиль при первом входе
          const newProfile: Profile = {
            id: user.id,
            email: user.email ?? '',
            name: '',
            role: '',
            avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
            createdAt: new Date().toISOString(),
          }
          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, profile: newProfile }),
          })
          setProfile(newProfile)
        }
      } catch {
        // Fallback: создаём временный профиль из сессии
        setProfile({ id: user.id, email: user.email ?? '', name: '', role: '', avatarColor: COLORS[0], createdAt: '' })
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const updateProfile = async (updates: Partial<Pick<Profile, 'name' | 'role'>>) => {
    const { data: session } = await supabase.auth.getSession()
    const user = session.session?.user
    if (!user) return

    // Сразу обновляем локально
    setProfile(p => p ? { ...p, ...updates } : p)

    // Сохраняем через сервер
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, updates }),
    })
  }

  return { profile, loading, updateProfile }
}
