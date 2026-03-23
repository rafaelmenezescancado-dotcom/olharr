import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OLHARR',
  description: 'Sistema de Gestão para Produtoras Audiovisuais',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
