import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MiniChatbot } from "@/components/ai/mini-chatbot"
import { PageAnimationWrapper } from "@/components/ui/page-animation-wrapper"
import MaintenancePage from "@/components/maintenance/maintenance-mode"
import { IS_MAINTENANCE_MODE } from "@/lib/maintenance-config"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (IS_MAINTENANCE_MODE) {
    return <MaintenancePage />
  }

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
