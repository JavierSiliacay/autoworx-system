import React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MiniChatbot } from "@/components/ai/mini-chatbot"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="pt-[73px]">{children}</main>
      <Footer />
      <MiniChatbot />
    </>
  )
}
