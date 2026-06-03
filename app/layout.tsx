import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { FirstLoginModal } from '@/components/layout/FirstLoginModal'

const ibmPlexSans = IBM_Plex_Sans({ variable: '--font-ibm-plex-sans', subsets: ['latin', 'cyrillic'], weight: ['400', '500', '600', '700'] })
const ibmPlexMono = IBM_Plex_Mono({ variable: '--font-ibm-plex-mono', subsets: ['latin', 'cyrillic'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'КонтрактТрекер',
  description: 'Управление заказами и контрактами',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body style={{ margin: 0 }}>
        <AuthGuard>
          <FirstLoginModal />
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', height: '100vh' }}>{children}</main>
          </div>
        </AuthGuard>
      </body>
    </html>
  )
}
