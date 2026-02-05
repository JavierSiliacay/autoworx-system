import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: 'Autoworx Repairs | Reliable Auto Repairs You Can Trust',
  description: 'Professional automotive repair and diagnostics services. Engine, transmission, AC, electrical, body repairs, detailing, and 24/7 towing. Book your appointment today.',
  keywords: 'auto repair, car repair, mechanic, automotive service, engine repair, transmission, AC repair, car detailing, towing service',
  openGraph: {
    title: 'Autoworx Repairs | Reliable Auto Repairs You Can Trust',
    description: 'Professional automotive repair and diagnostics services. Book your appointment today.',
    type: 'website',
  },
  icons: {
    icon: '/autoworxlogo.png',
    apple: '/autoworxlogo.png',
  },
  generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: '#1a1a1f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oswald.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
