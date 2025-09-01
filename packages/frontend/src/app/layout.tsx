import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import ReownProvider from '@/providers/ReownProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'THETA EuroCon NFT Registration',
  description: 'Register your NFTs for THETA EuroCon',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReownProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReownProvider>
      </body>
    </html>
  )
}
