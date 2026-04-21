import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Synapse — AI-Powered Peer Learning',
  description: 'Find your ideal study partner through vector-based knowledge matching.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased min-h-screen font-sans flex flex-col" style={{ background: '#F9F7F7', color: '#112D4E' }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
