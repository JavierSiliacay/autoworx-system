import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MiniChatbot } from "@/components/ai/mini-chatbot"
import { PageAnimationWrapper } from "@/components/ui/page-animation-wrapper"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="pt-[73px]">
        <PageAnimationWrapper>
          {children}
        </PageAnimationWrapper>
      </main>
      <Footer />
      <MiniChatbot />
    </>
  )
}
