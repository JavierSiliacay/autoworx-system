import { ExpensesMonitoring } from "@/components/admin/expenses-monitoring"
import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isAccountingEmail } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Expenses Monitoring | Autoworx",
  description: "Monitor and manage shop expenses.",
}

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions)

  if (!isAccountingEmail(session?.user?.email)) {
    redirect("/admin/dashboard")
  }

  return <ExpensesMonitoring />
}
