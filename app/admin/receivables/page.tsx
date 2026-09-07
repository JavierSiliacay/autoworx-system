import { ReceivablesMonitoring } from "@/components/admin/receivables-monitoring"
import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions, isAccountingEmail } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Account Receivables | Autoworx Accounting",
  description: "Monitor and manage customer credit and uncollected account receivables.",
}

export default async function ReceivablesPage() {
  const session = await getServerSession(authOptions)

  if (!isAccountingEmail(session?.user?.email)) {
    redirect("/admin/dashboard")
  }

  return <ReceivablesMonitoring />
}
