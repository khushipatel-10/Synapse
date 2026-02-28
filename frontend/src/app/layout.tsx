import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased min-h-screen bg-warm-cream text-muted-dark font-sans selection:bg-brand-teal selection:text-white flex flex-col">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
