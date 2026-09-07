"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Search, Plus, RefreshCw, Printer, Trash2, Edit, CheckCircle2,
  RotateCcw, Clock, CheckCircle, AlertCircle, FileText, ArrowUpDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export interface Receivable {
  id: string
  created_at: string
  date?: string | null
  client_name: string
  amount: number
  status: "PENDING" | "PAID"
  paid_at?: string | null
  remarks?: string | null
  created_by?: string
}

const formatAmountWithCommas = (input: string | number) => {
  if (input === undefined || input === null || input === "") return ""
  let val = input.toString().replace(/[^0-9.]/g, "")
  if (val === "") return ""
  const parts = val.split(".")
  if (parts.length > 2) {
    val = parts[0] + "." + parts.slice(1).join("")
  }
  const integerPart = parts[0]
  let decimalPart = parts[1]
  if (decimalPart !== undefined) {
    decimalPart = decimalPart.slice(0, 2)
  }
  const formattedInt = integerPart ? parseInt(integerPart, 10).toLocaleString("en-US") : ""
  return decimalPart !== undefined ? (formattedInt || "0") + "." + decimalPart : formattedInt
}

export function ReceivablesMonitoring() {
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "PAID">("all")
  const { toast } = useToast()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null)
  const [receivableToDelete, setReceivableToDelete] = useState<string | null>(null)
  const [receivableToPay, setReceivableToPay] = useState<Receivable | null>(null)
  const [receivableToUndo, setReceivableToUndo] = useState<Receivable | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Form State (Purely client_name, amount, and optional remarks)
  const [formData, setFormData] = useState({
    client_name: "",
    amount: "",
    remarks: ""
  })

  const fetchReceivables = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/receivables")
      if (!res.ok) throw new Error("Failed to load receivables")
      const data = await res.json()
      setReceivables(data)
    } catch (err: any) {
      console.error("Fetch receivables error:", err)
      toast({ title: "Error", description: "Failed to load receivables records.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReceivables()
  }, [])

  const filteredReceivables = useMemo(() => {
    let result = receivables

    if (searchQuery.trim()) {
      const tokens = searchQuery.toLowerCase().trim().split(/\s+/)
      result = result.filter(r => {
        const text = [
          r.client_name,
          r.remarks,
          r.amount?.toString(),
          r.status
        ].filter(Boolean).join(" ").toLowerCase()
        return tokens.every(token => text.includes(token))
      })
    }

    if (statusFilter !== "all") {
      result = result.filter(r => r.status === statusFilter)
    }

    return result
  }, [receivables, searchQuery, statusFilter])

  // Metric Computations
  const totalReceivables = useMemo(() => {
    return filteredReceivables.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  }, [filteredReceivables])

  const totalPending = useMemo(() => {
    return filteredReceivables
      .filter(r => r.status === "PENDING")
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  }, [filteredReceivables])

  const totalPaid = useMemo(() => {
    return filteredReceivables
      .filter(r => r.status === "PAID")
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  }, [filteredReceivables])

  const pendingCount = useMemo(() => {
    return filteredReceivables.filter(r => r.status === "PENDING").length
  }, [filteredReceivables])

  const openModal = (recordToEdit?: Receivable) => {
    if (recordToEdit) {
      setEditingReceivable(recordToEdit)
      setFormData({
        client_name: recordToEdit.client_name,
        amount: recordToEdit.amount !== undefined && recordToEdit.amount !== null
          ? formatAmountWithCommas(recordToEdit.amount.toString())
          : "",
        remarks: recordToEdit.remarks || ""
      })
    } else {
      setEditingReceivable(null)
      setFormData({
        client_name: "",
        amount: "",
        remarks: ""
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.client_name.trim()) {
      toast({ title: "Validation Error", description: "Please enter the client name.", variant: "destructive" })
      return
    }

    const rawAmount = parseFloat(formData.amount.replace(/,/g, ""))
    if (isNaN(rawAmount) || rawAmount <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid amount.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const isEdit = !!editingReceivable
      const method = isEdit ? "PUT" : "POST"
      const payload = {
        ...(isEdit && { id: editingReceivable.id }),
        client_name: formData.client_name.trim().toUpperCase(),
        amount: rawAmount,
        remarks: formData.remarks.trim() || null
      }

      const res = await fetch("/api/receivables", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || "Failed to save receivable")
      }

      const savedData = await res.json()

      if (isEdit) {
        setReceivables(prev => prev.map(r => r.id === savedData.id ? savedData : r))
      } else {
        setReceivables(prev => [savedData, ...prev])
      }

      toast({ title: "Success", description: `Receivable ${isEdit ? "updated" : "added"} successfully.` })
      setIsModalOpen(false)
      fetchReceivables()
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to save receivable.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (record: Receivable) => {
    const newStatus = record.status === "PENDING" ? "PAID" : "PENDING"
    try {
      const res = await fetch("/api/receivables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          status: newStatus,
          paid_at: newStatus === "PAID" ? new Date().toISOString() : null
        })
      })

      if (!res.ok) throw new Error("Failed to update status")

      const updated = await res.json()
      setReceivables(prev => prev.map(r => r.id === updated.id ? updated : r))
      toast({
        title: newStatus === "PAID" ? "Marked as Paid" : "Reverted to Pending",
        description: `${record.client_name} is now marked as ${newStatus}.`
      })
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/receivables?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Success", description: "Receivable deleted." })
        setReceivableToDelete(null)
        fetchReceivables()
      } else {
        toast({ title: "Error", description: "Failed to delete receivable.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" })
    }
  }

  return (
    // FORCED LIGHT MODE WRAPPER (Matching Collections & Expenses Exactly)
    <div className="min-h-screen print:min-h-0 print:h-auto print:block !bg-gray-50 !text-gray-900 font-sans p-6 print:p-0 print:!bg-white">

      {/* Watermark only visible in print */}
      <div className="hidden print:flex fixed inset-0 pointer-events-none items-center justify-center z-0">
        <img src="/autoworxlogo.png" alt="Autoworx Watermark" className="w-[420px] max-w-[60%] object-contain opacity-[0.05] mix-blend-multiply" />
      </div>

      <style>{`
        @media print {
          @page {
            margin: 8mm 10mm;
            size: portrait;
          }
          html, body, #__next, body > div, main {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-page-wrap {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 92vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          table {
            page-break-inside: auto;
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          th, td {
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>

      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b !border-gray-300 pb-4 print:hidden relative z-10">
        <div>
          <h2 className="text-sm font-semibold !text-gray-500 uppercase tracking-wider">
            ACCOUNTING WORKS
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-extrabold !text-gray-900 tracking-tight">ACCOUNT RECEIVABLES</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Monitoring & Collections
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <Button onClick={fetchReceivables} variant="outline" size="icon" className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100" title="Refresh data">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100 font-medium">
            <Printer className="h-4 w-4 mr-2" /> Print Report
          </Button>
          <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Receivable
          </Button>
        </div>
      </div>

      {/* Metric Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:hidden">
        {/* Total Outstanding / Pending */}
        <div className="!bg-white p-4 rounded-xl border !border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending / Uncollected</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600">
              ₱{totalPending.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {pendingCount} unpaid account{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Total Collected / Paid */}
        <div className="!bg-white p-4 rounded-xl border !border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Collected</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              ₱{totalPaid.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {filteredReceivables.filter(r => r.status === "PAID").length} cleared payment{filteredReceivables.filter(r => r.status === "PAID").length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Total Receivables */}
        <div className="!bg-white p-4 rounded-xl border !border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Receivables</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-700">
              ₱{totalReceivables.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Overall receivables amount
            </p>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="!bg-white p-4 rounded-xl border !border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Collection Rate</span>
            <span className="p-1.5 bg-gray-100 text-gray-600 rounded-lg">
              <ArrowUpDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-gray-800">
              {totalReceivables > 0 ? ((totalPaid / totalReceivables) * 100).toFixed(1) : 0}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${totalReceivables > 0 ? Math.min(100, (totalPaid / totalReceivables) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section (Clean Search & Status only) */}
      <div className="!bg-white p-4 rounded-xl shadow-sm border !border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden relative z-10">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search client name, amount, or remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 !bg-white !border-gray-300 focus-visible:ring-blue-500 !text-gray-900 placeholder:!text-gray-500 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-[170px] !bg-white !border-gray-300 !text-gray-900">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="!bg-white !border-gray-200">
              <SelectItem value="all" className="!text-gray-900 cursor-pointer hover:bg-gray-100">All Statuses</SelectItem>
              <SelectItem value="PENDING" className="!text-gray-900 cursor-pointer hover:bg-gray-100">🟡 Pending Only</SelectItem>
              <SelectItem value="PAID" className="!text-gray-900 cursor-pointer hover:bg-gray-100">🟢 Paid Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Printable Page Wrapper (Ensures proper top-to-bottom layout in print) */}
      <div className="print-page-wrap relative z-10">
        <div>
          {/* Printable Header (Visible only in Print) */}
          <div className="hidden print:block mb-4 border-b-2 border-black pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-black">
                  AUTOWORX REPAIR & DETAILS
                </h1>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-800 mt-0.5">
                  ACCOUNT RECEIVABLES MONITORING REPORT
                </h2>
                <p className="text-xs font-semibold text-gray-700 mt-1">
                  AS OF: <span className="text-blue-900 font-bold">{format(new Date(), "MMMM d, yyyy")}</span>
                  {statusFilter !== "all" && (
                    <span className="ml-2 px-2 py-0.5 text-[10px] bg-gray-100 border border-gray-400 rounded uppercase font-bold text-gray-800">
                      Status Filter: {statusFilter} Only
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right text-xs text-gray-700">
                <p className="font-bold text-black text-sm">Autoworx Repair & General Mdse.</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Date Printed: {format(new Date(), "PPpp")}</p>
              </div>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="!bg-white rounded-xl shadow-sm border !border-gray-200 overflow-hidden relative z-10 print:border-none print:shadow-none print:rounded-none">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-xs text-left border-collapse border !border-gray-300 print:!border-gray-400 print:text-[11px] print:[&_th]:border print:[&_th]:!border-gray-400 print:[&_td]:border print:[&_td]:!border-gray-300">
                <thead>
                  <tr className="!bg-gray-100/90 !text-gray-700 font-bold border-b-2 !border-gray-300 print:!border-gray-400 select-none uppercase tracking-wider text-[10px] print:text-[10px] print:!bg-gray-100" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    <th className="py-3 px-3 w-12 text-center print:w-10">#</th>
                    <th className="py-3 px-4 print:py-2">Client Name</th>
                    <th className="py-3 px-4 text-right w-40 print:w-36 print:py-2">Amount</th>
                    <th className="py-3 px-3 text-center w-32 print:w-28 print:py-2">Status</th>
                    <th className="py-3 px-4 print:py-2">Remarks</th>
                    <th className="py-3 px-3 text-center w-36 print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y !divide-gray-200 print:divide-gray-300">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                        Loading account receivables...
                      </td>
                    </tr>
                  ) : filteredReceivables.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 print:py-8">
                        <span className="print:hidden">
                          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          No receivables found. Click <strong>&quot;Add Receivable&quot;</strong> to record one.
                        </span>
                        <span className="hidden print:inline text-xs italic font-medium text-gray-600">
                          No account receivables records found as of this date.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredReceivables.map((item, idx) => {
                      const isPaid = item.status === "PAID"
                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            "hover:bg-gray-50/80 transition-colors",
                            isPaid ? "bg-emerald-50/20 print:bg-white" : ""
                          )}
                        >
                          <td className="py-2.5 px-3 text-center text-gray-500 font-mono text-[10px] print:py-1.5">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-gray-900 text-sm print:text-xs print:py-1.5 uppercase">
                            {item.client_name}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900 text-sm print:text-xs print:py-1.5">
                            ₱{Number(item.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center print:py-1.5">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 print:border-emerald-500 print:bg-emerald-50 print:text-emerald-900">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 print:hidden" /> PAID
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 print:border-amber-500 print:bg-amber-50 print:text-amber-900">
                                <Clock className="w-3 h-3 text-amber-600 print:hidden" /> PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-gray-600 italic text-[11px] print:py-1.5 print:text-[10px]">
                            {item.remarks || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1-Click Status Toggle */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (isPaid) {
                                    setReceivableToUndo(item)
                                  } else {
                                    setReceivableToPay(item)
                                  }
                                }}
                                className={cn(
                                  "h-7 px-2 text-[11px] font-bold rounded-md transition-all gap-1",
                                  isPaid
                                    ? "text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                                    : "text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 bg-emerald-50"
                                )}
                                title={isPaid ? "Undo to Pending" : "Mark as Paid"}
                              >
                                {isPaid ? (
                                  <>
                                    <RotateCcw className="w-3 h-3" /> Undo
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" /> Mark Paid
                                  </>
                                )}
                              </Button>

                              {/* Edit Button */}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openModal(item)}
                                className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>

                              {/* Delete Button */}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setReceivableToDelete(item.id)}
                                className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {filteredReceivables.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100/90 font-bold border-t-2 !border-gray-300 print:!border-gray-500 text-gray-900 print:!bg-gray-100" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                      <td colSpan={2} className="py-3 px-4 text-right uppercase text-[11px] tracking-wider print:py-2">
                        Total:
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700 print:text-black print:py-2">
                        ₱{totalReceivables.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-gray-700 text-[11px] print:py-2">
                        <span className="text-amber-800 font-bold">
                          Pending: ₱{totalPending.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="text-emerald-800 font-bold">
                          Paid: ₱{totalPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Print Signature Section (Print Only, pushed to bottom of page) */}
        <div className="hidden print:grid grid-cols-2 gap-16 mt-auto pt-10 text-xs font-bold text-gray-800">
          <div>
            <p className="mb-10 uppercase tracking-wider text-[11px] text-gray-600">PREPARED BY:</p>
            <div className="w-60 border-b-2 border-black"></div>
            <p className="font-extrabold text-xs text-black mt-1.5 uppercase tracking-wide">Accounting / Cashier</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="mb-10 uppercase tracking-wider text-[11px] text-gray-600">NOTED / APPROVED BY:</p>
            <div className="w-60 border-b-2 border-black"></div>
            <p className="font-extrabold text-xs text-black mt-1.5 uppercase tracking-wide">General Manager / Sir Paul</p>
          </div>
        </div>
      </div>

      {/* Add / Edit Receivable Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md !bg-white !text-gray-900 border !border-gray-300 shadow-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="space-y-1.5 pb-2 border-b !border-gray-200">
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {editingReceivable ? "Edit Receivable" : "Add Receivable"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Input the client name and amount for this account receivable.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Client Name Field */}
              <div className="space-y-1.5">
                <Label htmlFor="client_name" className="text-xs font-semibold text-gray-700">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client_name"
                  placeholder="e.g. Standard Insurance, Pioneer, Juan Dela Cruz"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="!bg-white !border-gray-300 !text-gray-900 text-sm"
                  autoFocus
                  required
                />
              </div>

              {/* Amount Field */}
              <div className="space-y-1.5">
                <Label htmlFor="rec_amount" className="text-xs font-semibold text-gray-700">
                  Amount (PHP) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                    ₱
                  </span>
                  <Input
                    id="rec_amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => {
                      const formatted = formatAmountWithCommas(e.target.value)
                      setFormData({ ...formData, amount: formatted })
                    }}
                    className="pl-8 !bg-white !border-gray-300 !text-gray-900 text-sm font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Remarks Field (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="rec_remarks" className="text-xs font-semibold text-gray-700">
                  Remarks / Notes <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="rec_remarks"
                  placeholder="Optional notes, plate number, LOA #, or check details..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="!bg-white !border-gray-300 !text-gray-900 text-sm min-h-[60px] resize-none"
                />
              </div>
            </div>

            <DialogFooter className="border-t !border-gray-200 pt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isSubmitting ? "Saving..." : editingReceivable ? "Save Changes" : "Add Receivable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Confirmation Dialog */}
      <Dialog open={!!receivableToPay} onOpenChange={(open) => !open && setReceivableToPay(null)}>
        <DialogContent className="sm:max-w-md !bg-white !text-gray-900 border !border-gray-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirm Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 pt-1">
              Are you sure you want to mark this account receivable as <strong>PAID</strong>?
            </DialogDescription>
          </DialogHeader>

          {receivableToPay && (
            <div className="my-2 p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Client Name:</span>
                <span className="font-bold text-gray-900 text-sm">{receivableToPay.client_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Amount:</span>
                <span className="font-mono font-black text-emerald-700 text-base">
                  ₱{Number(receivableToPay.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {receivableToPay.remarks && (
                <div className="flex justify-between items-start pt-1.5 border-t border-gray-200">
                  <span className="text-gray-500 font-semibold uppercase text-[10px]">Remarks:</span>
                  <span className="text-gray-700 italic max-w-[240px] text-right">{receivableToPay.remarks}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceivableToPay(null)}
              className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100"
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              disabled={isUpdatingStatus}
              onClick={async () => {
                if (!receivableToPay) return
                setIsUpdatingStatus(true)
                try {
                  await toggleStatus(receivableToPay)
                  setReceivableToPay(null)
                } finally {
                  setIsUpdatingStatus(false)
                }
              }}
            >
              {isUpdatingStatus ? "Updating..." : "Yes, Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo to Pending Confirmation Dialog */}
      <Dialog open={!!receivableToUndo} onOpenChange={(open) => !open && setReceivableToUndo(null)}>
        <DialogContent className="sm:max-w-md !bg-white !text-gray-900 border !border-gray-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-amber-700 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Revert Payment to Pending
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 pt-1">
              Are you sure you want to revert this receivable from <strong>PAID</strong> back to <strong>PENDING</strong>?
            </DialogDescription>
          </DialogHeader>

          {receivableToUndo && (
            <div className="my-2 p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Client Name:</span>
                <span className="font-bold text-gray-900 text-sm">{receivableToUndo.client_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Amount:</span>
                <span className="font-mono font-black text-amber-700 text-base">
                  ₱{Number(receivableToUndo.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {receivableToUndo.remarks && (
                <div className="flex justify-between items-start pt-1.5 border-t border-gray-200">
                  <span className="text-gray-500 font-semibold uppercase text-[10px]">Remarks:</span>
                  <span className="text-gray-700 italic max-w-[240px] text-right">{receivableToUndo.remarks}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceivableToUndo(null)}
              className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100"
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
              disabled={isUpdatingStatus}
              onClick={async () => {
                if (!receivableToUndo) return
                setIsUpdatingStatus(true)
                try {
                  await toggleStatus(receivableToUndo)
                  setReceivableToUndo(null)
                } finally {
                  setIsUpdatingStatus(false)
                }
              }}
            >
              {isUpdatingStatus ? "Updating..." : "Yes, Revert to Pending"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!receivableToDelete} onOpenChange={(open) => !open && setReceivableToDelete(null)}>
        <DialogContent className="sm:max-w-sm !bg-white !text-gray-900 border !border-gray-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Receivable
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 pt-2">
              Are you sure you want to delete this receivable record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setReceivableToDelete(null)}
              className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => receivableToDelete && handleDelete(receivableToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
