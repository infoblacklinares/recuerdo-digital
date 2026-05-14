import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://recuerdo-digital.vercel.app'),
  title: 'Recuerdo Digital — Florería Angélica',
  description: 'Honra la memoria de tus seres queridos con un perfil digital eterno.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
