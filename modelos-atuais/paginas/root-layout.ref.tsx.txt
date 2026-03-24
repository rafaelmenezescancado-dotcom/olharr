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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
