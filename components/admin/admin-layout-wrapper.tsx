"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "./admin-sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showRefreshModal, setShowRefreshModal] = useState(false)
  const [initialTimestamp, setInitialTimestamp] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    // Fetch initial timestamp when wrapper loads
    fetch('/api/developer/global-refresh')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.timestamp) {
          setInitialTimestamp(data.timestamp)
        }
      })
      .catch(() => {})

    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (!initialTimestamp) return

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/developer/global-refresh')
        .then(res => res.json())
        .then(data => {
          if (data.timestamp && data.timestamp > initialTimestamp) {
            setShowRefreshModal(true)
          }
        })
        .catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [initialTimestamp])

  const handleRefresh = () => {
    window.location.reload()
  }

  // Do not render the sidebar on the admin login page
  if (pathname === "/admin") {
    return <>{children}</>
  }

  return (
    <>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar Component */}
        <AdminSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>

      <Dialog open={showRefreshModal} onOpenChange={setShowRefreshModal}>
        <DialogContent className="sm:max-w-md bg-slate-950 border border-indigo-500/30 text-white shadow-2xl shadow-indigo-500/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-indigo-400">
              <RefreshCw className="w-5 h-5 animate-[spin_3s_linear_infinite]" />
              System Update Available
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-3 text-base">
              There is a new system update published by the developer. Would you like to refresh your workspace to receive the latest features and fixes?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowRefreshModal(false)}
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Stay where I am
            </Button>
            <Button 
              onClick={handleRefresh}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Refresh System
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
