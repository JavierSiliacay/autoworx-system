"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "./admin-sidebar"

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Do not render the sidebar on the admin login page
  if (pathname === "/admin") {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Component */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
