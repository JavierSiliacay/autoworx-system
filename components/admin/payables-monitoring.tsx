"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Search, Plus, RefreshCw, Printer, Trash2, Edit, CheckCircle2,
  RotateCcw, Clock, CheckCircle, AlertCircle, FileText, ArrowUpDown,
  AlertTriangle, CreditCard, Calendar as CalendarIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, addDays } from "date-fns"
import { cn } from "@/lib/utils"

export interface Payable {
  id: string
  created_at: string
  date: string
  supplier_name: string
  amount: number
  check_number?: string | null
  pdc_term?: string | null
  pdc_date?: string | null
  status: "PENDING" | "PAID"
  paid_at?: string | null
  remarks?: string | null
  created_by?: string
}

export const PDC_TERM_PRESETS = [
  { label: "No PDC", value: "none", days: 0 },
  { label: "PDC 15 days", value: "PDC 15 days", days: 15 },
  { label: "PDC 30 days", value: "PDC 30 days", days: 30 },
  { label: "PDC 45 days", value: "PDC 45 days", days: 45 },
  { label: "PDC 60 days", value: "PDC 60 days", days: 60 },
  { label: "PDC 90 days", value: "PDC 90 days", days: 90 },
  { label: "PDC 120 days", value: "PDC 120 days", days: 120 },
  { label: "Custom", value: "custom", days: 0 },
]

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

function getPdcDueInfo(pdcDateStr?: string | null, status?: string) {
  if (!pdcDateStr || status === "PAID") return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const pdcDate = new Date(pdcDateStr)
  pdcDate.setHours(0, 0, 0, 0)

  const diffTime = pdcDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      status: "overdue",
      label: `Overdue by ${Math.abs(diffDays)}d`,
      days: diffDays,
      badgeClass: "bg-red-100 text-red-800 border-red-300 font-bold"
    }
  } else if (diffDays === 0) {
    return {
      status: "due_today",
      label: "Due Today!",
      days: 0,
      badgeClass: "bg-amber-500 text-white border-amber-600 font-black animate-pulse"
    }
  } else if (diffDays <= 14) {
    return {
      status: "due_soon",
      label: `Due in ${diffDays}d`,
      days: diffDays,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold"
    }
  } else {
    return {
      status: "future",
      label: `In ${diffDays}d`,
      days: diffDays,
      badgeClass: "bg-gray-100 text-gray-700 border-gray-200"
    }
  }
}

