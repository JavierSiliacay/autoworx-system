import React from "react"
import type { Metadata } from "next"
import { WhatIsNewModal } from "@/components/admin/what-is-new-modal"
import { AppointmentNotificationListener } from "@/components/admin/appointment-notification-listener"
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper"

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
    <AdminLayoutWrapper>
      <WhatIsNewModal />
      <AppointmentNotificationListener />
      {children}
    </AdminLayoutWrapper>
  )
}
