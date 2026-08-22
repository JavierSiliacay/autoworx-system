import { CollectionsMonitoring } from "@/components/admin/collections-monitoring"

export const metadata = {
  title: "Collection Monitoring | Autoworx",
  description: "Monitor and manage shop collections.",
}

export default async function CollectionsPage() {
  return <CollectionsMonitoring />
}
