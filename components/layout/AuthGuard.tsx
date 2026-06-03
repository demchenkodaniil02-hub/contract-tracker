'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  const isPublic = pathname === '/login' || pathname === '/reset-password'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session && !isPublic) {
        router.replace('/login')
      } else {
        setChecked(true)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && !isPublic) {
        router.replace('/login')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [pathname])

  if (!checked && !isPublic) return null

  return <>{children}</>
}
