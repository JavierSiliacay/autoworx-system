"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
Search, Plus, Loader2, Edit, Trash2, Calendar as CalendarIcon, FileDown, ListChecks,
RefreshCw, Check, X, Printer, ChevronsUpDown, FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { format, startOfMonth, endOfMonth, parseISO, getISOWeek, getISOWeekYear, setISOWeek, setISOWeekYear, startOfISOWeek, endOfISOWeek } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface Expense {
id: string
created_at: string
category: string
description: string
date_issued: string
charge_to: string | null
invoice_number?: string | null
supplier_name?: string | null
unit_vehicle: string | null
plate_number: string | null
type_of_payment: string | null
total_amount: number
remarks: string | null
created_by?: string
}

const CATEGORIES = [
"PAYROLL",
"EMPLOYEES BENEFITS",
"RENTALS",
"PROPERTY TAXES",
"UTILITIES",
"TELEPHONE/INTERNET",
"REPAIR AND MAINTENANCE",
"SHOP PARTS AND GOODS",
"OFFICE EXPENSES",
"UNIFORMS",
"INSURANCE",
"REPRESENTATIONS",
"PROFESSIONAL FEES",
"MEALS AND ENTERTAINMENTS",
"FOODS",
"BUILDING MAINTENANCE",
"IT",
"ADVERTISING/MARKETING",
"OTHER/MISCELLANEOUS",
"CUSTOM"
]

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "PAYROLL": "INCLUDING INCENTIVES, CONTRACT BODY BUILDER, CONTRACT PAINTER",
  "EMPLOYEES BENEFITS": "SSS, PHILHEALTH, INSURANCE, HEALTH CARDS",
  "RENTALS": "",
  "PROPERTY TAXES": "",
  "UTILITIES": "WATER, ELECTRICITY, GAS, GARBAGE COLLECTION, ETC",
  "TELEPHONE/INTERNET": "",
  "REPAIR AND MAINTENANCE": "SHOP, AND OTHERS",
  "SHOP PARTS AND GOODS": "PARTS AND GOODS",
  "OFFICE EXPENSES": "OFFICE SUPPLY",
  "UNIFORMS": "",
  "INSURANCE": "SHOP INSURANCE, FIRE, CALAMITY, ETC",
  "REPRESENTATIONS": "COM-INSURANCE, AGENTS AND OTHER",
  "PROFESSIONAL FEES": "BOOKKEEPER, ACCOUNTANT, ETC",
  "MEALS AND ENTERTAINMENTS": "SPECIAL OCCASIONS",
  "FOODS": "FOOD EVERY SATURDAY AND DAILY LUNCH AND OTHERS",
  "BUILDING MAINTENANCE": "",
  "IT": "",
  "ADVERTISING/MARKETING": "",
  "OTHER/MISCELLANEOUS": "",
  "CUSTOM": ""
}


function formatWeekRange(weekStr: string) {
  if (!weekStr || !weekStr.includes('-W')) return weekStr;
  const [yearStr, weekNumStr] = weekStr.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekNumStr, 10);
  let d = new Date();
  d = setISOWeekYear(d, year);
  d = setISOWeek(d, week);
  const start = startOfISOWeek(d);
  const end = endOfISOWeek(d);
  
  const endFormat = start.getMonth() === end.getMonth() ? 'd, yyyy' : 'MMMM d, yyyy';
  return `from ${format(start, 'MMMM d')} - ${format(end, endFormat)}`;
}
export function ExpensesMonitoring() {
const [expenses, setExpenses] = useState<Expense[]>([])
const [isLoading, setIsLoading] = useState(true)
const [searchQuery, setSearchQuery] = useState("")
const [viewMode, setViewMode] = useState<"detailed" | "summary">("detailed")
const [categoryFilter, setCategoryFilter] = useState("all")
const currentYear = new Date().getFullYear().toString()
const currentMonthKey = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly" | "all">("daily")
const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), "yyyy-MM-dd"))
const [selectedWeek, setSelectedWeek] = useState<string>(() => {
const d = new Date();
return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
})
const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)
const [selectedYear, setSelectedYear] = useState<string>(currentYear)
const { toast } = useToast()

// Modal State
const [isModalOpen, setIsModalOpen] = useState(false)
const [categoryOpen, setCategoryOpen] = useState(false)
const [categorySearch, setCategorySearch] = useState("")
const [isSubmitting, setIsSubmitting] = useState(false)
const [hasSubmitted, setHasSubmitted] = useState(false)
const [isAddModalOpen, setIsAddModalOpen] = useState(false)
const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
const [viewingExpense, setViewingExpense] = useState<Expense | null>(null)
const [summaryCategoryModal, setSummaryCategoryModal] = useState<string | null>(null)

// Form State
const [formData, setFormData] = useState({
category: "",
customCategory: "",
description: "",
date_issued: format(new Date(), "yyyy-MM-dd"),
charge_to: "",
invoice_number: "",
supplier_name: "",
unit_vehicle: "",
plate_number: "",
type_of_payment: "",
custom_payment_type: "",
total_amount: "",
remarks: ""
})

// Delete Confirm State
const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)

  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) return
    const confirm = window.confirm(`Are you sure you want to delete ${selectedExpenses.length} expenses?`)
    if (!confirm) return
    setIsLoading(true)
    try {
      await Promise.all(selectedExpenses.map(id => fetch(`/api/expenses?id=${id}`, { method: "DELETE" })))
      toast({ title: "Success", description: `${selectedExpenses.length} expenses deleted.` })
      setSelectedExpenses([])
      fetchExpenses()
    } catch(error) {
      toast({ title: "Error", description: "Failed to delete some expenses.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(filteredExpenses.map(e => e.id))
    } else {
      setSelectedExpenses([])
    }
  }

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedExpenses(prev => [...prev, id])
    } else {
      setSelectedExpenses(prev => prev.filter(item => item !== id))
    }
  }


const renderHighlightedCategory = (text: string) => {
if (!categorySearch.trim()) return text;
const regex = new RegExp(`(${categorySearch.trim()})`, "gi");
const parts = text.split(regex);
return (
<span>
{parts.map((part, i) =>
regex.test(part) ? (
<span key={i} className="text-blue-600 font-bold">
{part}
</span>
) : (
<span key={i}>{part}</span>
)
)}
</span>
);
};

