import type { Metadata } from "next"
import { Providers } from "@/app/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Autoworx Repairs - Vehicle Repair Management System",
  description: "Professional vehicle repair appointment booking and management system",
  icons: {
    icon: "/autoworxlogo.png",
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
      </body>
    </html>
  )
}
