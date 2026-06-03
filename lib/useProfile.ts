'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Profile } from './types'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      if (!user) { setLoading(false); return }

      const { data: existing } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (existing) {
        setProfile(existing)
      } else {
        // Создаём профиль при первом входе
        const colors = ['#2f6bdc', '#1f8a5b', '#e07a1a', '#9b5de5', '#e0325f']
        const color = colors[Math.floor(Math.random() * colors.length)]
        const newProfile: Profile = {
          id: user.id,
          email: user.email ?? '',
          name: user.email?.split('@')[0] ?? 'Пользователь',
          role: '',
          avatarColor: color,
          createdAt: new Date().toISOString(),
        }
        await supabase.from('profiles').insert(newProfile)
        setProfile(newProfile)
      }
      setLoading(false)
    })
  }, [])

  const updateProfile = async (updates: Partial<Pick<Profile, 'name' | 'role'>>) => {
    const { data: session } = await supabase.auth.getSession()
    const user = session.session?.user
    if (!user) return
    await supabase.from('profiles').update(updates).eq('id', user.id)
    setProfile(p => p ? { ...p, ...updates } : p)
  }

  return { profile, loading, updateProfile }
}