const { availableMonths, availableYears } = useMemo(() => {
const monthsMap = new Map<string, string>()
const yearsSet = new Set<string>()

expenses.forEach(r => {
const d = new Date(r.date_issued)
if (!isNaN(d.getTime())) {
const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
monthsMap.set(key, d.toLocaleDateString("en-US", { month: "long", year: "numeric" }))
yearsSet.add(d.getFullYear().toString())
}
})

const d = new Date()
const currentKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
monthsMap.set(currentKey, d.toLocaleDateString("en-US", { month: "long", year: "numeric" }))
yearsSet.add(d.getFullYear().toString())

return {
availableMonths: Array.from(monthsMap.entries()).sort((a, b) => b[0].localeCompare(a[0])),
availableYears: Array.from(yearsSet).sort((a, b) => b.localeCompare(a))
}
}, [expenses])

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses")
      if (res.ok) {
        const data = await res.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

useEffect(() => {
const supabase = createClient()
const channel = supabase
.channel('schema-db-changes')
.on(
'postgres_changes',
{
event: '*',
schema: 'public',
table: 'expenses'
},
(payload) => {
fetchExpenses()
}
)
.subscribe()

return () => {
supabase.removeChannel(channel)
}
}, [])


// Tokenized Search Logic
const filteredExpenses = useMemo(() => {
let result = expenses

// Period filter
result = result.filter(expense => {
const d = new Date(expense.date_issued)
if (isNaN(d.getTime())) return false

if (reportPeriod === "daily") {
return expense.date_issued === selectedDay
} else if (reportPeriod === "weekly") {
if (!selectedWeek || !selectedWeek.includes('-W')) return false;
const [yearStr, weekStr] = selectedWeek.split('-W');
const year = parseInt(yearStr, 10);
const week = parseInt(weekStr, 10);
return getISOWeekYear(d) === year && getISOWeek(d) === week;
} else if (reportPeriod === "monthly") {
const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
return key === selectedMonth
} else if (reportPeriod === "yearly") {
const year = d.getFullYear().toString()
return selectedYear === "all" || year === selectedYear
}
return true
})

    if (categoryFilter !== "all") {
      result = result.filter(expense => expense.category === categoryFilter)
    }

if (searchQuery.trim()) {
const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
result = result.filter(expense => {
const searchableString = `
${expense.category}
${expense.description}
${expense.charge_to || ""}
${expense.invoice_number || ""}
${expense.supplier_name || ""}
${expense.unit_vehicle || ""}
${expense.plate_number || ""}
${expense.remarks || ""}
${expense.total_amount}
`.toLowerCase()

return tokens.every(token => searchableString.includes(token))
})
}

// Sort descending by date issued
return result.sort((a, b) => new Date(a.date_issued).getTime() - new Date(b.date_issued).getTime())
}, [expenses, searchQuery, categoryFilter, reportPeriod, selectedDay, selectedWeek, selectedMonth, selectedYear])

const openModal = (expense?: Expense) => {
setHasSubmitted(false)
if (expense) {
setEditingExpense(expense)
const isCustom = !CATEGORIES.includes(expense.category) && expense.category !== ""
setFormData({
category: isCustom ? "CUSTOM" : expense.category,
customCategory: isCustom ? expense.category : "",
description: expense.description,
date_issued: expense.date_issued,
charge_to: expense.charge_to || "",
invoice_number: expense.invoice_number || "",
supplier_name: expense.supplier_name || "",
unit_vehicle: expense.unit_vehicle || "",
plate_number: expense.plate_number || "",
type_of_payment: expense.type_of_payment && !["Cash", "Cheque", "Check", "Bank Transfer"].includes(expense.type_of_payment) ? "CUSTOM" : (expense.type_of_payment === "Check" ? "Cheque" : (expense.type_of_payment || "")),
custom_payment_type: expense.type_of_payment && !["Cash", "Cheque", "Check", "Bank Transfer"].includes(expense.type_of_payment) ? expense.type_of_payment : "",
total_amount: expense.total_amount.toLocaleString('en-US', {maximumFractionDigits:2}),
remarks: expense.remarks || ""
})
} else {
setEditingExpense(null)
setFormData({
category: "",
customCategory: "",
description: "",
date_issued: format(new Date(), "yyyy-MM-dd"),
charge_to: "",
invoice_number: "",
supplier_name: "",
unit_vehicle: "",
plate_number: "",
type_of_payment: "",
custom_payment_type: "",
total_amount: "",
remarks: ""
})
}
setIsModalOpen(true)
}

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault()
setHasSubmitted(true)

if (formData.type_of_payment === "CUSTOM" && !formData.custom_payment_type.trim()) {
toast({
title: "Required Field",
description: "Please specify the custom payment type.",
variant: "destructive"
})
return
}

setIsSubmitting(true)

try {
const finalCategory = formData.category === "CUSTOM" ? formData.customCategory : formData.category
const finalPaymentType = formData.type_of_payment === "CUSTOM" ? formData.custom_payment_type : formData.type_of_payment

const payload = {
id: editingExpense?.id,
category: finalCategory,
description: formData.description,
date_issued: formData.date_issued,
charge_to: formData.charge_to,
invoice_number: formData.invoice_number,
supplier_name: formData.supplier_name,
unit_vehicle: formData.unit_vehicle,
plate_number: formData.plate_number,
type_of_payment: finalPaymentType,
total_amount: parseFloat(String(formData.total_amount).replace(/,/g, '')) || 0,
remarks: formData.remarks
}

const method = editingExpense ? "PUT" : "POST"

const res = await fetch("/api/expenses", {
method,
headers: { "Content-Type": "application/json" },
body: JSON.stringify(payload)
})

if (!res.ok) throw new Error("Failed to save expense")

const savedExpense = await res.json()
if (savedExpense && savedExpense.id) {
  setExpenses(prev => {
    if (editingExpense) {
      return prev.map(item => item.id === savedExpense.id ? savedExpense : item)
    }
    return [savedExpense, ...prev]
  })
} else {
  fetchExpenses()
}

toast({
title: "Success",
description: `Expense successfully ${editingExpense ? "updated" : "added"}.`
})

setIsModalOpen(false)
} catch (error) {
toast({
title: "Error",
description: "Failed to save expense.",
variant: "destructive"
})
} finally {
setIsSubmitting(false)
}
}

