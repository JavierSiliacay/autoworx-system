"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  HardHat,
  ChevronRight,
  ArrowLeft,
  Info,
  Layers,
  Construction,
  ShoppingCart,
  Banknote,
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

interface UnderConstructionModuleProps {
  moduleName: "Account Receivables" | "Account Payables"
  type: "ar" | "ap"
}

export function UnderConstructionModule({ moduleName, type }: UnderConstructionModuleProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(true)

  const isAR = type === "ar"
  const title = isAR ? "ACCOUNT RECEIVABLES" : "ACCOUNT PAYABLES"
  const titleProper = isAR ? "Account Receivables" : "Account Payables"
  const subtitle = isAR ? "RECEIVABLES & SOA TRACKER" : "PAYABLES & VENDOR TRACKER"

  return (
    <div className="min-h-screen !bg-gray-50 !text-gray-900 font-sans p-6 flex flex-col justify-between">
      <div>
        {/* Header matching Purchasing, Expenses & Collection Monitoring */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b !border-gray-300 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium !text-gray-500 mb-1.5">
              <Link href="/admin/dashboard" className="hover:!text-gray-800 transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Accounting Works</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="!text-gray-900 font-semibold">{titleProper}</span>
            </div>

            <h2 className="text-sm font-semibold !text-gray-500 uppercase tracking-wider">
              {subtitle}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <h1 className="text-2xl md:text-3xl font-extrabold !text-gray-900 tracking-tight">
                {title}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <HardHat className="w-3.5 h-3.5 text-amber-700 animate-bounce" /> Under Construction
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="!bg-white !border-gray-300 !text-gray-700 hover:!bg-gray-100 gap-2 shadow-sm font-semibold text-xs"
            >
              <Info className="w-4 h-4 text-amber-600" /> Status Notice
            </Button>
          </div>
        </div>

        {/* Clean Standard Under Construction UI */}
        <div className="mt-8 flex flex-col items-center justify-center border-2 border-dashed !border-gray-300 rounded-2xl p-10 md:p-16 text-center space-y-5 max-w-3xl mx-auto !bg-white shadow-sm">
          {/* Construction Badge Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-inner">
            <Construction className="w-8 h-8 text-amber-600" />
          </div>

          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
              <HardHat className="w-3.5 h-3.5 text-amber-600" /> Under Construction
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight !text-gray-900">
              The developer is currently developing the {titleProper} module
            </h2>
            <p className="text-xs md:text-sm !text-gray-500 leading-relaxed">
              This module is currently being built and will be available once development and testing are completed.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="gap-2 text-xs !bg-white !border-gray-300 !text-gray-700 hover:!bg-gray-100 font-semibold"
            >
              <Info className="w-4 h-4 text-amber-600" /> View Notice
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/admin/purchasing")}
              className="gap-2 text-xs !bg-blue-600 hover:!bg-blue-700 !text-white font-semibold shadow-sm shadow-blue-500/20"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Purchasing Monitoring
            </Button>
          </div>
        </div>
      </div>

      {/* Standard Under Construction Popup Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md !bg-white !text-gray-900 border !border-gray-300 shadow-2xl">
          <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
              <Construction className="w-7 h-7 text-amber-600" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <HardHat className="w-3.5 h-3.5 text-amber-600" /> Under Construction
              </span>
              <DialogTitle className="text-xl font-extrabold !text-gray-900 pt-1">
                {titleProper}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs !text-gray-600 leading-relaxed px-3 text-center">
              The developer is currently developing the <strong>{titleProper}</strong> module. This section will be ready once development is finished.
            </DialogDescription>
          </DialogHeader>

          {/* Status Details Box */}
          <div className="!bg-gray-50 rounded-xl p-4 border !border-gray-200 space-y-3 my-1">
            <div className="flex items-center justify-between text-xs font-bold !text-gray-800 border-b !border-gray-200 pb-2">
              <div className="flex items-center gap-1.5">
                <Construction className="w-3.5 h-3.5 text-amber-600" />
                <span>System Status</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                In Progress
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Active Modules in Accounting Works:</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-xs font-medium">
                <Link
                  href="/admin/purchasing"
                  className="flex items-center justify-between p-2 rounded-lg !bg-white border !border-gray-200 hover:!border-blue-300 transition-all text-gray-700 group"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                    <span className="group-hover:text-blue-600 transition-colors">Purchasing Monitoring</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </Link>

                <Link
                  href="/admin/expenses"
                  className="flex items-center justify-between p-2 rounded-lg !bg-white border !border-gray-200 hover:!border-blue-300 transition-all text-gray-700 group"
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="group-hover:text-emerald-600 transition-colors">Expenses Monitoring</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </Link>

                <Link
                  href="/admin/collections"
                  className="flex items-center justify-between p-2 rounded-lg !bg-white border !border-gray-200 hover:!border-blue-300 transition-all text-gray-700 group"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-purple-600" />
                    <span className="group-hover:text-purple-600 transition-colors">Collection Monitoring</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs w-full sm:w-auto !bg-white !border-gray-300 !text-gray-700 hover:!bg-gray-100"
            >
              View Empty Workspace
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/admin/purchasing")}
              className="text-xs gap-1.5 w-full sm:w-auto !bg-blue-600 hover:!bg-blue-700 !text-white font-semibold shadow-sm shadow-blue-500/20"
            >
              <span>Go to Active Modules</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
