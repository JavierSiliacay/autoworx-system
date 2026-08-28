import { UnderConstructionModule } from "@/components/admin/under-construction-module"
import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions, isAccountingEmail } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Account Receivables | Autoworx Accounting",
  description: "Customer credit terms, aging schedules, and statement of accounts.",
}

export default async function ReceivablesPage() {
  const session = await getServerSession(authOptions)

  if (!isAccountingEmail(session?.user?.email)) {
    redirect("/admin/dashboard")
  }

  return <UnderConstructionModule moduleName="Account Receivables" type="ar" />
}
