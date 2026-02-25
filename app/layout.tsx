import type { Metadata } from "next"
import { Providers } from "@/app/providers"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://www.autoworxcagayan.com"),
  title: "Autoworx Repairs - Vehicle Repair Management System",
  description: "Professional vehicle repair appointment booking and management system",
  icons: {
    icon: "/autoworxlogo.png",
    shortcut: "/autoworxlogo.png",
    apple: "/autoworxlogo.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Avoid build-time Google Fonts fetch (works offline/CI). */}
      <body className="font-sans">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