export function PayablesMonitoring() {
  const [payables, setPayables] = useState<Payable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "PAID" | "due_soon">("all")
  const { toast } = useToast()

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null)
  const [payableToDelete, setPayableToDelete] = useState<string | null>(null)
  const [payableToPay, setPayableToPay] = useState<Payable | null>(null)
  const [payableToUndo, setPayableToUndo] = useState<Payable | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    supplier_name: "",
    amount: "",
    check_number: "",
    pdc_term: "",
    pdc_date: "",
    remarks: ""
  })
  const [pdcPreset, setPdcPreset] = useState<string>("none")
  const [customDays, setCustomDays] = useState<string>("")

  const handleCustomDaysChange = (val: string) => {
    setCustomDays(val)
    const daysNum = parseInt(val, 10)
    if (!val || isNaN(daysNum) || daysNum <= 0) {
      setFormData(prev => ({
        ...prev,
        pdc_term: val ? `PDC ${val} days` : "",
        pdc_date: ""
      }))
      return
    }

    const baseDateStr = formData.date || format(new Date(), "yyyy-MM-dd")
    let computedDate = ""
    try {
      computedDate = format(addDays(parseISO(baseDateStr), daysNum), "yyyy-MM-dd")
    } catch {
      computedDate = ""
    }

    setFormData(prev => ({
      ...prev,
      pdc_term: `PDC ${daysNum} days`,
      pdc_date: computedDate || ""
    }))
  }

  const handleTermSelect = (presetVal: string, baseDateStr?: string) => {
    setPdcPreset(presetVal)
    const effectiveDateStr = baseDateStr || formData.date || format(new Date(), "yyyy-MM-dd")

    if (presetVal === "none") {
      setFormData(prev => ({ ...prev, pdc_term: "", pdc_date: "" }))
      setCustomDays("")
      return
    }

    if (presetVal === "custom") {
      const daysNum = parseInt(customDays, 10)
      if (daysNum > 0) {
        let computedDate = ""
        try {
          computedDate = format(addDays(parseISO(effectiveDateStr), daysNum), "yyyy-MM-dd")
        } catch {
          computedDate = ""
        }
        setFormData(prev => ({
          ...prev,
          pdc_term: `PDC ${daysNum} days`,
          pdc_date: computedDate || ""
        }))
      } else {
        setFormData(prev => ({ ...prev, pdc_term: "", pdc_date: "" }))
      }
      return
    }

    // Standard preset like "PDC 60 days"
    const match = presetVal.match(/(\d+)/)
    const days = match ? parseInt(match[1], 10) : 0
    let computedDate = ""
    try {
      const calculated = addDays(parseISO(effectiveDateStr), days)
      computedDate = format(calculated, "yyyy-MM-dd")
    } catch (e) {
      console.error("Error calculating PDC date:", e)
    }

    setFormData(prev => ({
      ...prev,
      pdc_term: presetVal,
      pdc_date: computedDate
    }))
  }

  const handleTransactionDateChange = (newDateStr: string) => {
    let newPdcDate = formData.pdc_date
    let days = 0
    if (pdcPreset === "custom") {
      days = parseInt(customDays, 10) || 0
    } else if (pdcPreset !== "none") {
      const match = pdcPreset.match(/(\d+)/)
      days = match ? parseInt(match[1], 10) : 0
    }

    if (days > 0) {
      try {
        newPdcDate = format(addDays(parseISO(newDateStr), days), "yyyy-MM-dd")
      } catch {
        // ignore
      }
    }

    setFormData(prev => ({
      ...prev,
      date: newDateStr,
      pdc_date: newPdcDate
    }))
  }

  const fetchPayables = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/payables")
      if (!res.ok) throw new Error("Failed to load payables")
      const data = await res.json()
      setPayables(data)
    } catch (err: any) {
      console.error("Fetch payables error:", err)
      toast({ title: "Error", description: "Failed to load payables records.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayables()
  }, [])

  const filteredPayables = useMemo(() => {
    let result = payables

    if (searchQuery.trim()) {
      const trimmedQuery = searchQuery.trim().toLowerCase()
      const queryNoSpaces = trimmedQuery.replace(/[\s\-_,.]+/g, "")
      const tokens = trimmedQuery.split(/\s+/).filter(Boolean)

      result = result.filter(p => {
        const pdcInfo = getPdcDueInfo(p.pdc_date, p.status)
        const amountNum = Number(p.amount) || 0
        const formattedAmount = amountNum.toLocaleString("en-PH", { minimumFractionDigits: 2 })
        const rawAmountStr = p.amount !== undefined && p.amount !== null ? p.amount.toString() : ""

        // Collect all searchable strings for this record
        const searchableFields = [
          p.supplier_name,
          p.check_number,
          p.pdc_term,
          p.remarks,
          p.status,
          p.date,
          p.pdc_date,
          rawAmountStr,
          formattedAmount,
          rawAmountStr.replace(/,/g, ""),
          pdcInfo?.label || "",
          pdcInfo?.status || "",
          p.status === "PAID" ? "paid cleared" : "pending unpaid"
        ].filter(Boolean)

        const searchableText = searchableFields.join(" ").toLowerCase()
        const searchableNoSpaces = searchableText.replace(/[\s\-_,.]+/g, "")

        // 1. Direct match when ignoring all spaces & common punctuation (e.g. "bdo778901" matches "BDO-778901", "trij" matches "TRI-J")
        if (queryNoSpaces && searchableNoSpaces.includes(queryNoSpaces)) {
          return true
        }

        // 2. Tokenized multi-word search (every keyword token must match, space & symbol insensitive)
        return tokens.every(token => {
          const tokenClean = token.trim()
          if (!tokenClean) return true
          const tokenNoSpace = tokenClean.replace(/[\s\-_,.]+/g, "")

          // Exact token match in full string
          if (searchableText.includes(tokenClean)) {
            return true
          }

          // Normalized token match (handles "tri j" matching "TRI-J", "pdc 60" matching "PDC 60 days", etc.)
          if (tokenNoSpace && searchableNoSpaces.includes(tokenNoSpace)) {
            return true
          }

          return false
        })
      })
    }

    if (statusFilter === "due_soon") {
      result = result.filter(p => {
        if (p.status !== "PENDING" || !p.pdc_date) return false
        const info = getPdcDueInfo(p.pdc_date, p.status)
        return info && (info.days <= 14)
      })
    } else if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter)
    }

    return result
  }, [payables, searchQuery, statusFilter])

  // Metric Computations
  const totalPayables = useMemo(() => {
    return payables.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [payables])

  const totalPending = useMemo(() => {
    return payables
      .filter(p => p.status === "PENDING")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [payables])

  const pendingCount = useMemo(() => {
    return payables.filter(p => p.status === "PENDING").length
  }, [payables])

  const totalPaid = useMemo(() => {
    return payables
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [payables])

  const maturingSoonPayables = useMemo(() => {
    return payables.filter(p => {
      if (p.status !== "PENDING" || !p.pdc_date) return false
      const info = getPdcDueInfo(p.pdc_date, p.status)
      return info && (info.days <= 14)
    })
  }, [payables])

  const maturingSoonAmount = useMemo(() => {
    return maturingSoonPayables.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [maturingSoonPayables])

  const openModal = (recordToEdit?: Payable) => {
    if (recordToEdit) {
      setEditingPayable(recordToEdit)
      const term = recordToEdit.pdc_term || ""
      setFormData({
        date: recordToEdit.date || format(new Date(), "yyyy-MM-dd"),
        supplier_name: recordToEdit.supplier_name,
        amount: recordToEdit.amount !== undefined && recordToEdit.amount !== null
          ? formatAmountWithCommas(recordToEdit.amount.toString())
          : "",
        check_number: recordToEdit.check_number || "",
        pdc_term: term,
        pdc_date: recordToEdit.pdc_date || "",
        remarks: recordToEdit.remarks || ""
      })

      if (!term && !recordToEdit.pdc_date) {
        setPdcPreset("none")
        setCustomDays("")
      } else if (PDC_TERM_PRESETS.some(p => p.value === term)) {
        setPdcPreset(term)
        setCustomDays("")
      } else {
        setPdcPreset("custom")
        const match = term.match(/(\d+)/)
        setCustomDays(match ? match[1] : "")
      }
    } else {
      setEditingPayable(null)
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        supplier_name: "",
        amount: "",
        check_number: "",
        pdc_term: "",
        pdc_date: "",
        remarks: ""
      })
      setPdcPreset("none")
      setCustomDays("")
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.supplier_name.trim()) {
      toast({ title: "Validation Error", description: "Please enter the supplier name.", variant: "destructive" })
      return
    }

    const rawAmount = parseFloat(formData.amount.replace(/,/g, ""))
    if (isNaN(rawAmount) || rawAmount <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid amount.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const isEdit = !!editingPayable
      const method = isEdit ? "PUT" : "POST"
      const payload = {
        ...(isEdit && { id: editingPayable.id }),
        date: formData.date || new Date().toISOString().split("T")[0],
        supplier_name: formData.supplier_name.trim().toUpperCase(),
        amount: rawAmount,
        check_number: formData.check_number.trim() || null,
        pdc_term: formData.pdc_term?.trim() || null,
        pdc_date: formData.pdc_date || null,
        remarks: formData.remarks.trim() || null
      }

      const res = await fetch("/api/payables", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || "Failed to save payable")
      }

      const savedData = await res.json()

      if (isEdit) {
        setPayables(prev => prev.map(p => p.id === savedData.id ? savedData : p))
      } else {
        setPayables(prev => [savedData, ...prev])
      }

      toast({ title: "Success", description: `Payable record ${isEdit ? "updated" : "added"} successfully.` })
      setIsModalOpen(false)
      fetchPayables()
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to save payable.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (record: Payable) => {
    const newStatus = record.status === "PENDING" ? "PAID" : "PENDING"
    try {
      const res = await fetch("/api/payables", {
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
      setPayables(prev => prev.map(p => p.id === updated.id ? updated : p))
      toast({
        title: newStatus === "PAID" ? "Marked as Paid" : "Reverted to Pending",
        description: `${record.supplier_name} is now marked as ${newStatus}.`
      })
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/payables?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Success", description: "Payable record deleted." })
        setPayableToDelete(null)
        fetchPayables()
      } else {
        toast({ title: "Error", description: "Failed to delete payable.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" })
    }
  }

  return (
    // FORCED LIGHT MODE WRAPPER (Matching Accounting Works Theme)
    <div className="min-h-screen print:min-h-0 print:h-auto print:block !bg-gray-50 !text-gray-900 font-sans p-6 print:p-0 print:!bg-white">

      {/* Watermark overlay - Repeating on EVERY print page */}
      <div className="hidden print:flex print-watermark">
        <img src="/autoworxlogo.png" alt="Autoworx Watermark" />
      </div>

      <style>{`
        @media print {
          @page {
            margin: 6mm 8mm;
            size: landscape;
          }
          .print-watermark {
            display: flex !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999 !important;
            pointer-events: none !important;
          }
          .print-watermark img {
            width: 480px !important;
            max-width: 65% !important;
            object-fit: contain !important;
            opacity: 0.07 !important;
            mix-blend-mode: multiply !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            background-color: transparent !important;
            background: transparent !important;
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
          tfoot { display: table-row-group !important; page-break-inside: avoid !important; }
          .print-signature-wrap,
          .print-signature-wrap * {
            border: none;
            box-shadow: none !important;
          }
          .print-signature-wrap .border-b-2 {
            border-bottom: 2px solid #000000 !important;
          }
          .print-status-pending {
            color: #ea580c !important;
            border-color: #f97316 !important;
            background-color: #fff7ed !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-status-paid {
            color: #047857 !important;
            border-color: #059669 !important;
            background-color: #ecfdf5 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-text-orange {
            color: #ea580c !important;
          }
          .print-text-green {
            color: #047857 !important;
          }
        }
      `}</style>

      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b !border-gray-300 pb-4 print:hidden relative z-10">
        <div>
          <h2 className="text-sm font-semibold !text-gray-500 uppercase tracking-wider">
            ACCOUNTING WORKS
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-extrabold !text-gray-900 tracking-tight">ACCOUNT PAYABLES</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Supplier Checks & PDCs
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <Button onClick={fetchPayables} variant="outline" size="icon" className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100" title="Refresh data">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100 font-medium">
            <Printer className="h-4 w-4 mr-2" /> Print Report
          </Button>
          <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Payable
          </Button>
        </div>
      </div>

      {/* Metric Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:hidden">
        {/* Total Outstanding / Pending */}
        <div className="!bg-white p-4 rounded-xl border !border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Payables</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600">
              ₱{totalPending.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {pendingCount} unpaid supplier check{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Maturing Soon PDCs (14-Day Alert Metric) */}
        <div className={cn(
          "!bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between transition-all",
          maturingSoonPayables.length > 0 ? "border-amber-400 bg-amber-50/20" : "!border-gray-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-600" /> Due in 14 Days
            </span>
            <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-orange-600">
              ₱{maturingSoonAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-600 mt-1 font-medium">
              {maturingSoonPayables.length} check{maturingSoonPayables.length !== 1 ? 's' : ''} maturing soon
            </p>
          </div>
        </div>

        {/* Total Paid / Cleared */}
        <div className="!bg-white p-4 rounded-xl border !border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Paid / Cleared</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              ₱{totalPaid.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {payables.filter(p => p.status === "PAID").length} cleared payment{payables.filter(p => p.status === "PAID").length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Total Payables */}
        <div className="!bg-white p-4 rounded-xl border !border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Obligations</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-700">
              ₱{totalPayables.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Overall payables recorded
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="!bg-white p-4 rounded-xl shadow-sm border !border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden relative z-10">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search supplier, check #, amount, or remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 !bg-white !border-gray-300 focus-visible:ring-blue-500 !text-gray-900 placeholder:!text-gray-500 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-[200px] !bg-white !border-gray-300 !text-gray-900">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="!bg-white !border-gray-200">
              <SelectItem value="all" className="!text-gray-900 cursor-pointer hover:bg-gray-100">All Statuses</SelectItem>
              <SelectItem value="PENDING" className="!text-gray-900 cursor-pointer hover:bg-gray-100">🟡 Pending Only</SelectItem>
              <SelectItem value="due_soon" className="!text-gray-900 cursor-pointer hover:bg-gray-100 font-bold text-orange-700">
                ⚠️ Due in 14 Days ({maturingSoonPayables.length})
              </SelectItem>
              <SelectItem value="PAID" className="!text-gray-900 cursor-pointer hover:bg-gray-100">🟢 Paid Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Printable Page Wrapper */}
      <div className="print-page-wrap relative z-10 print:z-auto">
        <div>
          {/* Printable Header (Visible only in Print) */}
          <div className="hidden print:block mb-4 border-b-2 border-black pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-black">
                  AUTOWORX REPAIR & DETAILS
                </h1>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-800 mt-0.5">
                  ACCOUNT PAYABLES & PDC REPORT
                </h2>
                <p className="text-xs font-semibold text-gray-700 mt-1">
                  AS OF: <span className="text-blue-900 font-bold">{format(new Date(), "MMMM d, yyyy")}</span>
                  {statusFilter !== "all" && (
                    <span className="ml-2 px-2 py-0.5 text-[10px] bg-gray-100 border border-gray-400 rounded uppercase font-bold text-gray-800">
                      Filter: {statusFilter === "due_soon" ? "Due in 14 Days" : statusFilter}
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

          {/* Summary Totals Bar - Visible on screen, hidden in print to avoid duplication with table totals footer */}
          {filteredPayables.length > 0 && (
            <div
              className="mb-3.5 px-4 py-3 bg-gray-100/90 border-2 !border-gray-300 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-gray-900 shadow-sm print:hidden"
            >
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <span className="uppercase text-[11px] tracking-wider text-gray-700 print:text-black font-black">
                  TOTAL AMOUNT:
                </span>
                <span className="font-mono font-black text-sm sm:text-base text-blue-700 print:text-black">
                  ₱{filteredPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-gray-300 print:text-gray-500 font-normal">•</span>
                <span className="text-amber-800 print-text-orange font-bold">
                  Pending: ₱{filteredPayables.filter(p => p.status === "PENDING").reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-gray-300 print:text-gray-500 font-normal">•</span>
                <span className="text-emerald-800 print-text-green font-bold">
                  Paid: ₱{filteredPayables.filter(p => p.status === "PAID").reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 print:text-gray-700 font-medium">
                {filteredPayables.length} record{filteredPayables.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Main Table Container */}
          <div className="!bg-white print:!bg-transparent rounded-xl shadow-sm border !border-gray-200 overflow-hidden relative z-10 print:z-auto print:border-none print:shadow-none print:rounded-none print:overflow-visible">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-xs text-left border-collapse border !border-gray-300 print:!border-gray-400 print:text-[10px] print:[&_th]:border print:[&_th]:!border-gray-400 print:[&_td]:border print:[&_td]:!border-gray-300">
                <thead>
                  <tr className="!bg-gray-100/90 !text-gray-700 font-bold border-b-2 !border-gray-300 print:!border-gray-400 select-none uppercase tracking-wider text-[10px] print:!bg-gray-100" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    <th className="py-3 px-3 w-10 text-center print:py-1.5 print:px-2">#</th>
                    <th className="py-3 px-3 w-24 print:py-1.5 print:px-2">Date</th>
                    <th className="py-3 px-4 print:py-1.5 print:px-3">Supplier Name</th>
                    <th className="py-3 px-4 text-right w-36 print:py-1.5 print:px-3">Amount</th>
                    <th className="py-3 px-3 w-32 print:py-1.5 print:px-2">Check Number</th>
                    <th className="py-3 px-3 w-40 text-center print:py-1.5 print:px-2">PDC Terms</th>
                    <th className="py-3 px-3 text-center w-28 print:py-1.5 print:px-2">Status</th>
                    <th className="py-3 px-4 print:py-1.5 print:px-3">Remarks</th>
                    <th className="py-3 px-3 text-center w-36 print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y !divide-gray-200 print:divide-gray-300">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                        Loading account payables...
                      </td>
                    </tr>
                  ) : filteredPayables.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500 print:py-8">
                        <span className="print:hidden">
                          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          No payables found. Click <strong>&quot;Add Payable&quot;</strong> to record one.
                        </span>
                        <span className="hidden print:inline text-xs italic font-medium text-gray-600">
                          No account payables records found as of this date.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredPayables.map((item, idx) => {
                      const isPaid = item.status === "PAID"
                      const pdcInfo = getPdcDueInfo(item.pdc_date, item.status)
                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            "hover:bg-gray-50/80 transition-colors",
                            isPaid ? "bg-emerald-50/20 print:!bg-transparent" : pdcInfo?.status === "overdue" ? "bg-red-50/30" : pdcInfo?.status === "due_soon" || pdcInfo?.status === "due_today" ? "bg-amber-50/30" : "print:!bg-transparent"
                          )}
                        >
                          <td className="py-2.5 px-3 text-center text-gray-500 font-mono text-[10px] print:py-1.5 print:px-2 print:text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap print:py-1.5 print:px-2 print:text-[10px]">
                            {item.date ? format(parseISO(item.date), "MMM d, yyyy") : "-"}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-gray-900 text-sm print:text-[10.5px] print:py-1.5 print:px-3 uppercase print:leading-normal">
                            {item.supplier_name}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900 text-sm print:text-[10.5px] print:py-1.5 print:px-3 print:leading-normal">
                            ₱{Number(item.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-gray-700 text-xs print:py-1.5 print:px-2 print:text-[10px]">
                            {item.check_number ? (
                              <span className="font-semibold text-blue-900">{item.check_number}</span>
                            ) : (
                              <span className="text-gray-400 italic">None</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center print:py-1.5 print:px-2">
                            {item.pdc_term ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-bold text-blue-900 text-xs tracking-tight print:text-[11px] print:text-black">
                                  {item.pdc_term}
                                </span>
                                {pdcInfo && (
                                  <span className={cn(
                                    "text-[9px] px-2 py-0.5 mt-0.5 rounded-full border uppercase tracking-wide font-bold print:hidden",
                                    pdcInfo.badgeClass
                                  )}>
                                    {pdcInfo.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs print:text-[10px]">No PDC</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center print:py-1.5 print:px-2">
                            {isPaid ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 print-status-paid print:text-[9px] print:py-0.5 print:px-2"
                                style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 print:hidden" /> PAID
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 print-status-pending print:text-[9px] print:py-0.5 print:px-2"
                                style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                              >
                                <Clock className="w-3 h-3 text-amber-600 print:hidden" /> PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-gray-600 italic text-[11px] print:py-1.5 print:px-3 print:text-[9.5px] print:leading-normal">
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
                                    setPayableToUndo(item)
                                  } else {
                                    setPayableToPay(item)
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
                                onClick={() => setPayableToDelete(item.id)}
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
                {filteredPayables.length > 0 && (
                  <tfoot>
                    {/* Table Totals Row */}
                    <tr className="bg-gray-100 font-bold border-t-2 !border-gray-400 print:!border-black text-gray-900 print:!bg-gray-200 break-inside-avoid [page-break-inside:avoid]" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                      <td colSpan={3} className="py-3 px-4 text-right uppercase text-[11px] tracking-wider print:py-2.5 print:px-3 print:text-[10.5px] print:text-black print:font-black">
                        TOTAL AMOUNT:
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700 print:text-black print:py-2.5 print:px-3 print:text-[10.5px] print:font-black">
                        ₱{filteredPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td colSpan={4} className="py-3 px-4 text-gray-800 text-[11px] print:py-2.5 print:px-3 print:text-[10.5px] print:text-black">
                        <span className="text-amber-800 print-text-orange font-bold">
                          Pending: ₱{filteredPayables.filter(p => p.status === "PENDING").reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="mx-2 text-gray-400 print:text-gray-600">•</span>
                        <span className="text-emerald-800 print-text-green font-bold">
                          Paid: ₱{filteredPayables.filter(p => p.status === "PAID").reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Signatures & Approvals - Outside of table, clean with NO box lines */}
          <div className="print-signature-wrap hidden print:block mt-6 pt-3 px-2 border-0 border-none print:border-none print:[border:none!important] break-inside-avoid [page-break-inside:avoid]">
            <div className="grid grid-cols-2 gap-16 text-xs font-bold text-gray-800 border-0 border-none print:border-none print:[border:none!important] break-inside-avoid [page-break-inside:avoid]">
              <div>
                <p className="mb-8 uppercase tracking-wider text-[11px] text-gray-600">PREPARED BY:</p>
                <div className="w-56 border-b-2 border-black"></div>
                <p className="font-extrabold text-xs text-black mt-1.5 uppercase tracking-wide">Accounting / Cashier</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="mb-8 uppercase tracking-wider text-[11px] text-gray-600">NOTED / APPROVED BY:</p>
                <div className="w-56 border-b-2 border-black"></div>
                <p className="font-extrabold text-xs text-black mt-1.5 uppercase tracking-wide">General Manager / Sir Paul</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Payable Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto p-5 sm:p-6 !bg-white !text-gray-900 border !border-gray-300 shadow-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="space-y-1 pb-2.5 border-b !border-gray-200">
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {editingPayable ? "Edit Payable Record" : "Add Payable Record"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Input supplier details, check number, and PDC maturity terms.
              </DialogDescription>
            </DialogHeader>

            <div className="py-3.5 space-y-3.5">
              {/* Supplier Name Field */}
              <div className="space-y-1.5">
                <Label htmlFor="supplier_name" className="text-xs font-semibold text-gray-800">
                  Name of Supplier <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="supplier_name"
                  placeholder="e.g. Partstrade, Tri-J, Nippon Paint, Shell"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="h-9.5 !bg-white !border-gray-300 !text-gray-900 text-sm focus-visible:ring-blue-500"
                  autoFocus
                  required
                />
              </div>

              {/* Amount & Date in 2 Columns */}
              <div className="grid grid-cols-2 gap-3">
                {/* Amount Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="pay_amount" className="text-xs font-semibold text-gray-800">
                    Amount (PHP) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">
                      ₱
                    </span>
                    <Input
                      id="pay_amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => {
                        const formatted = formatAmountWithCommas(e.target.value)
                        setFormData({ ...formData, amount: formatted })
                      }}
                      className="h-9.5 pl-7.5 !bg-white !border-gray-300 !text-gray-900 text-sm font-mono font-bold focus-visible:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Transaction Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="pay_date" className="text-xs font-semibold text-gray-800">
                    Transaction Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pay_date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleTransactionDateChange(e.target.value)}
                    className="h-9.5 !bg-white !border-gray-300 !text-gray-900 text-sm focus-visible:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Check Number Field */}
              <div className="space-y-1.5">
                <Label htmlFor="check_number" className="text-xs font-semibold text-gray-800">
                  Check Number <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="check_number"
                  placeholder="e.g. CHK-123456 or Bank Reference"
                  value={formData.check_number}
                  onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                  className="h-9.5 !bg-white !border-gray-300 !text-gray-900 text-sm font-mono focus-visible:ring-blue-500"
                />
              </div>

              {/* PDC Terms Section (Auto-counted from Terms) */}
              <div className="p-3 bg-blue-50/40 border border-blue-200/80 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                    PDC Terms <span className="text-gray-500 font-normal text-[11px]">(Auto-counted from Date)</span>
                  </Label>
                  {formData.pdc_term && (
                    <span className="text-xs font-bold text-blue-800 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded">
                      {formData.pdc_term}
                    </span>
                  )}
                </div>

                {/* Quick Presets Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {PDC_TERM_PRESETS.map((preset) => {
                    const isSelected = pdcPreset === preset.value
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleTermSelect(preset.value)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-md border font-medium transition-all",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm font-bold"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                {/* Only when Custom is selected, show a single Days input */}
                {pdcPreset === "custom" && (
                  <div className="pt-2 border-t border-blue-200/70 space-y-1">
                    <Label htmlFor="custom_days_input" className="text-xs font-semibold text-gray-800">
                      Custom Terms (Number of Days)
                    </Label>
                    <div className="relative max-w-[180px]">
                      <Input
                        id="custom_days_input"
                        type="number"
                        min="1"
                        placeholder="e.g. 10, 20, 75"
                        value={customDays}
                        onChange={(e) => handleCustomDaysChange(e.target.value)}
                        className="h-9 pr-12 !bg-white !border-gray-300 !text-gray-900 text-sm font-semibold focus-visible:ring-blue-500"
                        autoFocus
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">
                        days
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Remarks Field (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="pay_remarks" className="text-xs font-semibold text-gray-800">
                  Remarks / Notes <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="pay_remarks"
                  placeholder="Optional notes, invoice #, DR #, or items purchased..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="!bg-white !border-gray-300 !text-gray-900 text-sm min-h-[60px] h-[60px] resize-none focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <DialogFooter className="border-t !border-gray-200 pt-3 mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-4 !bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              >
                {isSubmitting ? "Saving..." : editingPayable ? "Save Changes" : "Add Payable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Confirmation Dialog */}
      <Dialog open={!!payableToPay} onOpenChange={(open) => !open && setPayableToPay(null)}>
        <DialogContent className="sm:max-w-md !bg-white !text-gray-900 border !border-gray-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirm Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 pt-1">
              Are you sure you want to mark this supplier payable as <strong>PAID / CLEARED</strong>?
            </DialogDescription>
          </DialogHeader>

          {payableToPay && (
            <div className="my-2 p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Supplier:</span>
                <span className="font-bold text-gray-900 text-sm">{payableToPay.supplier_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Amount:</span>
                <span className="font-mono font-black text-emerald-700 text-base">
                  ₱{Number(payableToPay.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {payableToPay.check_number && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold uppercase text-[10px]">Check #:</span>
                  <span className="font-mono font-bold text-blue-900">{payableToPay.check_number}</span>
                </div>
              )}
              {payableToPay.pdc_term && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold uppercase text-[10px]">PDC Terms:</span>
                  <span className="font-bold text-blue-900">{payableToPay.pdc_term}</span>
                </div>
              )}
              {payableToPay.remarks && (
                <div className="flex justify-between items-start pt-1.5 border-t border-gray-200">
                  <span className="text-gray-500 font-semibold uppercase text-[10px]">Remarks:</span>
                  <span className="text-gray-700 italic max-w-[240px] text-right">{payableToPay.remarks}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayableToPay(null)}
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
                if (!payableToPay) return
                setIsUpdatingStatus(true)
                try {
                  await toggleStatus(payableToPay)
                  setPayableToPay(null)
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
      <Dialog open={!!payableToUndo} onOpenChange={(open) => !open && setPayableToUndo(null)}>
        <DialogContent className="sm:max-w-md !bg-white !text-gray-900 border !border-gray-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-amber-700 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Revert Payment to Pending
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 pt-1">
              Are you sure you want to revert this payable from <strong>PAID</strong> back to <strong>PENDING</strong>?
            </DialogDescription>
          </DialogHeader>

          {payableToUndo && (
            <div className="my-2 p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Supplier:</span>
                <span className="font-bold text-gray-900 text-sm">{payableToUndo.supplier_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase text-[10px]">Amount:</span>
                <span className="font-mono font-black text-amber-700 text-base">
                  ₱{Number(payableToUndo.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {payableToUndo.check_number && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold uppercase text-[10px]">Check #:</span>
                  <span className="font-mono font-bold text-blue-900">{payableToUndo.check_number}</span>
                </div>
              )}
              {payableToUndo.pdc_term && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold uppercase text-[10px]">PDC Terms:</span>
                  <span className="font-bold text-blue-900">{payableToUndo.pdc_term}</span>
                </div>
              )}
              {payableToUndo.remarks && (
                <div className="flex justify-between items-start pt-1.5 border-t border-gray-200">
                  <span className="text-gray-500 font-semibold uppercase text-[10px]">Remarks:</span>
                  <span className="text-gray-700 italic max-w-[240px] text-right">{payableToUndo.remarks}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayableToUndo(null)}
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
                if (!payableToUndo) return
                setIsUpdatingStatus(true)
                try {
                  await toggleStatus(payableToUndo)
                  setPayableToUndo(null)
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
      <Dialog open={!!payableToDelete} onOpenChange={(open) => !open && setPayableToDelete(null)}>
        <DialogContent className="sm:max-w-sm !bg-white !text-gray-900 border !border-gray-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Payable Record
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 pt-2">
              Are you sure you want to delete this payable record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setPayableToDelete(null)}
              className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => payableToDelete && handleDelete(payableToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
