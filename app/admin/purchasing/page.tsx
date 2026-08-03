import { PurchasingMonitoring } from "@/components/admin/purchasing-monitoring"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions, isAccountingEmail } from "@/lib/auth"

export default async function PurchasingPage() {
  const session = await getServerSession(authOptions)

  if (!isAccountingEmail(session?.user?.email)) {
    redirect("/admin/dashboard")
  }

  return <PurchasingMonitoring />
}