const handleDelete = async (id: string) => {
setExpenses(prev => prev.filter(item => item.id !== id))
try {
const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" })
if (!res.ok) {
fetchExpenses()
throw new Error("Failed to delete")
}
toast({ title: "Success", description: "Expense deleted." })
setExpenseToDelete(null)
} catch (error) {
fetchExpenses()
toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" })
}
}

const categorySummaries = useMemo(() => {
  const map: Record<string, { cash: number; cheque: number; total: number; descriptions: string[]; remarks: string[] }> = {}

  CATEGORIES.forEach(cat => {
    map[cat] = { cash: 0, cheque: 0, total: 0, descriptions: [], remarks: [] }
  })

  filteredExpenses.forEach(exp => {
    const rawCat = (exp.category || "").trim().toUpperCase()
    const catKey = CATEGORIES.includes(rawCat) ? rawCat : "CUSTOM"
    if (!map[catKey]) {
      map[catKey] = { cash: 0, cheque: 0, total: 0, descriptions: [], remarks: [] }
    }

    const payType = (exp.type_of_payment || "").trim().toLowerCase()
    if (payType.includes("cheque") || payType.includes("check")) {
      map[catKey].cheque += exp.total_amount
    } else {
      map[catKey].cash += exp.total_amount
    }
    map[catKey].total += exp.total_amount

    if (exp.description && exp.description.trim()) {
      if (!map[catKey].descriptions.includes(exp.description.trim())) {
        map[catKey].descriptions.push(exp.description.trim())
      }
    }

    if (exp.remarks && exp.remarks.trim()) {
      if (!map[catKey].remarks.includes(exp.remarks.trim())) {
        map[catKey].remarks.push(exp.remarks.trim())
      }
    }
  })

  return map
}, [filteredExpenses])

const modalCategoryExpenses = useMemo(() => {
  if (!summaryCategoryModal) return []
  return filteredExpenses.filter(exp => {
    const rawCat = (exp.category || "").trim().toUpperCase()
    if (summaryCategoryModal === "CUSTOM") {
      return !CATEGORIES.filter(c => c !== "CUSTOM").includes(rawCat)
    }
    return rawCat === summaryCategoryModal
  })
}, [filteredExpenses, summaryCategoryModal])

const totalFilteredAmount = filteredExpenses.reduce((acc, curr) => acc + curr.total_amount, 0)

