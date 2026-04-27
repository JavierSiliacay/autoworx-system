import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Autoworx Repairs",
  description: "Learn about Autoworx Repairs - over 20 years of expert automotive service, certified technicians, and our commitment to quality and customer satisfaction.",
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
