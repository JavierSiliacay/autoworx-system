import { UnderConstructionModule } from "@/components/admin/under-construction-module"
import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions, isAccountingEmail } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Account Payables | Autoworx Accounting",
  description: "Supplier obligations, bill matching, and disbursement schedules.",
}

export default async function PayablesPage() {
  const session = await getServerSession(authOptions)

  if (!isAccountingEmail(session?.user?.email)) {
    redirect("/admin/dashboard")
  }

  return <UnderConstructionModule moduleName="Account Payables" type="ap" />
}
