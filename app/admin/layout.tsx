import React from "react"
import type { Metadata } from "next"
import { WhatIsNewModal } from "@/components/admin/what-is-new-modal"

export const metadata: Metadata = {
  title: "Admin Panel | Autoworx Repairs",
  description: "Admin dashboard for managing appointment requests",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <WhatIsNewModal />
      {children}
    </>
  )
}