return (
// FORCED LIGHT MODE WRAPPER
<div className="min-h-screen print:min-h-0 print:h-auto print:block !bg-gray-50 !text-gray-900 font-sans p-6 print:p-0 print:!bg-white">

{/* Watermark only visible in print */}
<div className="hidden print:flex fixed inset-0 pointer-events-none items-center justify-center z-50">
  <img src="/autoworxlogo.png" alt="Autoworx Watermark" className="w-[500px] max-w-[70%] object-contain opacity-10 mix-blend-multiply" />
</div>

<style>{`
@media print {
  @page {
    margin: 10mm;
    background-color: #ffffff;
  }
  html, body, #__next, body > div, main {
    background-color: #ffffff !important;
    background: #ffffff !important;
    color: #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  table { page-break-inside: auto; }
  tr    { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
}
`}</style>

{/* Header Section */}
<div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b !border-gray-300 pb-4 print:hidden relative z-10">
<div>
<h2 className="text-sm font-semibold !text-gray-500 uppercase tracking-wider">
{reportPeriod === "daily" ? "DAILY OUTGOING EXPENSES" : reportPeriod === "weekly" ? "WEEKLY OUTGOING EXPENSES" : reportPeriod === "monthly" ? "MONTHLY OUTGOING EXPENSES" : reportPeriod === "yearly" ? "YEARLY OUTGOING EXPENSES" : "OVERALL OUTGOING EXPENSES"}
</h2>
<div className="flex flex-wrap items-center gap-3 mt-1">
  <h1 className="text-2xl md:text-3xl font-extrabold !text-gray-900 tracking-tight">EXPENSES REPORT MONITORING</h1>
  
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
      Overhead Summary Report
    </button>
  </div>
</div>
</div>
<div className="flex items-center gap-3 print:hidden">
<Button onClick={fetchExpenses} variant="outline" size="icon" className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100">
<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
</Button>
<Button onClick={() => window.print()} variant="outline" className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100">
<Printer className="h-4 w-4 mr-2" /> Print Report
</Button>

{selectedExpenses.length > 0 && (
  <Button onClick={handleBulkDelete} variant="destructive" className="font-medium shadow-sm">
    <Trash2 className="h-4 w-4 mr-2" /> Delete Selected ({selectedExpenses.length})
  </Button>
)}
<Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
<Plus className="h-4 w-4 mr-2" /> Add Expense
</Button>
</div>
</div>

{/* Filters Section */}
<div className="!bg-white p-4 rounded-xl shadow-sm border !border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
<div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-[600px]">
<div className="relative w-full">
<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
<Input
placeholder="Search category, description, client, plate..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
className="pl-9 !bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 focus-visible:ring-blue-500 !text-gray-900 placeholder:!text-gray-500 w-full"
/>
</div>
<Select value={categoryFilter} onValueChange={setCategoryFilter}>
<SelectTrigger className="w-[180px] shrink-0 !bg-white !border-gray-300 !text-gray-900">
<SelectValue placeholder="All Categories" />
</SelectTrigger>
<SelectContent className="!bg-white">
<SelectItem value="all" className="!text-gray-900 cursor-pointer hover:bg-gray-100">All Categories</SelectItem>
{CATEGORIES.filter(c => c !== "CUSTOM").map(cat => (
<SelectItem key={cat} value={cat} className="!text-gray-900 cursor-pointer hover:bg-gray-100">{cat}</SelectItem>
))}
<SelectItem value="CUSTOM" className="!text-gray-900 cursor-pointer hover:bg-gray-100">Custom</SelectItem>
</SelectContent>
</Select>
<Button 
  onClick={() => { 
    setIsSelectMode(!isSelectMode); 
    if (isSelectMode) setSelectedExpenses([]);
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
type="date" style={{ colorScheme: "light" }}
value={selectedDay}
onChange={(e) => setSelectedDay(e.target.value)}
className="w-[150px] !bg-white !border-gray-300 focus-visible:ring-blue-500 !text-gray-900"
/>
</div>
) : reportPeriod === "weekly" ? (
<div className="flex items-center gap-2">
<Input
type="week" style={{ colorScheme: "light" }}
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
  const m = String(index + 1).padStart(2, '0');
  const key = `${selectedYear}-${m}`;
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

{/* Table / Summary Section */}
{viewMode === "summary" ? (
  <div className="!bg-white rounded-xl shadow-sm border !border-gray-200 p-4 md:p-6 print:shadow-none print:border-none print:p-0 relative z-10">
    <div className="overflow-x-auto print:overflow-visible">
      {/* Header section inside print preview */}
      <div className="hidden print:block mb-4 border-b border-gray-300 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-black">
              MONTHLY OVERHEAD EXPENSES REPORT SUMMARY
            </h1>
            <p className="text-xs font-bold text-gray-700 uppercase mt-1">
              AS OF: <span className="text-blue-700 font-extrabold">{reportPeriod === 'daily' ? format(parseISO(selectedDay), "MMMM d, yyyy") : reportPeriod === 'weekly' ? formatWeekRange(selectedWeek) : reportPeriod === 'monthly' ? format(parseISO(selectedMonth + '-01'), "MMMM yyyy") : (selectedYear === 'all' ? 'All Time' : selectedYear)}</span>
            </p>
          </div>
          <div className="text-right text-xs text-gray-600 font-semibold">
            <p>Autoworx Repair & General Mdse.</p>
            <p className="text-[10px] text-gray-500">Date Printed: {format(new Date(), "PPpp")}</p>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse text-xs text-left !text-gray-800 border border-gray-300 print:text-[10px] print:[&_th]:px-1.5 print:[&_th]:py-1 print:[&_td]:px-1.5 print:[&_td]:py-1">
        <thead>
          <tr className="bg-blue-50 border-b border-gray-300 text-gray-900 font-bold uppercase" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <th rowSpan={2} className="border border-gray-300 px-2 py-2 text-center w-10">No.</th>
            <th rowSpan={2} className="border border-gray-300 px-3 py-2 min-w-[160px]">CATEGORY DESCRIPTION</th>
            <th rowSpan={2} className="border border-gray-300 px-3 py-2 min-w-[200px]">TYPE OF EXPENSE</th>
            <th colSpan={2} className="border border-gray-300 px-2 py-1 text-center">PAYMENT TYPE</th>
            <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-right min-w-[110px]">TOTAL AMOUNT</th>
            <th rowSpan={2} className="border border-gray-300 px-3 py-2 min-w-[120px]">REMARKS</th>
          </tr>
          <tr className="bg-blue-50 border-b border-gray-300 text-gray-900 font-bold uppercase text-[10px]" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <th className="border border-gray-300 px-2 py-1 text-center w-20">CHEQUE</th>
            <th className="border border-gray-300 px-2 py-1 text-center w-20">CASH</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.filter(cat => (categorySummaries[cat]?.total || 0) > 0).length === 0 ? (
            <tr>
              <td colSpan={7} className="border border-gray-300 px-4 py-8 text-center text-gray-500 font-medium italic">
                No outgoing expenses recorded for this period.
              </td>
            </tr>
          ) : (
            CATEGORIES.filter(cat => (categorySummaries[cat]?.total || 0) > 0).map((cat, idx) => {
              const data = categorySummaries[cat]
              return (
                <tr 
                  key={cat} 
                  onClick={() => setSummaryCategoryModal(cat)}
                  className="border-b border-gray-300 transition-colors bg-white hover:bg-blue-50/50 font-medium cursor-pointer group"
                  title={`Click to view all ${cat} expense entries`}
                >
                  <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-gray-700">{idx + 1}</td>
                  <td className="border border-gray-300 px-3 py-1.5 font-extrabold text-gray-900">
                    {cat}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-[10px] text-gray-700 uppercase font-semibold leading-tight max-w-[250px] truncate" title={data.descriptions.length > 0 ? data.descriptions.join(", ") : (CATEGORY_DESCRIPTIONS[cat] || "")}>
                    {data.descriptions.length > 0
                      ? data.descriptions.join(", ")
                      : (CATEGORY_DESCRIPTIONS[cat] || "")}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right text-gray-800 font-mono">
                    {data.cheque > 0 ? `₱${data.cheque.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right text-gray-800 font-mono">
                    {data.cash > 0 ? `₱${data.cash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right font-mono font-extrabold text-blue-900">
                    ₱{data.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-[10px] text-gray-600 italic">
                    {data.remarks.length > 0 ? data.remarks.join("; ") : ""}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-200 border-t-2 border-gray-400 font-black text-gray-900 text-sm">
            <td colSpan={5} className="border border-gray-300 px-4 py-3 text-right uppercase tracking-wider">
              TOTAL OVERHEAD EXPENSES
            </td>
            <td className="border border-gray-300 px-3 py-3 text-right font-mono text-base text-blue-950 font-black">
              ₱{totalFilteredAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td className="border border-gray-300 px-3 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    {/* Printable Signature Lines Footer */}
    <div className="mt-12 pt-6 grid grid-cols-3 gap-8 text-xs font-bold text-gray-800 border-t border-gray-200 print:mt-8">
      <div>
        <p className="mb-10">PREPARED BY:</p>
        <div className="border-b border-gray-800 w-4/5"></div>
      </div>
      <div>
        <p className="mb-10">NOTED BY:</p>
        <div className="border-b border-gray-800 w-4/5"></div>
      </div>
      <div>
        <p className="mb-10">APPROVED BY:</p>
        <div className="border-b border-gray-800 w-4/5"></div>
      </div>
    </div>
  </div>
) : (
<div className="!bg-white rounded-xl shadow-sm border !border-gray-200 overflow-hidden print:shadow-none print:border-none print:overflow-visible relative z-10">
<div className="overflow-x-auto print:overflow-visible">

<table className="w-full border-collapse text-sm text-left !text-gray-700 [&_th]:border [&_th]:!border-gray-200 [&_td]:border [&_td]:!border-gray-200 print:text-[10px] print:[&_th]:px-1 print:[&_th]:py-1 print:[&_td]:px-1 print:[&_td]:py-1">
<thead className="text-xs !text-gray-700 !bg-blue-50 border-b !border-blue-200 uppercase font-bold" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
<tr className="hidden print:table-row bg-white border-0">
<th colSpan={isSelectMode ? 14 : 13} className="border-0 bg-white px-0 py-4 font-normal normal-case">
<div className="flex flex-col w-full mb-4">
<h1 className="text-xl font-black uppercase tracking-tight text-black text-center mb-4">EXPENSES REPORT MONITORING</h1>
<div className="flex justify-between items-center mt-2">
<h2 className="text-base font-extrabold tracking-widest text-gray-900 uppercase">
{reportPeriod === "daily" ? "DAILY OUTGOING EXPENSES" : reportPeriod === "weekly" ? "WEEKLY OUTGOING EXPENSES" : reportPeriod === "monthly" ? "MONTHLY OUTGOING EXPENSES" : reportPeriod === "yearly" ? "YEARLY OUTGOING EXPENSES" : "OVERALL OUTGOING EXPENSES"}
</h2>
<div className="text-sm text-gray-800 flex flex-col items-end gap-1.5">
<p className="bg-gray-100/50 px-3 py-1 rounded-md border border-gray-200 shadow-sm"><span className="font-bold text-gray-900 mr-2 uppercase text-xs tracking-wider">Date printed:</span> <span className="text-blue-700 font-bold text-base">{format(new Date(), "PPpp")}</span></p>
<p className="bg-gray-100/50 px-3 py-1 rounded-md border border-gray-200 shadow-sm"><span className="font-bold text-gray-900 mr-2 uppercase text-xs tracking-wider">Period:</span> <span className="text-blue-700 font-bold text-base">{reportPeriod === 'daily' ? format(parseISO(selectedDay), "MMMM d, yyyy") : reportPeriod === 'weekly' ? formatWeekRange(selectedWeek) : reportPeriod === 'monthly' ? format(parseISO(selectedMonth + '-01'), "MMMM yyyy") : (selectedYear === 'all' ? 'All Time' : selectedYear)}</span></p>
</div>
</div>
</div>
</th>
</tr>
<tr>
{isSelectMode && (
<th scope="col" className="px-4 py-3 whitespace-nowrap print:hidden w-12">
  <Checkbox 
    checked={filteredExpenses.length > 0 && selectedExpenses.length === filteredExpenses.length}
    onCheckedChange={toggleSelectAll}
    aria-label="Select all"
  />
</th>
)}
<th scope="col" className="px-2 py-2 text-[10px]">NO.</th>
<th scope="col" className="px-2 py-2 text-[10px]">CATEGORY</th>
<th scope="col" className="px-2 py-2 text-[10px] min-w-[140px]">EXPENSES DESCRIPTION / TYPE OF EXPENSES</th>
<th scope="col" className="px-2 py-2 text-[10px] whitespace-nowrap">DATE ISSUE / DATE COVERED</th>
<th scope="col" className="px-2 py-2 text-[10px]">CHARGE TO</th>
<th scope="col" className="px-2 py-2 text-[10px]">INVOICE NO.</th>
<th scope="col" className="px-2 py-2 text-[10px]">SUPPLIER NAME</th>
<th scope="col" className="px-2 py-2 text-[10px]">UNIT/VEHICLE</th>
<th scope="col" className="px-2 py-2 text-[10px]">PLATE #</th>
<th scope="col" className="px-2 py-2 text-[10px]">PAYMENT</th>
<th scope="col" className="px-2 py-2 text-[10px] text-right whitespace-nowrap">TOTAL AMOUNT</th>
<th scope="col" className="px-2 py-2 text-[10px]">REMARKS</th>
<th scope="col" className="px-2 py-2 text-[10px] text-right print:hidden whitespace-nowrap">ACTIONS</th>
</tr>
</thead>
<tbody>
{isLoading ? (
<tr>
<td colSpan={isSelectMode ? 14 : 13} className="px-4 py-12 text-center !text-gray-500">
<Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
Loading expenses...
</td>
</tr>
) : filteredExpenses.length === 0 ? (
<tr>
<td colSpan={isSelectMode ? 14 : 13} className="px-4 py-12 text-center !text-gray-500">
{reportPeriod === 'monthly' ? `There's no records of expenses in this month of ${  [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ][parseInt(selectedMonth.split('-')[1]) - 1] || ""
}.` : "No expenses found."}
</td>
</tr>
) : (
filteredExpenses.map((expense, index) => (
<tr key={expense.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group cursor-pointer" onClick={() => !isSelectMode && setViewingExpense(expense)}>
{isSelectMode && (
<td className="px-3 py-2 print:hidden w-10" onClick={(e) => e.stopPropagation()}>
  <Checkbox 
    checked={selectedExpenses.includes(expense.id)}
    onCheckedChange={(checked) => toggleSelect(expense.id, checked as boolean)}
    aria-label={`Select expense ${expense.id}`}
  />
</td>
)}
<td className="px-2 py-2 font-mono text-[11px] text-gray-500">{index + 1}</td>
<td className="px-2 py-2 font-semibold text-blue-700 text-[11px] whitespace-nowrap">{expense.category}</td>
<td className="px-2 py-2 !text-gray-900 text-xs">{expense.description}</td>
<td className="px-2 py-2 whitespace-nowrap text-[11px]">
{format(parseISO(expense.date_issued), "MMM dd, yyyy")}
</td>
<td className="px-2 py-2 font-medium !text-gray-800 text-[11px]">{expense.charge_to || "-"}</td>
<td className="px-2 py-2 font-mono text-gray-700 text-[11px]">{expense.invoice_number || "-"}</td>
<td className="px-2 py-2 font-medium !text-gray-800 text-[11px]">{expense.supplier_name || "-"}</td>
<td className="px-2 py-2 text-[11px]">{expense.unit_vehicle || "-"}</td>
<td className="px-2 py-2 font-mono text-gray-600 text-[11px]">{expense.plate_number || "-"}</td>
<td className="px-2 py-2 text-[11px] font-semibold">{expense.type_of_payment || "-"}</td>
<td className="px-2 py-2 text-right font-bold !text-gray-900 text-xs whitespace-nowrap">
₱ {expense.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
</td>
<td className="px-2 py-2 text-gray-600 italic text-[11px] max-w-[120px] truncate" title={expense.remarks || ""}>{expense.remarks || "-"}</td>
<td className="px-2 py-2 text-right whitespace-nowrap print:hidden text-xs" onClick={(e) => e.stopPropagation()}>
<div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity print:hidden">
<Button
variant="ghost"
size="icon"
className="h-7 w-7 text-blue-600 hover:bg-blue-100"
onClick={() => openModal(expense)}
>
<Edit className="h-3.5 w-3.5" />
</Button>
<Button
variant="ghost"
size="icon"
className="h-7 w-7 text-red-600 hover:bg-red-100"
onClick={() => setExpenseToDelete(expense.id)}
>
<Trash2 className="h-3.5 w-3.5" />
</Button>
</div>
</td>
</tr>
))
)}
</tbody>
{filteredExpenses.length > 0 && (
<tbody className="!bg-gray-50 font-bold border-t-2 !border-gray-200">
<tr>
<td colSpan={10} className="px-4 py-4 text-right !text-gray-700 uppercase">
{reportPeriod === 'daily' ? 'Daily' : reportPeriod === 'weekly' ? 'Weekly' : reportPeriod === 'monthly' ? 'Monthly' : reportPeriod === 'yearly' ? 'Yearly' : 'Overall'} Total Expenses of {reportPeriod === 'daily' ? format(parseISO(selectedDay), "MMM d, yyyy") : reportPeriod === 'weekly' ? formatWeekRange(selectedWeek) : reportPeriod === 'monthly' ? format(parseISO(selectedMonth + '-01'), "MMMM yyyy") : (selectedYear === 'all' ? 'All Time' : selectedYear)}:
</td>
<td className="px-4 py-4 text-right text-xl text-blue-700 whitespace-nowrap">
₱ {totalFilteredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
</td>
<td colSpan={2}></td>
</tr>
</tbody>
)}
</table>
</div>
</div>
)}

{/* Add/Edit Modal (Forced Light Theme) */}
<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
<DialogContent className="!bg-white !text-gray-900 !border-gray-200 sm:max-w-[700px] shadow-xl">
<DialogHeader>
<DialogTitle className="text-xl font-bold !text-gray-900">
{editingExpense ? "Edit Expense Record" : "Add New Expense"}
</DialogTitle>
<DialogDescription className="!text-gray-500">
Fill in the details below. Required fields are marked with an asterisk (<span className="text-red-500">*</span>).
</DialogDescription>
</DialogHeader>

<form onSubmit={handleSubmit} className="space-y-4 mt-2">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

{/* Left Column */}
<div className="space-y-4">
<div className="space-y-1.5 relative">
<Label className="!text-gray-700 font-semibold text-xs uppercase">CATEGORY <span className="text-red-500">*</span></Label>
<Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
<PopoverTrigger asChild>
<Button
variant="outline"
role="combobox"
aria-expanded={categoryOpen}
className="w-full justify-between !bg-white !border-gray-300 !text-gray-900 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 h-10 font-normal hover:!bg-gray-100"
>
{formData.category ? formData.category : "Select a category"}
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-full p-0 !bg-white !border-gray-200" align="start">
<Command className="!bg-white" shouldFilter={false}>
<CommandInput
placeholder="Search category..."
value={categorySearch}
onValueChange={setCategorySearch}
className="!text-gray-900 border-none focus:ring-0"
/>
<CommandList className="max-h-[300px]">
<CommandEmpty className="!text-gray-500 p-4 text-center text-sm">No category found.</CommandEmpty>
<CommandGroup>
{CATEGORIES.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => (
<CommandItem
key={cat}
value={cat}
className="!text-gray-900 cursor-pointer aria-selected:bg-gray-100 hover:bg-gray-100"
onSelect={(currentValue) => {
setFormData({ ...formData, category: cat })
setCategorySearch("")
setCategoryOpen(false)
}}
>
<Check
className={cn(
"mr-2 h-4 w-4",
formData.category === cat ? "opacity-100 text-blue-600" : "opacity-0"
)}
/>
{renderHighlightedCategory(cat)}
</CommandItem>
))}
</CommandGroup>
</CommandList>
</Command>
</PopoverContent>
</Popover>
</div>

{formData.category === "CUSTOM" && (
<div className="space-y-1.5">
<Label htmlFor="customCategory" className="!text-gray-700 font-semibold text-xs uppercase">Custom Category <span className="text-red-500">*</span></Label>
<Input
id="customCategory"
required
autoFocus
value={formData.customCategory}
onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500"
placeholder="Enter custom category name"
/>
</div>
)}

<div className="space-y-1.5">
<Label htmlFor="date_issued" className="!text-gray-700 font-semibold text-xs uppercase">Date Issued <span className="text-red-500">*</span></Label>
<Input
id="date_issued"
type="date" style={{ colorScheme: "light" }}
required
value={formData.date_issued}
onChange={(e) => setFormData({...formData, date_issued: e.target.value})}
className={cn('!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 [color-scheme:light]', hasSubmitted && !formData.date_issued && '!border-red-500 focus-visible:!ring-red-500 !bg-red-50')}
/>
</div>

<div className="space-y-1.5">
<Label htmlFor="total_amount" className="!text-gray-700 font-semibold text-xs uppercase">Total Amount (₱) <span className="text-red-500">*</span></Label>
<Input
id="total_amount"
type="text"
inputMode="decimal"
required
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
className={cn('!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 text-lg font-bold', hasSubmitted && !formData.total_amount && '!border-red-500 focus-visible:!ring-red-500 !bg-red-50')}
placeholder="0.00"
/>
</div>
</div>

{/* Right Column */}
<div className="space-y-4">
<div className="space-y-1.5">
<Label htmlFor="charge_to" className="!text-gray-700 font-semibold text-xs uppercase">Charge To (Client Name) <span className="text-red-500">*</span></Label>
<Input
id="charge_to"
value={formData.charge_to}
onChange={(e) => setFormData({...formData, charge_to: e.target.value})}
className={cn('!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500', hasSubmitted && !formData.charge_to && '!border-red-500 focus-visible:!ring-red-500 !bg-red-50')}
placeholder="Client Name"
required
/>
</div>

<div className="grid grid-cols-2 gap-2">
<div className="space-y-1.5">
<Label htmlFor="invoice_number" className="!text-gray-700 font-semibold text-xs uppercase">Invoice No.</Label>
<Input
id="invoice_number"
value={formData.invoice_number}
onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 font-mono"
placeholder="Invoice #"
/>
</div>
<div className="space-y-1.5">
<Label htmlFor="supplier_name" className="!text-gray-700 font-semibold text-xs uppercase">Suppliers Name</Label>
<Input
id="supplier_name"
value={formData.supplier_name}
onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500"
placeholder="Supplier Name"
/>
</div>
</div>

<div className="grid grid-cols-2 gap-2">
<div className="space-y-1.5">
<Label htmlFor="unit_vehicle" className="!text-gray-700 font-semibold text-xs uppercase">Unit / Vehicle <span className="text-red-500">*</span></Label>
<Input
id="unit_vehicle"
value={formData.unit_vehicle}
onChange={(e) => setFormData({...formData, unit_vehicle: e.target.value})}
className={cn('!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500', hasSubmitted && !formData.unit_vehicle && '!border-red-500 focus-visible:!ring-red-500 !bg-red-50')}
placeholder="Vehicle details"
required
/>
</div>
<div className="space-y-1.5">
<Label htmlFor="plate_number" className="!text-gray-700 font-semibold text-xs uppercase">Plate # <span className="text-red-500">*</span></Label>
<Input
id="plate_number"
value={formData.plate_number}
onChange={(e) => setFormData({...formData, plate_number: e.target.value})}
className={cn('!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500', hasSubmitted && !formData.plate_number && '!border-red-500 focus-visible:!ring-red-500 !bg-red-50')}
placeholder="Plate number"
required
/>
</div>
<div className="space-y-1.5 relative">
<Label htmlFor="type_of_payment" className="!text-gray-700 font-semibold text-xs uppercase">Type of Payment <span className="text-red-500">*</span></Label>
<Select value={formData.type_of_payment} onValueChange={(val) => setFormData({...formData, type_of_payment: val})}>
<SelectTrigger className={cn("!bg-white !border-gray-300 focus:ring-blue-500 focus:ring-2 focus:border-blue-500 focus:ring-offset-0 !text-gray-900 w-full", hasSubmitted && !formData.type_of_payment && "!border-red-500 focus-visible:!ring-red-500 !bg-red-50")}>
<SelectValue placeholder="Select type" />
</SelectTrigger>
<SelectContent className="!bg-white !border-gray-200 z-[100]">
<SelectItem value="Cheque" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 focus:!bg-blue-600 focus:!text-white font-medium">Cheque</SelectItem>
<SelectItem value="Cash" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 focus:!bg-blue-600 focus:!text-white font-medium">Cash</SelectItem>
<SelectItem value="Bank Transfer" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 focus:!bg-blue-600 focus:!text-white font-medium">Bank Transfer</SelectItem>
<SelectItem value="CUSTOM" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 focus:!bg-blue-600 focus:!text-white font-medium">Custom</SelectItem>
</SelectContent>
</Select>
<input
tabIndex={-1}
autoComplete="off"
className="opacity-0 absolute bottom-0 left-1/4 w-1/2 h-0 pointer-events-none"
required
value={formData.type_of_payment}
onChange={() => {}}
onInvalid={(e) => {
setHasSubmitted(true)
}}
/>
</div>
{formData.type_of_payment === "CUSTOM" && (
<div className="space-y-1.5 col-span-2">
<Label htmlFor="custom_payment_type" className="!text-gray-700 font-semibold text-xs uppercase">Specify Custom Payment Type <span className="text-red-500">*</span></Label>
<Input
id="custom_payment_type"
value={formData.custom_payment_type}
onChange={(e) => setFormData({...formData, custom_payment_type: e.target.value})}
className={cn("!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500", hasSubmitted && !formData.custom_payment_type && "!border-red-500 focus-visible:!ring-red-500 !bg-red-50")}
placeholder="Enter payment type..."
required
/>
</div>
)}
</div>
</div>
</div>

{/* Full Width */}
<div className="space-y-1.5 mt-2">
<Label htmlFor="description" className="!text-gray-700 font-semibold text-xs uppercase">Expenses Description <span className="text-red-500">*</span></Label>
<Textarea
id="description"
required
value={formData.description}
onChange={(e) => setFormData({...formData, description: e.target.value})}
className={cn('!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 resize-none h-20', hasSubmitted && !formData.description && '!border-red-500 focus-visible:!ring-red-500 !bg-red-50')}
placeholder="Detailed description of the expense..."
/>
</div>

<div className="space-y-1.5">
<Label htmlFor="remarks" className="!text-gray-700 font-semibold text-xs uppercase">Remarks</Label>
<Textarea
id="remarks"
value={formData.remarks}
onChange={(e) => setFormData({...formData, remarks: e.target.value})}
className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 resize-none h-16"
placeholder="Any additional notes (Optional)"
/>
</div>

<DialogFooter className="pt-4 border-t border-gray-100 mt-6">
<Button
type="button"
variant="outline"
onClick={() => setIsModalOpen(false)}
disabled={isSubmitting}
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
<><Check className="w-4 h-4 mr-2" /> Save Expense</>
)}
</Button>
</DialogFooter>
</form>
</DialogContent>
</Dialog>

{/* Delete Confirmation Dialog */}
<Dialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
<DialogContent className="!bg-white !border-gray-200 !text-gray-900 sm:max-w-md">
<DialogHeader>
<DialogTitle className="text-red-600 font-bold flex items-center">
<Trash2 className="w-5 h-5 mr-2" /> Confirm Deletion
</DialogTitle>
<DialogDescription className="text-gray-600 mt-2">
              Are you sure you want to delete this expense record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setExpenseToDelete(null)}
              className="!bg-white !border-gray-300 !text-gray-700 hover:!bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => expenseToDelete && handleDelete(expenseToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Expense Modal */}
      <Dialog open={!!viewingExpense} onOpenChange={(open) => !open && setViewingExpense(null)}>
        <DialogContent className="!bg-white sm:max-w-[650px] !border-gray-200 shadow-2xl overflow-hidden p-0 z-[120]">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-gray-900">Expense Record Inspector</DialogTitle>
              <DialogDescription className="text-[11px] text-gray-500">
                Detailed parameters and metadata for this expense entry.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {viewingExpense && (
            <div className="p-5 space-y-3">
              {/* Row 1: Key Summary */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Category</p>
                  <p className="text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1.5 rounded-md truncate">{viewingExpense.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Date Issued</p>
                  <p className="text-xs font-medium text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-md">
                    {format(parseISO(viewingExpense.date_issued), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total Amount</p>
                  <p className="text-xs font-extrabold text-blue-900 bg-blue-100/70 px-2.5 py-1.5 rounded-md font-mono">
                    ₱ {viewingExpense.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Description / Type of Expense</p>
                <p className="text-xs font-semibold text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-100 whitespace-pre-wrap">
                  {viewingExpense.description}
                </p>
              </div>

              {/* Row 3: Billing & Suppliers */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Charge To (Client)</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md truncate">{viewingExpense.charge_to || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Invoice No.</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md font-mono truncate">{viewingExpense.invoice_number || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Suppliers Name</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md truncate">{viewingExpense.supplier_name || "-"}</p>
                </div>
              </div>

              {/* Row 4: Vehicle & Payment Details */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Unit / Vehicle</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md truncate">{viewingExpense.unit_vehicle || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Plate Number</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md font-mono truncate">{viewingExpense.plate_number || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Payment Type</p>
                  <p className="text-xs font-bold text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-md truncate">{viewingExpense.type_of_payment || "Cash"}</p>
                </div>
              </div>

              {/* Row 5: Remarks */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Remarks</p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md italic">
                  {viewingExpense.remarks || "No remarks provided."}
                </p>
              </div>
            </div>
          )}
          
          {/* Footer Bar with Record Metadata & Back Button */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
            {viewingExpense && (
              <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-sans">
                <p><span className="font-semibold text-gray-600">ID:</span> <span className="font-mono text-gray-700">{viewingExpense.id.slice(0, 18)}...</span></p>
                <p><span className="font-semibold text-gray-600">Created By:</span> <span className="text-blue-600 font-medium">{viewingExpense.created_by || "System"}</span></p>
              </div>
            )}
            <Button
              onClick={() => setViewingExpense(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-4 shrink-0 ml-auto"
            >
              {summaryCategoryModal ? `← Back to ${summaryCategoryModal} Breakdown` : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Audit / Breakdown Floating Modal */}
      <Dialog open={!!summaryCategoryModal} onOpenChange={(open) => !open && setSummaryCategoryModal(null)}>
        <DialogContent className="!bg-white sm:max-w-[950px] max-h-[85vh] flex flex-col !border-gray-200 shadow-2xl overflow-hidden p-0">
          {/* Modal Header */}
          <div className="p-6 bg-blue-50/80 border-b border-blue-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm border border-blue-200">Category Audit</span>
                <p className="text-xs font-bold text-gray-600 uppercase">
                  Period: {reportPeriod === 'daily' ? format(parseISO(selectedDay), "MMMM d, yyyy") : reportPeriod === 'weekly' ? formatWeekRange(selectedWeek) : reportPeriod === 'monthly' ? format(parseISO(selectedMonth + '-01'), "MMMM yyyy") : (selectedYear === 'all' ? 'All Time' : selectedYear)}
                </p>
              </div>
              <DialogTitle className="text-2xl font-black text-gray-900 mt-1">
                {summaryCategoryModal}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 font-medium mt-0.5">
                Detailed log breakdown of all individual expense entries under this category.
              </DialogDescription>
            </div>
            <div className="text-right bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm shrink-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Total Category Amount</p>
              <p className="text-xl font-mono font-black text-blue-800">
                ₱{modalCategoryExpenses.reduce((acc, c) => acc + c.total_amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Modal Table Content */}
          <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
            {modalCategoryExpenses.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No individual expense records found for {summaryCategoryModal} in this period.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-gray-100 border-b border-gray-200 text-gray-800 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="px-3 py-2.5">No.</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5 min-w-[150px]">Description</th>
                      <th className="px-3 py-2.5">Charge To</th>
                      <th className="px-3 py-2.5">Invoice No.</th>
                      <th className="px-3 py-2.5">Suppliers Name</th>
                      <th className="px-3 py-2.5">Unit / Vehicle</th>
                      <th className="px-3 py-2.5">Plate #</th>
                      <th className="px-3 py-2.5">Payment</th>
                      <th className="px-3 py-2.5 text-right whitespace-nowrap">Amount</th>
                      <th className="px-3 py-2.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {modalCategoryExpenses.map((exp, idx) => (
                      <tr 
                        key={exp.id} 
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setViewingExpense(exp)
                        }}
                        title="Click to inspect this specific expense entry"
                      >
                        <td className="px-3 py-2 font-mono text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{exp.date_issued ? format(parseISO(exp.date_issued), "MMM d, yyyy") : "-"}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{exp.description}</td>
                        <td className="px-3 py-2 text-gray-600">{exp.charge_to || "N/A"}</td>
                        <td className="px-3 py-2 font-mono text-gray-700">{exp.invoice_number || "-"}</td>
                        <td className="px-3 py-2 text-gray-700 font-medium">{exp.supplier_name || "-"}</td>
                        <td className="px-3 py-2 text-gray-600">{exp.unit_vehicle || "N/A"}</td>
                        <td className="px-3 py-2 font-mono text-gray-600">{exp.plate_number || "N/A"}</td>
                        <td className="px-3 py-2 font-semibold text-gray-800">{exp.type_of_payment || "Cash"}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                          ₱{exp.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 italic text-gray-500 text-[11px] max-w-[120px] truncate">{exp.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                    <tr>
                      <td colSpan={9} className="px-3 py-3 text-right uppercase text-gray-600">Total ({modalCategoryExpenses.length} Records):</td>
                      <td className="px-3 py-3 text-right font-mono text-blue-900 font-extrabold text-sm whitespace-nowrap">
                        ₱{modalCategoryExpenses.reduce((acc, c) => acc + c.total_amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <p className="text-xs text-gray-500 italic">
              💡 Click any row inside this breakdown to inspect the individual receipt details.
            </p>
            <Button
              onClick={() => setSummaryCategoryModal(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Close Breakdown
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
