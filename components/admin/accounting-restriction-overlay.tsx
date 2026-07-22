"use client"

import React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { isAccountingOnly } from "@/lib/auth"
import { Lock, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function AccountingRestrictionOverlay({ moduleName, children }: { moduleName: string, children: React.ReactNode }) {
  const { data: session } = useSession()

  // Allow access if they are a full admin OR if they are accounting but trying to access Purchasing
  if (!isAccountingOnly(session?.user?.email) || moduleName === "Purchasing") {
    return <>{children}</>
  }

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        {/* Blurred Backdrop */}
        <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-md" />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 bg-white border border-slate-200 shadow-2xl rounded-2xl p-8 max-w-md text-center pointer-events-auto"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Access Restricted</h2>
          <p className="text-slate-600 leading-relaxed text-[15px] mb-6">
            The <strong>{moduleName}</strong> is intended for authorized emails only. 
            If you wish to have access to this, kindly please contact the developer or Sir Paul about this.
          </p>

          <Link href="/admin/expenses">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-md rounded-xl py-5 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Go back to Expenses Monitoring
            </Button>
          </Link>
        </motion.div>
      </div>

      <div className="opacity-40 select-none pointer-events-none" aria-hidden="true">
        {children}
      </div>
    </div>
  )
}
