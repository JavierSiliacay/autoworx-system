import { PurchasingMonitoring } from "@/components/admin/purchasing-monitoring"
import { AccountingRestrictionOverlay } from "@/components/admin/accounting-restriction-overlay"

export default function PurchasingPage() {
  return (
    <AccountingRestrictionOverlay moduleName="Purchasing">
      <PurchasingMonitoring />
    </AccountingRestrictionOverlay>
  )
}
