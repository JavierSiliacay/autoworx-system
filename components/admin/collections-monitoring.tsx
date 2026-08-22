"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Search, Plus, Loader2, Edit, Trash2, Calendar as CalendarIcon, ListChecks,
  RefreshCw, Check, X, Printer, FileText, Eye, CheckSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { format, startOfMonth, endOfMonth, parseISO, getISOWeek, getISOWeekYear, setISOWeek, setISOWeekYear, startOfISOWeek, endOfISOWeek } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface Collection {
  id: string
  created_at: string
  date: string
  customer_name: string
  address: string
  unit: string
  plate: string
  receipt_type: string
  receipt_number: string
  description: string
  payment_type: string
  total_amount: number
  cashier_name: string
  remarks: string | null
  created_by?: string
}

const RECEIPT_TYPES = ["JO", "AR", "OR"]
const PAYMENT_TYPES = ["CASH", "CHECK", "QR PAY", "BANK TRANSFER"]

export function CollectionsMonitoring() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"detailed" | "summary">("detailed")
  const [receiptTypeFilter, setReceiptTypeFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  
  const currentYear = new Date().getFullYear().toString()
  const currentMonthKey = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly" | "all">("daily")
  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const d = new Date()
    return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`
  })
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)
  const [selectedYear, setSelectedYear] = useState<string>(currentYear)
  const { toast } = useToast()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null)
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null)

  // Selection state
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    customer_name: "",
    address: "",
    unit: "",
    plate: "",
    receipt_type: "JO",
    receipt_number: "",
    description: "",
    payment_type: "CASH",
    total_amount: "",
    cashier_name: "",
    remarks: ""
  })

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    years.add(currentYear)
    collections.forEach(c => {
      if (c.date) {
        const y = c.date.split('-')[0]
        if (y) years.add(y)
      }
    })
    return Array.from(years).sort().reverse()
  }, [collections, currentYear])

  const fetchCollections = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/collections", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCollections(data)
      } else {
        toast({ title: "Error", description: "Failed to fetch collections", variant: "destructive" })
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  // Realtime updates
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('collections-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections'
        },
        () => {
          fetchCollections()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleBulkDelete = async () => {
    if (selectedCollections.length === 0) return
    const confirm = window.confirm(`Are you sure you want to delete ${selectedCollections.length} collections?`)
    if (!confirm) return
    setIsLoading(true)
    try {
      await Promise.all(selectedCollections.map(id => fetch(`/api/collections?id=${id}`, { method: "DELETE" })))
      toast({ title: "Success", description: `${selectedCollections.length} collections deleted.` })
      setSelectedCollections([])
      fetchCollections()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete some collections.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/collections?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Success", description: "Collection record deleted." })
        setCollectionToDelete(null)
        fetchCollections()
      } else {
        toast({ title: "Error", description: "Failed to delete collection.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" })
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCollections(filteredCollections.map(c => c.id))
    } else {
      setSelectedCollections([])
    }
  }

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCollections(prev => [...prev, id])
    } else {
      setSelectedCollections(prev => prev.filter(item => item !== id))
    }
  }

  const formatWeekRange = (weekStr: string) => {
    if (!weekStr) return ""
    try {
      const [yearStr, wStr] = weekStr.split("-W")
      const year = parseInt(yearStr, 10)
      const week = parseInt(wStr, 10)
      let targetDate = setISOWeekYear(new Date(), year)
      targetDate = setISOWeek(targetDate, week)
      const start = startOfISOWeek(targetDate)
      const end = endOfISOWeek(targetDate)
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
    } catch (e) {
      return weekStr
    }
  }

  const filteredCollections = useMemo(() => {
    let result = collections

    if (searchQuery.trim()) {
      const tokens = searchQuery.toLowerCase().trim().split(/\s+/)
      result = result.filter(c => {
        const combinedRecordText = [
          c.customer_name,
          c.address,
          c.unit,
          c.plate,
          c.receipt_type,
          c.receipt_number,
          c.description,
          c.payment_type,
          c.cashier_name,
          c.remarks,
          c.date,
          c.total_amount?.toString()
        ].filter(Boolean).join(" ").toLowerCase()

        // Tokenized AND logic: Every word/token in the search query must match
        return tokens.every(token => combinedRecordText.includes(token))
      })
    }

    if (receiptTypeFilter !== "all") {
      result = result.filter(c => c.receipt_type === receiptTypeFilter)
    }

    if (paymentFilter !== "all") {
      result = result.filter(c => c.payment_type?.toUpperCase() === paymentFilter.toUpperCase())
    }

    if (reportPeriod === "daily") {
      result = result.filter(c => c.date === selectedDay)
    } else if (reportPeriod === "weekly") {
      result = result.filter(c => {
        if (!c.date) return false
        try {
          const d = parseISO(c.date)
          const itemWeek = `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`
          return itemWeek === selectedWeek
        } catch {
          return false
        }
      })
    } else if (reportPeriod === "monthly") {
      result = result.filter(c => c.date?.startsWith(selectedMonth))
    } else if (reportPeriod === "yearly") {
      if (selectedYear !== "all") {
        result = result.filter(c => c.date?.startsWith(selectedYear))
      }
    }

    return result
  }, [collections, searchQuery, receiptTypeFilter, paymentFilter, reportPeriod, selectedDay, selectedWeek, selectedMonth, selectedYear])

  const totalFilteredAmount = filteredCollections.reduce((acc, curr) => acc + curr.total_amount, 0)

  const openModal = (collectionToEdit?: Collection) => {
    setHasSubmitted(false)
    if (collectionToEdit) {
      setEditingCollection(collectionToEdit)
      setFormData({
        date: collectionToEdit.date,
        customer_name: collectionToEdit.customer_name,
        address: collectionToEdit.address,
        unit: collectionToEdit.unit,
        plate: collectionToEdit.plate,
        receipt_type: collectionToEdit.receipt_type,
        receipt_number: collectionToEdit.receipt_number,
        description: collectionToEdit.description,
        payment_type: collectionToEdit.payment_type,
        total_amount: collectionToEdit.total_amount 
          ? (collectionToEdit.total_amount % 1 === 0 
              ? collectionToEdit.total_amount.toLocaleString("en-US") 
              : collectionToEdit.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
          : "",
        cashier_name: collectionToEdit.cashier_name,
        remarks: collectionToEdit.remarks || ""
      })
    } else {
      setEditingCollection(null)
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        customer_name: "",
        address: "",
        unit: "",
        plate: "",
        receipt_type: "JO",
        receipt_number: "",
        description: "",
        payment_type: "CASH",
        total_amount: "",
        cashier_name: "",
        remarks: ""
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHasSubmitted(true)

    const rawAmount = parseFloat(formData.total_amount.replace(/,/g, ''))
    if (isNaN(rawAmount) || rawAmount <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid total amount.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const isEdit = !!editingCollection
      const method = isEdit ? "PUT" : "POST"
      const payload = {
        ...(isEdit && { id: editingCollection.id }),
        date: formData.date,
        customer_name: formData.customer_name.trim().toUpperCase(),
        address: formData.address.trim().toUpperCase(),
        unit: formData.unit.trim().toUpperCase(),
        plate: formData.plate.trim().toUpperCase(),
        receipt_type: formData.receipt_type,
        receipt_number: formData.receipt_number.trim(),
        description: formData.description.trim().toUpperCase(),
        payment_type: formData.payment_type,
        total_amount: rawAmount,
        cashier_name: formData.cashier_name.trim().toUpperCase(),
        remarks: formData.remarks.trim() || null
      }

      const res = await fetch("/api/collections", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || "Failed to save collection")
      }

      const savedData = await res.json()

      // Optimistically update collections state immediately
      if (isEdit) {
        setCollections(prev => prev.map(c => c.id === savedData.id ? savedData : c))
      } else {
        setCollections(prev => [savedData, ...prev])
      }

      toast({ title: "Success", description: `Collection ${isEdit ? "updated" : "recorded"} successfully.` })
      setIsModalOpen(false)
      fetchCollections()
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to save collection record.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFormattedDateCovered = () => {
    if (reportPeriod === 'daily') return format(parseISO(selectedDay), "MMMM d, yyyy")
    if (reportPeriod === 'weekly') return formatWeekRange(selectedWeek)
    if (reportPeriod === 'monthly') {
      try {
        const d = parseISO(selectedMonth + '-01')
        const start = startOfMonth(d)
        const end = endOfMonth(d)
        return `${format(start, "MMMM d")} - ${format(end, "d, yyyy")}`
      } catch {
        return selectedMonth
      }
    }
    if (reportPeriod === 'yearly') return selectedYear === 'all' ? 'All Time' : selectedYear
    return "All Time"
  }

  return (
    // FORCED LIGHT MODE WRAPPER (Matching Expenses Monitoring Exactly)
    <div className="min-h-screen print:min-h-0 print:h-auto print:block !bg-gray-50 !text-gray-900 font-sans p-6 print:p-0 print:!bg-white">

      {/* Watermark only visible in print */}
      <div className="hidden print:flex fixed inset-0 pointer-events-none items-center justify-center z-50">
        <img src="/autoworxlogo.png" alt="Autoworx Watermark" className="w-[500px] max-w-[70%] object-contain opacity-10 mix-blend-multiply" />
      </div>

      <style>{`
        @media print {
          @page {
            margin: 4mm 5mm;
            size: landscape;
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
            min-height: 95vh !important;
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
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>

      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b !border-gray-300 pb-4 print:hidden relative z-10">
        <div>
          <h2 className="text-sm font-semibold !text-gray-500 uppercase tracking-wider">
            {reportPeriod === "daily" ? "DAILY COLLECTION MONITORING" : reportPeriod === "weekly" ? "WEEKLY COLLECTION MONITORING" : reportPeriod === "monthly" ? "MONTHLY COLLECTION MONITORING" : reportPeriod === "yearly" ? "YEARLY COLLECTION MONITORING" : "OVERALL COLLECTION MONITORING"}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-extrabold !text-gray-900 tracking-tight">COLLECTION MONITORING</h1>
            
            {/* View Mode Toggle Buttons */}
            <div className="inline-flex items-center bg-gray-200/80 p-1 rounded-lg border border-gray-300 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("detailed")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                  viewMode === "detailed"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <ListChecks className="w-3.5 h-3.5" />
                Detailed Log
              </button>
              <button
                type="button"
                onClick={() => setViewMode("summary")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                  viewMode === "summary"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Print / Monthly Summary
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <Button onClick={fetchCollections} variant="outline" size="icon" className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100" title="Refresh data">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100">
            <Printer className="h-4 w-4 mr-2" /> Print Report
          </Button>
          
          {selectedCollections.length > 0 && (
            <Button onClick={handleBulkDelete} variant="destructive" className="font-medium shadow-sm">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Selected ({selectedCollections.length})
            </Button>
          )}
          <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Collection
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="!bg-white p-4 rounded-xl shadow-sm border !border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between print:hidden relative z-10">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-[700px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customer, plate, unit, receipt #, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 !bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 focus-visible:ring-blue-500 !text-gray-900 placeholder:!text-gray-500 w-full"
            />
          </div>
          <Select value={receiptTypeFilter} onValueChange={setReceiptTypeFilter}>
            <SelectTrigger className="w-[170px] shrink-0 !bg-white !border-gray-300 !text-gray-900">
              <SelectValue placeholder="All Receipts" />
            </SelectTrigger>
            <SelectContent className="!bg-white !border-gray-200">
              <SelectItem value="all" className="!text-gray-900 cursor-pointer hover:bg-gray-100">All Receipts</SelectItem>
              {RECEIPT_TYPES.map(t => (
                <SelectItem key={t} value={t} className="!text-gray-900 cursor-pointer hover:bg-gray-100">{t} Receipts</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[170px] shrink-0 !bg-white !border-gray-300 !text-gray-900">
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent className="!bg-white !border-gray-200">
              <SelectItem value="all" className="!text-gray-900 cursor-pointer hover:bg-gray-100">All Payments</SelectItem>
              {PAYMENT_TYPES.map(t => (
                <SelectItem key={t} value={t} className="!text-gray-900 cursor-pointer hover:bg-gray-100">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => { 
              setIsSelectMode(!isSelectMode); 
              if (isSelectMode) setSelectedCollections([]);
            }} 
            variant={isSelectMode ? "default" : "outline"}
            className={`${isSelectMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : '!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100'}`}
            title="Toggle Multi-Select Delete"
          >
            <ListChecks className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <CalendarIcon className="mr-2 h-4 w-4 !text-gray-500 hidden md:block" />
          <Select value={reportPeriod} onValueChange={(v: any) => setReportPeriod(v)}>
            <SelectTrigger className="w-[120px] !bg-white !border-gray-300 !text-gray-800">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="!bg-white !border-gray-200">
              <SelectItem value="daily" className="!text-gray-900 cursor-pointer hover:bg-gray-100">Daily</SelectItem>
              <SelectItem value="weekly" className="!text-gray-900 cursor-pointer hover:bg-gray-100">Weekly</SelectItem>
              <SelectItem value="monthly" className="!text-gray-900 cursor-pointer hover:bg-gray-100">Monthly</SelectItem>
              <SelectItem value="yearly" className="!text-gray-900 cursor-pointer hover:bg-gray-100">Yearly</SelectItem>
              <SelectItem value="all" className="!text-gray-900 cursor-pointer hover:bg-gray-100">All Years</SelectItem>
            </SelectContent>
          </Select>

          {reportPeriod === "daily" ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                style={{ colorScheme: "light" }}
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-[150px] !bg-white !border-gray-300 focus-visible:ring-blue-500 !text-gray-900"
              />
            </div>
          ) : reportPeriod === "weekly" ? (
            <div className="flex items-center gap-2">
              <Input
                type="week"
                style={{ colorScheme: "light" }}
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-[180px] !bg-white !border-gray-300 focus-visible:ring-blue-500 !text-gray-900"
              />
            </div>
          ) : reportPeriod === "monthly" ? (
            <div className="flex items-center gap-2">
              <Select value={selectedYear} onValueChange={(y) => {
                setSelectedYear(y)
                const monthPart = selectedMonth.split('-')[1] || "01"
                setSelectedMonth(`${y}-${monthPart}`)
              }}>
                <SelectTrigger className="w-[100px] !bg-white !border-gray-300 !text-gray-800">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="!bg-white !border-gray-200">
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year} className="!text-gray-900 cursor-pointer hover:bg-gray-100">{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[160px] !bg-white !border-gray-300 !text-gray-800">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="!bg-white !border-gray-200">
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((monthName, index) => {
                    const m = String(index + 1).padStart(2, '0')
                    const key = `${selectedYear}-${m}`
                    return (
                      <SelectItem key={key} value={key} className="!text-gray-900 cursor-pointer hover:bg-gray-100">{monthName}</SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          ) : reportPeriod === "yearly" ? (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] !bg-white !border-gray-300 !text-gray-800">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="!bg-white !border-gray-200">
                <SelectItem value="all" className="!text-gray-900 cursor-pointer hover:bg-gray-100">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year} className="!text-gray-900 cursor-pointer hover:bg-gray-100">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      {/* ================= VIEW 1: PRINT / SUMMARY TABLE (EXACT IMAGE FORMAT) ================= */}
      {viewMode === "summary" ? (
        <div className="print-page-wrap !bg-white rounded-xl shadow-sm border !border-gray-200 p-4 md:p-6 print:shadow-none print:border-none print:p-0 print:m-0 relative z-10">
          <div className="overflow-x-auto print:overflow-visible flex-1 flex flex-col justify-between">
            
            <div>
              {/* Header section inside print preview */}
              <div className="mb-3 pb-2 border-b border-gray-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-tight text-black">
                      COLLECTION MONITORING ({reportPeriod.toUpperCase()})
                    </h1>
                    <div className="mt-0.5 text-xs font-bold text-gray-700 uppercase">
                      <p>AUTOWORX REPAIR - KAUSWAGAN CDO</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-700 font-semibold space-y-0.5">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="font-bold text-black uppercase">DATE COVERED:</span>
                      <span className="text-blue-800 font-black uppercase font-mono">{getFormattedDateCovered()}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Date Printed: {format(new Date(), "PPpp")}</p>
                  </div>
                </div>
              </div>

              <table className="w-full border-collapse text-xs text-left !text-gray-800 border border-gray-400 print:text-[8px] print:leading-tight print:[&_th]:px-0.5 print:[&_th]:py-1 print:[&_td]:px-0.5 print:[&_td]:py-1">
                <colgroup>
                  <col style={{ width: '2.5%' }} />
                  <col style={{ width: '6.5%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10.5%' }} />
                  <col style={{ width: '5.5%' }} />
                  <col style={{ width: '5.5%' }} />
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '3.5%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-400 text-gray-900 font-bold uppercase text-[11px]" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    <th rowSpan={2} className="border border-gray-400 px-2 py-2 text-center w-10">NO.</th>
                    <th rowSpan={2} className="border border-gray-400 px-2 py-2 whitespace-nowrap text-center">DATE</th>
                    <th rowSpan={2} className="border border-gray-400 px-3 py-2">CUSTOMER NAME</th>
                    <th rowSpan={2} className="border border-gray-400 px-3 py-2">ADDRESS</th>
                    <th rowSpan={2} className="border border-gray-400 px-2 py-2 text-center">UNIT</th>
                    <th rowSpan={2} className="border border-gray-400 px-2 py-2 text-center">PLATE</th>
                    <th colSpan={2} className="border border-gray-400 px-2 py-1 text-center bg-gray-200">RECIEPT TYPE</th>
                    <th className="border border-gray-400 px-2 py-1 bg-gray-100"></th>
                    <th className="border border-gray-400 px-3 py-1 text-center bg-gray-200">BUSINESS STYLE</th>
                    <th className="border border-gray-400 px-2 py-1 text-center bg-gray-200">PAYMENT TYPE</th>
                    <th rowSpan={2} className="border border-gray-400 px-3 py-2 text-center align-middle">TOTAL AMOUNT</th>
                    <th rowSpan={2} className="border border-gray-400 px-3 py-2 text-center align-middle">CASHIER NAME</th>
                    <th rowSpan={2} className="border border-gray-400 px-3 py-2 text-center align-middle">REMARKS</th>
                  </tr>
                  <tr className="bg-gray-100 border-b border-gray-400 text-gray-900 font-bold uppercase text-[10px]" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    <th className="border border-gray-400 px-2 py-1 text-center">JO/AR</th>
                    <th className="border border-gray-400 px-2 py-1 text-center">OR</th>
                    <th className="border border-gray-400 px-2 py-1 text-center">JO/AR/OR<br/>#</th>
                    <th className="border border-gray-400 px-3 py-1 text-center font-bold text-[9px]">IN PAYMENT OF THE FF SERVICE/<br/>TRANSACTION/ DESCRIPTION</th>
                    <th className="border border-gray-400 px-2 py-1 text-center font-bold text-[9px]">CASH / CHECK/ QR PAY<br/>/ BANK TRANSFER</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={14} className="border border-gray-400 px-4 py-8 text-center text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1 text-blue-600" />
                        Loading collection records...
                      </td>
                    </tr>
                  ) : filteredCollections.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="border border-gray-400 px-4 py-8 text-center text-gray-500">
                        No collection entries found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredCollections.map((item, idx) => (
                      <tr key={item.id} className="border-b border-gray-300 hover:bg-blue-50/40 transition-colors print:h-8">
                        <td className="border border-gray-400 px-2 py-1.5 print:px-0.5 print:py-1 text-center font-mono font-bold text-gray-700">{idx + 1}</td>
                        <td className="border border-gray-400 px-2 py-1.5 print:px-0.5 print:py-1 font-mono whitespace-nowrap text-center">{format(parseISO(item.date), "MM/dd/yyyy")}</td>
                        <td className="border border-gray-400 px-3 py-1.5 print:px-0.5 print:py-1 font-bold uppercase text-gray-900 truncate">{item.customer_name}</td>
                        <td className="border border-gray-400 px-3 py-1.5 print:px-0.5 print:py-1 uppercase text-gray-700 truncate">{item.address}</td>
                        <td className="border border-gray-400 px-2 py-1.5 print:px-0.5 print:py-1 uppercase text-gray-800 font-medium text-center">{item.unit}</td>
                        <td className="border border-gray-400 px-2 py-1.5 print:px-0.5 print:py-1 uppercase font-mono font-bold text-gray-800 text-center">{item.plate}</td>
                        <td className="border border-gray-400 px-2 py-1.5 print:px-0.5 print:py-1 text-center font-bold text-blue-800">
                          {item.receipt_type === "JO" || item.receipt_type === "AR" ? item.receipt_type : ""}
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5 print:px-0.5 print:py-1 text-center font-bold text-emerald-800">
                          {item.receipt_type === "OR" ? "OR" : ""}
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5 print:px-0.5 print:py-1 font-mono font-medium text-center">{item.receipt_number}</td>
                        <td className="border border-gray-400 px-3 py-1.5 print:px-0.5 print:py-1 uppercase text-gray-800 text-[10px] print:text-[7.5px] leading-tight">{item.description}</td>
                        <td className="border border-gray-400 px-2 py-1.5 print:px-0.5 print:py-1 uppercase text-center font-semibold text-gray-700 text-[10px] print:text-[7.5px]">{item.payment_type}</td>
                        <td className="border border-gray-400 px-3 py-1.5 print:px-0.5 print:py-1 text-right font-mono font-bold text-blue-950">
                          ₱{item.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-gray-400 px-3 py-1.5 print:px-0.5 print:py-1 uppercase font-medium text-gray-800 text-center">{item.cashier_name}</td>
                        <td className="border border-gray-400 px-3 py-1.5 print:px-0.5 print:py-1 text-[10px] print:text-[7.5px] text-gray-600 italic text-center">{item.remarks || ""}</td>
                      </tr>
                    ))
                  )}

                  {/* Blank lines dynamically generated to fill physical bond paper sheet */}
                  {Array.from({ length: Math.max(0, 14 - filteredCollections.length) }).map((_, i) => (
                    <tr key={`blank-${i}`} className="h-6 print:h-8">
                      <td className="border border-gray-400 px-2 py-1 text-center text-gray-300 font-mono text-[10px]">{filteredCollections.length + i + 1}</td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-3 py-1"></td>
                      <td className="border border-gray-400 px-3 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-3 py-1"></td>
                      <td className="border border-gray-400 px-2 py-1"></td>
                      <td className="border border-gray-400 px-3 py-1"></td>
                      <td className="border border-gray-400 px-3 py-1"></td>
                      <td className="border border-gray-400 px-3 py-1"></td>
                    </tr>
                  ))}

                  {/* Total Footer Row */}
                  <tr className="bg-gray-200 border-t-2 border-gray-500 font-black text-gray-900 text-sm print:h-9">
                    <td colSpan={11} className="border border-gray-400 px-4 py-2.5 text-right uppercase tracking-wider">
                      TOTAL
                    </td>
                    <td className="border border-gray-400 px-3 py-2.5 text-right font-mono text-base text-blue-950 font-black">
                      ₱{totalFilteredAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td colSpan={2} className="border border-gray-400 px-3 py-2.5"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Printable Signature Lines Footer */}
            <div className="mt-8 pt-4 grid grid-cols-2 gap-16 text-xs font-bold text-gray-800 border-t border-gray-300 print:mt-auto print:pt-6 print:border-none">
              <div>
                <p className="mb-8 print:mb-6">PREPARED BY:</p>
                <div className="border-b border-gray-800 w-3/4"></div>
              </div>
              <div>
                <p className="mb-8 print:mb-6">NOTED BY:</p>
                <div className="border-b border-gray-800 w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= VIEW 2: DETAILED LOG TABLE (MATCHING EXPENSES MONITORING) ================= */
        <div className="!bg-white rounded-xl shadow-sm border !border-gray-200 overflow-hidden print:shadow-none print:border-none print:overflow-visible relative z-10">
          <div className="overflow-x-auto print:overflow-visible">

            <table className="w-full border-collapse text-sm text-left !text-gray-700 [&_th]:border [&_th]:!border-gray-200 [&_td]:border [&_td]:!border-gray-200 print:text-[10px] print:[&_th]:px-1 print:[&_th]:py-1 print:[&_td]:px-1 print:[&_td]:py-1">
              <thead className="text-xs !text-gray-700 !bg-blue-50 border-b !border-blue-200 uppercase font-bold" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                <tr className="hidden print:table-row bg-white border-0">
                  <th colSpan={isSelectMode ? 14 : 13} className="border-0 bg-white px-0 py-4 font-normal normal-case">
                    <div className="flex flex-col w-full mb-4">
                      <h1 className="text-xl font-black uppercase tracking-tight text-black text-center mb-4">COLLECTION REPORT MONITORING</h1>
                      <div className="flex justify-between items-center mt-2">
                        <h2 className="text-base font-extrabold tracking-widest text-gray-900 uppercase">
                          {reportPeriod === "daily" ? "DAILY COLLECTION REPORT" : reportPeriod === "weekly" ? "WEEKLY COLLECTION REPORT" : reportPeriod === "monthly" ? "MONTHLY COLLECTION REPORT" : reportPeriod === "yearly" ? "YEARLY COLLECTION REPORT" : "OVERALL COLLECTION REPORT"}
                        </h2>
                        <div className="text-sm text-gray-800 flex flex-col items-end gap-1.5">
                          <p className="bg-gray-100/50 px-3 py-1 rounded-md border border-gray-200 shadow-sm"><span className="font-bold text-gray-900 mr-2 uppercase text-xs tracking-wider">Date printed:</span> <span className="text-blue-700 font-bold text-base">{format(new Date(), "PPpp")}</span></p>
                          <p className="bg-gray-100/50 px-3 py-1 rounded-md border border-gray-200 shadow-sm"><span className="font-bold text-gray-900 mr-2 uppercase text-xs tracking-wider">Period:</span> <span className="text-blue-700 font-bold text-base">{getFormattedDateCovered()}</span></p>
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
                <tr className="border-b !border-blue-200">
                  {isSelectMode && (
                    <th rowSpan={2} scope="col" className="px-3 py-2 whitespace-nowrap print:hidden w-10 text-center">
                      <Checkbox 
                        checked={filteredCollections.length > 0 && selectedCollections.length === filteredCollections.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                  )}
                  <th rowSpan={2} scope="col" className="px-2 py-2 text-[10px] text-center w-10">NO.</th>
                  <th rowSpan={2} scope="col" className="px-2 py-2 text-[10px] whitespace-nowrap">DATE</th>
                  <th rowSpan={2} scope="col" className="px-2 py-2 text-[10px] min-w-[110px]">CUSTOMER NAME</th>
                  <th rowSpan={2} scope="col" className="px-2 py-2 text-[10px] min-w-[100px]">ADDRESS</th>
                  <th rowSpan={2} scope="col" className="px-2 py-2 text-[10px]">UNIT</th>
                  <th rowSpan={2} scope="col" className="px-2 py-2 text-[10px]">PLATE #</th>
                  <th colSpan={2} scope="col" className="px-2 py-1 text-[10px] text-center bg-blue-100/70 border-b border-blue-200">RECIEPT TYPE</th>
                  <th scope="col" className="px-2 py-1 text-[10px] bg-blue-50 border-b border-blue-200"></th>
                  <th scope="col" className="px-2 py-1 text-[10px] text-center bg-blue-100/70 border-b border-blue-200 min-w-[130px]">BUSINESS STYLE</th>
                  <th scope="col" className="px-2 py-1 text-[10px] text-center bg-blue-100/70 border-b border-blue-200 min-w-[90px]">PAYMENT TYPE</th>
                  <th rowSpan={2} scope="col" className="px-2 py-2 text-[10px] text-center align-middle whitespace-nowrap">TOTAL AMOUNT</th>
                  <th rowSpan={2} scope="col" className="px-2 py-2 text-[10px] text-center align-middle">CASHIER</th>
                  <th rowSpan={2} scope="col" className="px-2 py-2 text-[10px] text-center align-middle">REMARKS</th>
                  <th rowSpan={2} scope="col" className="px-3 py-2 text-[10px] text-center print:hidden whitespace-nowrap sticky right-0 bg-blue-50/95 backdrop-blur-sm z-20 min-w-[85px] border-l !border-gray-200 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">ACTIONS</th>
                </tr>
                <tr>
                  <th scope="col" className="px-2 py-1 text-[9px] text-center w-14 bg-blue-100/40">JO/AR</th>
                  <th scope="col" className="px-2 py-1 text-[9px] text-center w-12 bg-blue-100/40">OR</th>
                  <th scope="col" className="px-2 py-1 text-[9px] text-center min-w-[70px] bg-blue-50/70">JO/AR/OR<br/>#</th>
                  <th scope="col" className="px-2 py-1 text-[9px] text-center bg-blue-50/70 font-semibold">IN PAYMENT OF THE FF SERVICE/<br/>TRANSACTION/ DESCRIPTION</th>
                  <th scope="col" className="px-2 py-1 text-[9px] text-center bg-blue-50/70 font-semibold">CASH / CHECK/ QR PAY<br/>/ BANK TRANSFER</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={isSelectMode ? 16 : 15} className="px-4 py-12 text-center !text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading collection records...
                    </td>
                  </tr>
                ) : filteredCollections.length === 0 ? (
                  <tr>
                    <td colSpan={isSelectMode ? 16 : 15} className="px-4 py-12 text-center !text-gray-500">
                      {reportPeriod === 'monthly' ? `There's no records of collections in this month of ${
                        [
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ][parseInt(selectedMonth.split('-')[1]) - 1] || ""
                      }.` : "No collection records found."}
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group cursor-pointer" 
                      onClick={() => !isSelectMode && setViewingCollection(item)}
                    >
                      {isSelectMode && (
                        <td className="px-3 py-2 print:hidden w-10 text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedCollections.includes(item.id)}
                            onCheckedChange={(checked) => toggleSelect(item.id, checked as boolean)}
                            aria-label={`Select collection ${item.id}`}
                          />
                        </td>
                      )}
                      <td className="px-2 py-2 font-mono text-[11px] text-gray-500 text-center">{index + 1}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] font-mono">
                        {format(parseISO(item.date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-2 py-2 font-bold !text-gray-900 text-xs uppercase">{item.customer_name}</td>
                      <td className="px-2 py-2 text-[11px] text-gray-700 uppercase">{item.address}</td>
                      <td className="px-2 py-2 text-[11px] font-medium uppercase text-gray-800">{item.unit}</td>
                      <td className="px-2 py-2 font-mono font-bold text-gray-700 text-[11px] uppercase">{item.plate}</td>
                      <td className="px-2 py-2 text-center">
                        {item.receipt_type === "JO" || item.receipt_type === "AR" ? (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                            item.receipt_type === "JO" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          )}>
                            {item.receipt_type}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {item.receipt_type === "OR" ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                            OR
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 font-mono text-[11px] text-gray-800 font-medium text-center">{item.receipt_number}</td>
                      <td className="px-2 py-2 !text-gray-900 text-xs uppercase leading-tight max-w-[200px] truncate" title={item.description}>{item.description}</td>
                      <td className="px-2 py-2 text-[11px] font-semibold uppercase text-gray-700">{item.payment_type}</td>
                      <td className="px-2 py-2 text-right font-bold !text-gray-900 text-xs font-mono whitespace-nowrap">
                        ₱ {item.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-2 text-[11px] uppercase font-medium text-gray-800">{item.cashier_name}</td>
                      <td className="px-2 py-2 text-gray-600 italic text-[11px] max-w-[120px] truncate" title={item.remarks || ""}>{item.remarks || "-"}</td>
                      <td className="px-2 py-2 text-center whitespace-nowrap print:hidden sticky right-0 bg-white group-hover:bg-blue-50/90 transition-colors z-10 min-w-[85px] border-l !border-gray-200 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity print:hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600 hover:bg-blue-100 rounded-md"
                            onClick={() => openModal(item)}
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600 hover:bg-red-100 rounded-md"
                            onClick={() => setCollectionToDelete(item.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredCollections.length > 0 && (
                <tbody className="!bg-gray-50 font-bold border-t-2 !border-gray-200">
                  <tr>
                    <td colSpan={isSelectMode ? 12 : 11} className="px-4 py-4 text-right !text-gray-700 uppercase">
                      {reportPeriod === 'daily' ? 'Daily' : reportPeriod === 'weekly' ? 'Weekly' : reportPeriod === 'monthly' ? 'Monthly' : reportPeriod === 'yearly' ? 'Yearly' : 'Overall'} Total Collections:
                    </td>
                    <td className="px-4 py-4 text-right text-xl font-black text-blue-700 font-mono whitespace-nowrap">
                      ₱ {totalFilteredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td colSpan={3} className="sticky right-0 bg-gray-50 z-10 border-l !border-gray-200"></td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT COLLECTION (FORCED LIGHT THEME) ================= */}
      <Dialog 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setTimeout(() => setEditingCollection(null), 250)
          }
        }}
      >
        <DialogContent className="!bg-white !text-gray-900 !border-gray-200 sm:max-w-[700px] shadow-2xl z-[120]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold !text-gray-900">
              {editingCollection ? "Edit Collection Record" : "Add New Collection"}
            </DialogTitle>
            <DialogDescription className="!text-gray-500">
              Fill in the collection details below. Required fields are marked with an asterisk (<span className="text-red-500">*</span>).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="date" className="!text-gray-700 font-semibold text-xs uppercase">Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="date"
                    type="date"
                    style={{ colorScheme: "light" }}
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 [color-scheme:light]"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="customer_name" className="!text-gray-700 font-semibold text-xs uppercase">Customer Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="customer_name"
                    required
                    placeholder="e.g. REYES"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address" className="!text-gray-700 font-semibold text-xs uppercase">Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="address"
                    required
                    placeholder="e.g. KAUSWAGAN, CDO"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="unit" className="!text-gray-700 font-semibold text-xs uppercase">Unit (Vehicle) <span className="text-red-500">*</span></Label>
                    <Input
                      id="unit"
                      required
                      placeholder="e.g. HILUX"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="plate" className="!text-gray-700 font-semibold text-xs uppercase">Plate # <span className="text-red-500">*</span></Label>
                    <Input
                      id="plate"
                      required
                      placeholder="e.g. KCE 200"
                      value={formData.plate}
                      onChange={(e) => setFormData({...formData, plate: e.target.value})}
                      className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description" className="!text-gray-700 font-semibold text-xs uppercase">Business Style / Description <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="description"
                    required
                    rows={2}
                    placeholder="e.g. COST OF REPAIR - FULL PAYMENT"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 uppercase text-xs"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="receipt_type" className="!text-gray-700 font-semibold text-xs uppercase">Receipt Type <span className="text-red-500">*</span></Label>
                    <Select value={formData.receipt_type} onValueChange={(val) => setFormData({...formData, receipt_type: val})}>
                      <SelectTrigger className="!bg-white !border-gray-300 !text-gray-900">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent className="!bg-white !border-gray-200 z-[130]">
                        <SelectItem value="JO" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 font-medium">JO (Job Order)</SelectItem>
                        <SelectItem value="AR" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 font-medium">AR (Ack. Receipt)</SelectItem>
                        <SelectItem value="OR" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 font-medium">OR (Official Receipt)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receipt_number" className="!text-gray-700 font-semibold text-xs uppercase">Receipt # <span className="text-red-500">*</span></Label>
                    <Input
                      id="receipt_number"
                      required
                      placeholder="e.g. 0010"
                      value={formData.receipt_number}
                      onChange={(e) => setFormData({...formData, receipt_number: e.target.value})}
                      className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="payment_type" className="!text-gray-700 font-semibold text-xs uppercase">Payment Type <span className="text-red-500">*</span></Label>
                  <Select value={formData.payment_type} onValueChange={(val) => setFormData({...formData, payment_type: val})}>
                    <SelectTrigger className="!bg-white !border-gray-300 !text-gray-900">
                      <SelectValue placeholder="Payment Type" />
                    </SelectTrigger>
                    <SelectContent className="!bg-white !border-gray-200 z-[130]">
                      <SelectItem value="CASH" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 font-medium">CASH</SelectItem>
                      <SelectItem value="CHECK" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 font-medium">CHECK</SelectItem>
                      <SelectItem value="QR PAY" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 font-medium">QR PAY (GCASH / MAYA)</SelectItem>
                      <SelectItem value="BANK TRANSFER" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 font-medium">BANK TRANSFER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="total_amount" className="!text-gray-700 font-semibold text-xs uppercase">Total Amount (₱) <span className="text-red-500">*</span></Label>
                  <Input
                    id="total_amount"
                    type="text"
                    inputMode="decimal"
                    required
                    onFocus={(e) => e.target.select()}
                    value={formData.total_amount}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9.]/g, '');
                      if (val === '') {
                        setFormData({...formData, total_amount: ''});
                        return;
                      }
                      const parts = val.split('.');
                      if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                      if (parts[0]) parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
                      val = parts.join('.');
                      setFormData({...formData, total_amount: val});
                    }}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 text-lg font-bold text-blue-700"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cashier_name" className="!text-gray-700 font-semibold text-xs uppercase">Cashier Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="cashier_name"
                    required
                    placeholder="e.g. GENELYN"
                    value={formData.cashier_name}
                    onChange={(e) => setFormData({...formData, cashier_name: e.target.value})}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="remarks" className="!text-gray-700 font-semibold text-xs uppercase">Remarks</Label>
                  <Input
                    id="remarks"
                    placeholder="Optional remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t !border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="!bg-white !border-gray-300 !text-gray-700 hover:!bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Save Collection</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      <Dialog open={!!collectionToDelete} onOpenChange={(open) => !open && setCollectionToDelete(null)}>
        <DialogContent className="!bg-white !border-gray-200 !text-gray-900 sm:max-w-md z-[120]">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-bold flex items-center">
              <Trash2 className="w-5 h-5 mr-2" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Are you sure you want to delete this collection record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setCollectionToDelete(null)}
              className="!bg-white !border-gray-300 !text-gray-700 hover:!bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => collectionToDelete && handleDelete(collectionToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: VIEW COLLECTION INSPECTOR ================= */}
      <Dialog open={!!viewingCollection} onOpenChange={(open) => !open && setViewingCollection(null)}>
        <DialogContent className="!bg-white sm:max-w-[650px] !border-gray-200 shadow-2xl overflow-hidden p-0 z-[120]">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-gray-900">Collection Record Inspector</DialogTitle>
              <DialogDescription className="text-[11px] text-gray-500">
                Detailed parameters and metadata for this collection entry.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {viewingCollection && (
            <div className="p-5 space-y-3">
              {/* Row 1: Key Summary */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Receipt</p>
                  <p className="text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1.5 rounded-md truncate">
                    {viewingCollection.receipt_type} #{viewingCollection.receipt_number}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Date</p>
                  <p className="text-xs font-medium text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-md">
                    {format(parseISO(viewingCollection.date), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total Amount</p>
                  <p className="text-xs font-extrabold text-blue-900 bg-blue-100/70 px-2.5 py-1.5 rounded-md font-mono">
                    ₱ {viewingCollection.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Row 2: Customer & Address */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Customer Name</p>
                  <p className="text-xs font-bold text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-md uppercase">
                    {viewingCollection.customer_name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Address</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md uppercase truncate">
                    {viewingCollection.address}
                  </p>
                </div>
              </div>

              {/* Row 3: Vehicle */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Unit (Vehicle)</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md uppercase">{viewingCollection.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Plate Number</p>
                  <p className="text-xs font-bold text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md font-mono uppercase">{viewingCollection.plate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Payment Type</p>
                  <p className="text-xs font-bold text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-md uppercase">{viewingCollection.payment_type}</p>
                </div>
              </div>

              {/* Row 4: Description */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Business Style / Service / Description</p>
                <p className="text-xs font-semibold text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-100 whitespace-pre-wrap uppercase">
                  {viewingCollection.description}
                </p>
              </div>

              {/* Row 5: Cashier & Remarks */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Cashier Name</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md uppercase">{viewingCollection.cashier_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Remarks</p>
                  <p className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-md italic truncate">
                    {viewingCollection.remarks || "No remarks provided."}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
            {viewingCollection && (
              <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-sans">
                <p><span className="font-semibold text-gray-600">ID:</span> <span className="font-mono text-gray-700">{viewingCollection.id.slice(0, 18)}...</span></p>
                <p><span className="font-semibold text-gray-600">Created By:</span> <span className="text-blue-600 font-medium">{viewingCollection.created_by || "System"}</span></p>
              </div>
            )}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <Button
                variant="outline"
                onClick={() => {
                  if (viewingCollection) {
                    const toEdit = viewingCollection
                    setViewingCollection(null)
                    openModal(toEdit)
                  }
                }}
                className="!bg-white !border-gray-300 text-blue-700 hover:!bg-blue-50 font-bold text-xs h-8 px-3"
              >
                <Edit className="w-3.5 h-3.5 mr-1" /> Edit Record
              </Button>
              <Button
                onClick={() => setViewingCollection(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-4"
              >
                Close
              </Button>
            </div>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
