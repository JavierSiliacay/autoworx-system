"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Search, Plus, Loader2, Check, Printer, FileText, ListChecks, Edit, Trash2, RotateCcw, Undo, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format, differenceInDays } from "date-fns"

export interface PurchasingItem {
  description: string
  amount: number
  status?: "Pending" | "Arrived"
  date_arrived?: string | null
}

interface Purchasing {
  id: string
  created_at: string
  type: string
  item_description: string
  supplier_name: string | null
  status: string
  date_purchased: string
  date_arrived: string | null
  remarks: string | null
  created_by?: string
  unit_model?: string
  plate_number?: string
  vehicle_owner?: string
  customer_type?: string
  insurance_company_name?: string
  pr_number?: string
  amount?: number
  items?: PurchasingItem[]
  is_po_synced?: boolean
}

function calculateAging(datePurchased: string, dateArrived: string | null, status: string) {
  const start = new Date(datePurchased)
  const end = status === "Arrived" && dateArrived ? new Date(dateArrived) : new Date()
  const diffDays = differenceInDays(end, start)
  if (diffDays < 0) return "0 Days"
  if (diffDays === 1) return "1 Day"
  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30)
    const days = diffDays % 30
    if (days === 0) return `${months} Month${months > 1 ? 's' : ''}`
    return `${months} Month${months > 1 ? 's' : ''} ${days} Day${days > 1 ? 's' : ''}`
  }
  return `${diffDays} Days`
}

const EXPENSE_CATEGORIES = [
  "PAYROLL",
  "EMPLOYEES BENEFITS",
  "RENTALS",
  "TAXES",
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

export function PurchasingMonitoring() {
  const [purchases, setPurchases] = useState<Purchasing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isArriveModalOpen, setIsArriveModalOpen] = useState(false)
  const [isMarkArrivedModalOpen, setIsMarkArrivedModalOpen] = useState(false)
  const [selectedItemsToArrive, setSelectedItemsToArrive] = useState<number[]>([])

  const [arriveDate, setArriveDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [purchaseToArrive, setPurchaseToArrive] = useState<Purchasing | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<Purchasing | null>(null)
  const [targetPurchase, setTargetPurchase] = useState<Purchasing | null>(null)
  const [viewingPurchase, setViewingPurchase] = useState<Purchasing | null>(null)

  const [arriveFormData, setArriveFormData] = useState({
    date_issued: format(new Date(), "yyyy-MM-dd"), // Replaced date_arrived with date_issued for Expenses
    po_number: "",
    category: "SHOP PARTS AND GOODS",
    customCategory: "",
    total_amount: "",
    description: "",
    charge_to: "",
    invoice_number: "",
    supplier_name: "",
    unit_vehicle: "",
    plate_number: "",
    remarks: ""
  })

  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const { toast } = useToast()

  const [lastDeletedItem, setLastDeletedItem] = useState<{ index: number, item: { description: string, amount: string, status: "Pending" | "Arrived", date_arrived: string | null } } | null>(null)

  const [formData, setFormData] = useState({
    type: "PR",
    pr_number: "",
    unit_model: "",
    plate_number: "",
    vehicle_owner: "",
    customer_type: "Personal",
    custom_customer_type: "",
    insurance_company_name: "",
    item_description: "",
    amount: "",
    items: [{ description: "", amount: "", status: "Pending" as "Pending" | "Arrived", date_arrived: null as string | null }],
    supplier_name: "",
    date_purchased: format(new Date(), "yyyy-MM-dd"),
    remarks: ""
  })

  const fetchPurchases = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/purchasing")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setPurchases(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load purchasing items.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  const filteredPurchases = useMemo(() => {
    let result = purchases
    if (searchQuery) {
      const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
      result = result.filter(p => {
        const searchableText = [
          p.item_description,
          p.supplier_name,
          p.remarks,
          p.unit_model,
          p.plate_number,
          p.vehicle_owner,
          p.pr_number,
          p.type,
          p.status
        ].filter(Boolean).join(" ").toLowerCase()

        return tokens.every(token => searchableText.includes(token))
      })
    }
    if (typeFilter !== "all") {
      result = result.filter(p => p.type === typeFilter)
    }
    if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter)
    }
    return result
  }, [purchases, searchQuery, typeFilter, statusFilter])

  const handleMarkArrivedClick = (purchase: Purchasing) => {
    setPurchaseToArrive(purchase)
    setArriveDate(format(new Date(), "yyyy-MM-dd"))
    setSelectedItemsToArrive([])
    setIsMarkArrivedModalOpen(true)
  }

  const submitMarkArrived = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchaseToArrive) return

    setIsSubmitting(true)
    try {
      const timeStr = format(new Date(), "HH:mm:ss.SSSxxx")
      const finalArriveTime = `${arriveDate}T${timeStr}`
      
      let newStatus = "Arrived"
      let newDateArrived: string | null = finalArriveTime
      let newItems = purchaseToArrive.items ? [...purchaseToArrive.items] : null

      if (newItems && newItems.length > 0) {
        if (selectedItemsToArrive.length === 0) {
          toast({ title: "No Items Selected", description: "Please select at least one item that arrived.", variant: "destructive" })
          setIsSubmitting(false)
          return
        }

        let allArrived = true
        newItems = newItems.map((item, idx) => {
          if (selectedItemsToArrive.includes(idx)) {
            return { ...item, status: "Arrived", date_arrived: finalArriveTime }
          }
          if (item.status !== "Arrived" && !(!item.status && purchaseToArrive.status === "Arrived")) {
             allArrived = false
          }
          return { ...item, status: item.status || "Pending", date_arrived: item.date_arrived || null }
        })

        if (!allArrived) {
           newStatus = "Partially Arrived"
           newDateArrived = null
        }
      }

      const payload: any = { status: newStatus, date_arrived: newDateArrived }
      if (newItems) payload.items = newItems

      const res = await fetch(`/api/purchasing?id=${purchaseToArrive.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast({ title: "Success", description: `Item marked as ${newStatus}.` })
      fetchPurchases()
      setIsMarkArrivedModalOpen(false)
      setPurchaseToArrive(null)
    } catch (error) {
      toast({ title: "Error", description: "Could not update status.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUndoItemArrival = async (purchase: Purchasing, itemIndex: number) => {
    if (!window.confirm("Are you sure you want to undo this arrived item?")) return;

    setIsSubmitting(true);
    try {
      let newItems = [...purchase.items!];
      newItems[itemIndex] = { ...newItems[itemIndex], status: "Pending", date_arrived: null };

      let allArrived = true;
      let anyArrived = false;
      newItems.forEach(item => {
        if (item.status === "Arrived" || (!item.status && purchase.status === "Arrived")) anyArrived = true;
        else allArrived = false;
      });

      let newStatus = allArrived ? "Arrived" : anyArrived ? "Partially Arrived" : "Pending";
      let newDateArrived = newStatus === "Arrived" ? purchase.date_arrived : null;

      const payload: any = { status: newStatus, date_arrived: newDateArrived, items: newItems };

      const res = await fetch(`/api/purchasing?id=${purchase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast({ title: "Success", description: "Item reverted to Pending." });
      
      setPurchaseToArrive({ ...purchase, ...payload });
      fetchPurchases();
    } catch (error) {
      toast({ title: "Error", description: "Could not revert status.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertPending = async (purchase: Purchasing) => {
    if (!window.confirm(`Are you sure you want to revert "${purchase.item_description}" back to Pending?`)) return

    setIsSubmitting(true)
    try {
      let newItems = purchase.items ? [...purchase.items] : null
      if (newItems) {
        newItems = newItems.map(item => ({ ...item, status: "Pending", date_arrived: null }))
      }

      const payload: any = { status: "Pending", date_arrived: null }
      if (newItems) payload.items = newItems

      const res = await fetch(`/api/purchasing?id=${purchase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Failed to revert status")
      toast({ title: "Success", description: "Item reverted to Pending." })
      fetchPurchases()
    } catch (error) {
      toast({ title: "Error", description: "Could not revert status.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArriveClick = (purchase: Purchasing) => {
    setTargetPurchase(purchase)
    
    // Generate description from items if available (excluding amounts)
    const formattedDescription = purchase.items && purchase.items.length > 0
      ? purchase.items.map((item: any) => item.description).filter(Boolean).join(', ')
      : purchase.item_description || ""

    // Format the initial amount with commas
    let initialFormattedAmount = "";
    if (purchase.amount) {
      const parts = purchase.amount.toString().split('.');
      if (parts[0]) parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
      initialFormattedAmount = parts.join('.');
    }

    setArriveFormData({
      date_issued: format(new Date(), "yyyy-MM-dd"), // Defaults to today for expense date
      po_number: "",
      category: "SHOP PARTS AND GOODS",
      customCategory: "",
      total_amount: initialFormattedAmount,
      description: formattedDescription,
      charge_to: purchase.vehicle_owner || "",
      invoice_number: "",
      supplier_name: purchase.supplier_name || "",
      unit_vehicle: purchase.unit_model || "",
      plate_number: purchase.plate_number || "",
      remarks: purchase.remarks || ""
    })
    setIsArriveModalOpen(true)
  }

  const handleConfirmArrive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetPurchase) return

    if (arriveFormData.category === "CUSTOM" && !arriveFormData.customCategory.trim()) {
      toast({ title: "Required", description: "Please specify the custom category.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
      const arriveTime = format(new Date(), "HH:mm:ss.SSSxxx")
      const finalDateIssued = `${arriveFormData.date_issued}T${arriveTime}`

      const resPurchase = await fetch(`/api/purchasing?id=${targetPurchase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_po_synced: true })
      })
      if (!resPurchase.ok) throw new Error("Failed to update purchasing status")

      const finalCategory = arriveFormData.category === "CUSTOM" ? arriveFormData.customCategory : arriveFormData.category
      const resExpense = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: finalCategory,
          description: arriveFormData.description,
          date_issued: finalDateIssued,
          supplier_name: arriveFormData.supplier_name,
          type_of_payment: arriveFormData.po_number ? `PO - ${arriveFormData.po_number}` : "PO",
          total_amount: parseFloat(arriveFormData.total_amount.replace(/,/g, '')) || 0,
          remarks: arriveFormData.remarks,
          charge_to: arriveFormData.charge_to,
          invoice_number: arriveFormData.invoice_number,
          unit_vehicle: arriveFormData.unit_vehicle,
          plate_number: arriveFormData.plate_number,
          purchasing_id: targetPurchase.id
        })
      })

      if (!resExpense.ok) throw new Error("Failed to sync to expenses")

      toast({ title: "Success", description: "Item synced to Expenses." })
      fetchPurchases()
      setIsArriveModalOpen(false)
      setTargetPurchase(null)
    } catch (error) {
      toast({ title: "Error", description: "Could not sync item.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let finalDatePurchased = formData.date_purchased;

      // If we are NOT editing, or if the date string changed, append time
      if (!editingPurchase || !editingPurchase.date_purchased.startsWith(formData.date_purchased)) {
        const currentTime = format(new Date(), "HH:mm:ss.SSSxxx")
        finalDatePurchased = `${formData.date_purchased}T${currentTime}`
      } else {
        finalDatePurchased = editingPurchase.date_purchased
      }

      const itemsString = formData.items.filter(i => i.description).map(i => `${i.description} - ₱${i.amount || 0}`).join('\n')

      const payload = {
        ...formData,
        customer_type: formData.customer_type === "Custom" ? formData.custom_customer_type : formData.customer_type,
        date_purchased: finalDatePurchased,
        item_description: itemsString || formData.item_description || "N/A",
        items: formData.items.filter(i => i.description).map((i: any) => ({ description: i.description, amount: parseFloat(i.amount.replace(/,/g, "")) || 0, status: i.status || "Pending", date_arrived: i.date_arrived || null })),
        amount: formData.items.reduce((sum, item) => sum + (parseFloat(item.amount.replace(/,/g, "")) || 0), 0)
      }
      // Remove custom_customer_type from payload since the db expects only customer_type
      // @ts-ignore
      delete payload.custom_customer_type

      const method = editingPurchase ? "PUT" : "POST"
      const url = editingPurchase ? `/api/purchasing?id=${editingPurchase.id}` : "/api/purchasing"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Failed to save purchasing item")

      toast({
        title: "Success",
        description: `Purchasing item ${editingPurchase ? 'updated' : 'added'} successfully.`
      })
      fetchPurchases()
      setIsModalOpen(false)
      setEditingPurchase(null)
      setLastDeletedItem(null)
      setFormData({
        type: "PR",
        pr_number: "",
        unit_model: "",
        plate_number: "",
        vehicle_owner: "",
        customer_type: "Personal",
        custom_customer_type: "",
        insurance_company_name: "",
        item_description: "",
        amount: "",
        items: [{ description: "", amount: "", status: "Pending" as "Pending" | "Arrived", date_arrived: null as string | null }],
        supplier_name: "",
        date_purchased: format(new Date(), "yyyy-MM-dd"),
        remarks: ""
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (purchase: Purchasing) => {
    setEditingPurchase(purchase)
    setLastDeletedItem(null)
    setFormData({
      type: purchase.type,
      pr_number: purchase.pr_number || "",
      unit_model: purchase.unit_model || "",
      plate_number: purchase.plate_number || "",
      vehicle_owner: purchase.vehicle_owner || "",
      customer_type: (purchase.customer_type === "Personal" || purchase.customer_type === "Insurance") ? purchase.customer_type : "Custom",
      custom_customer_type: (purchase.customer_type !== "Personal" && purchase.customer_type !== "Insurance" && purchase.customer_type) ? purchase.customer_type : "",
      insurance_company_name: purchase.insurance_company_name || "",
      item_description: purchase.item_description,
      amount: purchase.amount ? purchase.amount.toString() : "",
      items: purchase.items?.length
        ? purchase.items.map(i => ({ description: i.description, amount: i.amount.toString(), status: i.status || "Pending", date_arrived: i.date_arrived || null }))
        : (purchase.item_description ? [{ description: purchase.item_description, amount: purchase.amount?.toString() || "", status: "Pending" as "Pending" | "Arrived", date_arrived: null as string | null }] : [{ description: "", amount: "", status: "Pending" as "Pending" | "Arrived", date_arrived: null as string | null }]),
      supplier_name: purchase.supplier_name || "",
      date_purchased: format(new Date(purchase.date_purchased), "yyyy-MM-dd"),
      remarks: purchase.remarks || ""
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return

    try {
      const res = await fetch(`/api/purchasing?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Success", description: "Item deleted." })
      fetchPurchases()
    } catch (error) {
      toast({ title: "Error", description: "Could not delete item.", variant: "destructive" })
    }
  }

  return (
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

      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b !border-gray-300 pb-4 print:hidden relative z-10">
        <div>
          <h2 className="text-sm font-semibold !text-gray-500 uppercase tracking-wider">
            PURCHASING TRACKER
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-extrabold !text-gray-900 tracking-tight">PURCHASING MONITORING</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden w-full md:w-auto">
          <Button onClick={() => window.print()} variant="outline" size="icon" className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-100 hidden md:flex" title="Print Log">
            <Printer className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => {
              setEditingPurchase(null)
              setLastDeletedItem(null)
              setFormData({
                type: "PR",
                pr_number: "",
                unit_model: "",
                plate_number: "",
                vehicle_owner: "",
                customer_type: "Personal",
                custom_customer_type: "",
                insurance_company_name: "",
                item_description: "",
                amount: "",
                items: [{ description: "", amount: "", status: "Pending" as "Pending" | "Arrived", date_arrived: null as string | null }],
                supplier_name: "",
                date_purchased: format(new Date(), "yyyy-MM-dd"),
                remarks: ""
              })
              setIsModalOpen(true)
            }}
            className="!bg-blue-600 hover:!bg-blue-700 !text-white shadow-sm font-bold w-full md:w-auto flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Purchase
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end print:hidden relative z-10">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search items, suppliers, remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 !bg-white !border-gray-300 shadow-sm w-full font-medium"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="!bg-white !border-gray-300 font-medium">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types (PR & PO)</SelectItem>
              <SelectItem value="PR">Purchase Request (PR)</SelectItem>
              <SelectItem value="PO">Purchase Order (PO)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="!bg-white !border-gray-300 font-medium">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Partially Arrived">Partially Arrived</SelectItem>
              <SelectItem value="Arrived">Arrived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="!bg-white rounded-xl shadow-sm border !border-gray-200 overflow-hidden print:shadow-none print:border-none print:overflow-visible relative z-10">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-sm text-left !text-gray-700 [&_th]:border [&_th]:!border-gray-200 [&_td]:border [&_td]:!border-gray-200 print:text-[10px] print:[&_th]:px-1 print:[&_th]:py-1 print:[&_td]:px-1 print:[&_td]:py-1">
            <thead className="text-xs !text-gray-700 !bg-blue-50 border-b !border-blue-200 uppercase font-bold">
              <tr className="hidden print:table-row bg-white border-0">
                <th colSpan={10} className="border-0 bg-white px-0 py-4 font-normal normal-case">
                  <div className="flex flex-col w-full mb-4">
                    <h1 className="text-xl font-black uppercase tracking-tight text-black text-center mb-4">PURCHASING MONITORING</h1>
                  </div>
                </th>
              </tr>
              <tr>
                <th scope="col" className="px-2 py-2 min-w-[90px]">DATE REQ.</th>
                <th scope="col" className="px-2 py-2 w-[70px]">TYPE/PR</th>
                <th scope="col" className="px-2 py-2 w-[160px]">DESCRIPTION</th>
                <th scope="col" className="px-2 py-2 min-w-[110px]">VEHICLE DETAILS</th>
                <th scope="col" className="px-2 py-2 min-w-[90px]">SUPPLIER</th>
                <th scope="col" className="px-2 py-2 w-[80px]">STATUS</th>
                <th scope="col" className="px-2 py-2 min-w-[90px]">DATE ARR.</th>
                <th scope="col" className="px-2 py-2 min-w-[60px]">AGING</th>
                <th scope="col" className="px-2 py-2 min-w-[100px]">REMARKS</th>
                <th scope="col" className="px-1 py-2 w-[80px] text-center print:hidden">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y !divide-gray-200 [&_tr]:hover:!bg-gray-50/50 print:[&_tr]:hover:!bg-transparent text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 font-medium">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    Loading purchasing items...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 font-medium">
                    No purchasing items found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="transition-colors font-medium hover:bg-blue-50/50 group cursor-pointer" onClick={() => setViewingPurchase(purchase)}>
                    <td className="px-2 py-2 font-semibold text-xs whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{format(new Date(purchase.date_purchased), "MMM d, yyyy")}</span>
                        <span className="text-[10px] text-gray-500">{format(new Date(purchase.date_purchased), "h:mm a")}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", purchase.type === "PR" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800")}>
                          {purchase.type}
                        </span>
                        {purchase.pr_number && <span className="text-[10px] text-gray-500 font-bold leading-none">{purchase.pr_number}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-2 font-bold text-gray-900 text-xs">
                      {purchase.items && purchase.items.length > 0 ? (
                        <div className="space-y-1 max-w-[200px]">
                          {purchase.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col border-b border-gray-100 last:border-0 pb-1.5 last:pb-0">
                              <div className="flex items-start gap-1">
                                {(item.status === "Arrived" || (!item.status && purchase.status === "Arrived")) ? <Check className="w-3 h-3 text-green-600 mt-0.5 shrink-0" /> : <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1 shrink-0" />}
                                <span className="line-clamp-2 leading-tight" title={item.description}>{item.description}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-green-700 bg-green-50 w-max px-1 py-0.5 rounded">₱{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded", (item.status === "Arrived" || (!item.status && purchase.status === "Arrived")) ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50")}>
                                  {calculateAging(purchase.date_purchased, item.date_arrived || purchase.date_arrived, (item.status === "Arrived" || (!item.status && purchase.status === "Arrived")) ? "Arrived" : "Pending")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <p className="line-clamp-3 leading-tight" title={purchase.item_description}>{purchase.item_description}</p>
                          {purchase.amount !== undefined && purchase.amount !== null && purchase.amount > 0 && (
                            <span className="block mt-1 font-mono text-[10px] text-green-700 font-bold bg-green-50 px-1 py-0.5 rounded w-max">
                              ₱{Number(purchase.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-0.5 text-[11px] leading-tight">
                        {purchase.unit_model && <span className="font-semibold text-gray-800 truncate">{purchase.unit_model}</span>}
                        {purchase.plate_number && <span className="text-gray-600 truncate">{purchase.plate_number}</span>}
                        {purchase.vehicle_owner && <span className="text-gray-500 italic truncate">{purchase.vehicle_owner}</span>}
                        {purchase.customer_type && (
                          <span className="text-[9px] uppercase font-bold text-blue-600 truncate mt-0.5">
                            {purchase.customer_type} {purchase.customer_type === 'Insurance' && purchase.insurance_company_name ? `(${purchase.insurance_company_name})` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs truncate max-w-[120px]" title={purchase.supplier_name || ""}>{purchase.supplier_name || "-"}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={cn("px-1.5 py-0.5 inline-flex items-center gap-1 rounded text-[10px] font-bold leading-none", purchase.status === "Arrived" ? "bg-green-100 text-green-800" : (purchase.status === "Partially Arrived" ? "bg-orange-100 text-orange-800" : "bg-yellow-100 text-yellow-800"))}>
                          {purchase.status === "Arrived" && <Check className="w-2.5 h-2.5" />}
                          {purchase.status}
                        </span>
                        {purchase.is_po_synced && (
                          <span className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-0.5 leading-none mt-0.5">
                            <Check className="w-2.5 h-2.5" /> Synced
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 font-semibold text-gray-600 text-[11px] whitespace-nowrap">
                      {purchase.date_arrived ? (
                        <div className="flex flex-col">
                          <span>{format(new Date(purchase.date_arrived), "MMM d, yyyy")}</span>
                          <span className="text-[9px] text-gray-400">{format(new Date(purchase.date_arrived), "h:mm a")}</span>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-2 py-2 text-red-600 font-bold text-xs whitespace-nowrap">
                      {purchase.status === "Partially Arrived" ? "Partial" : calculateAging(purchase.date_purchased, purchase.date_arrived, purchase.status)}
                    </td>
                    <td className="px-2 py-2 text-[11px] italic text-gray-500">
                      <p className="line-clamp-2" title={purchase.remarks || ""}>{purchase.remarks || "-"}</p>
                    </td>
                    <td className="px-1 py-2 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 flex-wrap opacity-90 group-hover:opacity-100 transition-opacity">
                        {(purchase.status === "Pending" || purchase.status === "Partially Arrived") && (
                          <Button
                            onClick={() => handleMarkArrivedClick(purchase)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold h-6 text-[10px] px-1.5"
                            title="Mark as Arrived"
                          >
                            <Check className="w-3 h-3" /> Arrive
                          </Button>
                        )}
                        {purchase.status === "Arrived" && !purchase.is_po_synced && (
                          <Button
                            onClick={() => handleArriveClick(purchase)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-6 text-[10px] px-1.5"
                            title="Sync PO to Expenses"
                          >
                            Sync PO
                          </Button>
                        )}
                        {purchase.status === "Arrived" && !purchase.is_po_synced && (
                          <Button
                            onClick={() => handleRevertPending(purchase)}
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0 !bg-white !border-orange-200 !text-orange-600 hover:!bg-orange-50 hover:!text-orange-700"
                            title="Revert to Pending"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}
                        {purchase.is_po_synced && (
                          <Button
                            onClick={async () => {
                              if (!window.confirm("Force Unsync this item? Use this only if the corresponding expense is missing or if you need to re-sync it manually.")) return;
                              try {
                                const res = await fetch(`/api/purchasing?id=${purchase.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ is_po_synced: false })
                                })
                                if (!res.ok) throw new Error("Failed to force unsync");
                                // We don't have access to toast here unless it's in scope, but toast is available in the component. Wait, toast is available.
                                // Actually, let's call a new handleForceUnsync method or just write it inline since we can't easily extract it without scrolling up. I will write it inline.
                                // wait, I can just use toast here since it's inside the component map loop and toast is in scope.
                                toast({ title: "Success", description: "Item forcefully un-synced." });
                                fetchPurchases();
                              } catch (e) {
                                toast({ title: "Error", description: "Could not un-sync item.", variant: "destructive" });
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0 !bg-white !border-gray-300 !text-gray-500 hover:!bg-gray-100 hover:!text-gray-700"
                            title="Force Unsync"
                          >
                            <Unlink className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEdit(purchase)}
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 !bg-white !border-blue-200 !text-blue-600 hover:!bg-blue-50 hover:!text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(purchase.id)}
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 !bg-white !border-red-200 !text-red-600 hover:!bg-red-50 hover:!text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="!bg-white !text-gray-900 !border-gray-200 sm:max-w-[700px] max-h-[95vh] overflow-y-auto shadow-xl [&>button]:!text-gray-700 [&>button:hover]:!text-gray-900">
          <DialogHeader className="border-b !border-gray-200 pb-2">
            <DialogTitle className="text-xl font-extrabold !text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              {editingPurchase ? "Edit Purchasing Item" : "Add Purchasing Item"}
            </DialogTitle>
            <DialogDescription className="!text-gray-500 font-medium text-sm">
              Fill in the details below. Required fields are marked with an asterisk (<span className="text-red-500">*</span>).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-2.5 py-1 mt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              {/* Left Column */}
              <div className="space-y-2.5">
                <div className="space-y-1 relative">
                  <Label className="!text-gray-700 font-semibold text-xs uppercase">Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                  >
                    <SelectTrigger className="w-full !bg-white !border-gray-300 !text-gray-900 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 h-9 font-normal hover:!bg-gray-100 text-sm">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="!bg-white !border-gray-200">
                      <SelectItem value="PR" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 focus:!bg-blue-600 focus:!text-white font-medium">Purchase Request (PR)</SelectItem>
                      <SelectItem value="PO" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 focus:!bg-blue-600 focus:!text-white font-medium">Purchase Order (PO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="!text-gray-700 font-semibold text-xs uppercase">{formData.type === 'PO' ? 'PO Number' : 'PR Number'} <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    placeholder={formData.type === 'PO' ? 'e.g. PO-1001' : 'e.g. PR-1001'}
                    value={formData.pr_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, pr_number: e.target.value }))}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="!text-gray-700 font-semibold text-xs uppercase">Date Purchased / Requested <span className="text-red-500">*</span></Label>
                  <Input
                    type="date" style={{ colorScheme: "light" }}
                    required
                    value={formData.date_purchased}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_purchased: e.target.value }))}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 [color-scheme:light] h-9 text-sm"
                  />
                </div>

                <div className="space-y-1 relative">
                  <Label className="!text-gray-700 font-semibold text-xs uppercase">Customer Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, customer_type: val }))}
                  >
                    <SelectTrigger className="w-full !bg-white !border-gray-300 !text-gray-900 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 h-9 font-normal hover:!bg-gray-100 text-sm">
                      <SelectValue placeholder="Select Customer Type" />
                    </SelectTrigger>
                    <SelectContent className="!bg-white !border-gray-200">
                      <SelectItem value="Personal" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 focus:!bg-blue-600 focus:!text-white font-medium">Personal</SelectItem>
                      <SelectItem value="Insurance" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 focus:!bg-blue-600 focus:!text-white font-medium">Insurance</SelectItem>
                      <SelectItem value="Custom" className="!text-gray-900 cursor-pointer hover:!bg-gray-100 focus:!bg-blue-600 focus:!text-white font-medium">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.customer_type === "Insurance" && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <Label className="!text-gray-700 font-semibold text-xs uppercase">Insurance Company <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="e.g. Malayan Insurance"
                      value={formData.insurance_company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, insurance_company_name: e.target.value }))}
                      className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 h-9 text-sm"
                    />
                  </div>
                )}

                {formData.customer_type === "Custom" && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <Label className="!text-gray-700 font-semibold text-xs uppercase">Custom Type <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="e.g. Corporate, Walk-in..."
                      value={formData.custom_customer_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_customer_type: e.target.value }))}
                      className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label className="!text-gray-700 font-semibold text-xs uppercase">Supplier Name</Label>
                  <Input
                    placeholder="Optional supplier name"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="!text-gray-700 font-semibold text-xs uppercase">Unit Model <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="e.g. Toyota Vios"
                      value={formData.unit_model}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_model: e.target.value }))}
                      className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="!text-gray-700 font-semibold text-xs uppercase">Plate Number <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="e.g. ABC 1234"
                      value={formData.plate_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                      className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="!text-gray-700 font-semibold text-xs uppercase">Vehicle Owner <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    placeholder="Name of owner"
                    value={formData.vehicle_owner}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_owner: e.target.value }))}
                    className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Item Form */}
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label className="!text-gray-700 font-bold text-xs uppercase">Purchased Items <span className="text-red-500">*</span></Label>
                  {lastDeletedItem && (
                    <Button
                      type="button"
                      onClick={() => {
                        const newItems = [...formData.items]
                        newItems.splice(lastDeletedItem.index, 0, lastDeletedItem.item)
                        setFormData(prev => ({ ...prev, items: newItems }))
                        setLastDeletedItem(null)
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-semibold"
                    >
                      <Undo className="w-3 h-3 mr-1" /> Undo Delete
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, items: [...prev.items, { description: "", amount: "", status: "Pending", date_arrived: null }] }))}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] !bg-white !text-blue-600 !border-blue-200 hover:!bg-blue-50"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start relative group">
                    <div className="flex-1 space-y-1">
                      <Input
                        id={`item-desc-${index}`}
                        required
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].description = e.target.value
                          setFormData(prev => ({ ...prev, items: newItems }))
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (index === formData.items.length - 1 && item.description) {
                              setFormData(prev => ({ ...prev, items: [...prev.items, { description: "", amount: "", status: "Pending", date_arrived: null }] }))
                              setTimeout(() => {
                                document.getElementById(`item-desc-${index + 1}`)?.focus()
                              }, 100)
                            } else if (index < formData.items.length - 1) {
                              document.getElementById(`item-desc-${index + 1}`)?.focus()
                            }
                          }
                        }}
                        className="item-desc-input !bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 h-9 text-sm"
                      />
                    </div>
                    <div className="w-[120px] space-y-1">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₱</span>
                        <Input
                          id={`item-amount-${index}`}
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) => {
                            const newItems = [...formData.items]
                            let val = e.target.value.replace(/[^\d.]/g, '')
                            const parts = val.split('.')
                            if (parts[0]) {
                              parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            val = parts.slice(0, 2).join('.')
                            newItems[index].amount = val
                            setFormData(prev => ({ ...prev, items: newItems }))
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (index === formData.items.length - 1 && (item.description || item.amount)) {
                                setFormData(prev => ({ ...prev, items: [...prev.items, { description: "", amount: "", status: "Pending", date_arrived: null }] }))
                                setTimeout(() => {
                                  document.getElementById(`item-desc-${index + 1}`)?.focus()
                                }, 100)
                              } else if (index < formData.items.length - 1) {
                                document.getElementById(`item-desc-${index + 1}`)?.focus()
                              }
                            }
                          }}
                          className="item-amount-input !bg-white pl-6 !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 h-9 text-sm font-mono"
                        />
                      </div>
                    </div>
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => {
                          setLastDeletedItem({ index, item: formData.items[index] })
                          const newItems = formData.items.filter((_, i) => i !== index)
                          setFormData(prev => ({ ...prev, items: newItems }))
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">Total Amount:</span>
                  <span className="text-sm font-black text-green-600 font-mono">
                    ₱{formData.items.reduce((sum, item) => sum + (parseFloat(item.amount.replace(/,/g, "")) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="!text-gray-700 font-semibold text-xs uppercase">Remarks</Label>
              <Textarea
                placeholder="Any additional notes (Optional)"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 placeholder:!text-gray-500 resize-none h-12 text-sm"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-gray-100 mt-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="!bg-white !border-gray-300 !text-gray-700 hover:!bg-gray-50">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Save Purchase</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isArriveModalOpen} onOpenChange={setIsArriveModalOpen}>
        <DialogContent className="sm:max-w-2xl !bg-white max-h-[95vh] overflow-y-auto [&>button]:!text-gray-700 [&>button:hover]:!text-gray-900 p-5">
          <form onSubmit={handleConfirmArrive}>
            <DialogHeader className="mb-2">
              <DialogTitle className="!text-gray-900 text-lg font-bold">Item Arrival & Sync</DialogTitle>
              <DialogDescription className="text-xs">
                Confirm arrival for <strong>{targetPurchase?.item_description}</strong>. This will automatically sync to Expenses Monitoring.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="date_arrived" className="!text-gray-700 font-semibold text-xs">Expense Date <span className="text-red-500">*</span></Label>
                <Input
                  id="date_arrived"
                  type="date"
                  required
                  style={{ colorScheme: 'light' }}
                  value={arriveFormData.date_issued}
                  onChange={(e) => setArriveFormData(prev => ({ ...prev, date_issued: e.target.value }))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="po_number" className="!text-gray-700 font-semibold text-xs">PO Number <span className="text-red-500">*</span></Label>
                <Input
                  id="po_number"
                  required
                  placeholder="Enter PO Number"
                  value={arriveFormData.po_number}
                  onChange={(e) => setArriveFormData(prev => ({ ...prev, po_number: e.target.value }))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="category" className="!text-gray-700 font-semibold text-xs">Expense Category <span className="text-red-500">*</span></Label>
                <Select required value={arriveFormData.category} onValueChange={(v) => setArriveFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="!text-gray-900 hover:bg-gray-100">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="total_amount" className="!text-gray-700 font-semibold text-xs">Total Amount (₱) <span className="text-red-500">*</span></Label>
                <Input
                  id="total_amount"
                  required
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                  value={arriveFormData.total_amount}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9.]/g, '');
                    if (val === '') {
                      setArriveFormData(prev => ({ ...prev, total_amount: '' }));
                      return;
                    }
                    const parts = val.split('.');
                    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                    if (parts[0]) parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
                    val = parts.join('.');
                    setArriveFormData(prev => ({ ...prev, total_amount: val }));
                  }}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
              {arriveFormData.category === "CUSTOM" && (
                <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-2 md:col-span-2">
                  <Label htmlFor="customCategory" className="!text-gray-700 font-semibold text-xs">Custom Category <span className="text-red-500">*</span></Label>
                  <Input
                    id="customCategory"
                    required
                    placeholder="Enter custom category"
                    value={arriveFormData.customCategory}
                    onChange={(e) => setArriveFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                    className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                  />
                </div>
              )}
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="description" className="!text-gray-700 font-semibold text-xs">Expenses Description <span className="text-red-500">*</span></Label>
                <Input
                  id="description"
                  required
                  placeholder="Expenses Description"
                  value={arriveFormData.description}
                  onChange={(e) => setArriveFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="charge_to" className="!text-gray-700 font-semibold text-xs">Charge To (CLIENT) <span className="text-red-500">*</span></Label>
                <Input
                  id="charge_to"
                  required
                  placeholder="Charge To"
                  value={arriveFormData.charge_to}
                  onChange={(e) => setArriveFormData(prev => ({ ...prev, charge_to: e.target.value }))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="invoice_number" className="!text-gray-700 font-semibold text-xs">Invoice No.</Label>
                <Input
                  id="invoice_number"
                  placeholder="Invoice No."
                  value={arriveFormData.invoice_number}
                  onChange={(e) => setArriveFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="supplier_name" className="!text-gray-700 font-semibold text-xs">Supplier Name</Label>
                <Input
                  id="supplier_name"
                  placeholder="Supplier Name"
                  value={arriveFormData.supplier_name}
                  onChange={(e) => setArriveFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="unit_vehicle" className="!text-gray-700 font-semibold text-xs">Unit/Vehicle <span className="text-red-500">*</span></Label>
                <Input
                  id="unit_vehicle"
                  required
                  placeholder="Unit/Vehicle"
                  value={arriveFormData.unit_vehicle}
                  onChange={(e) => setArriveFormData(prev => ({ ...prev, unit_vehicle: e.target.value }))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="plate_number" className="!text-gray-700 font-semibold text-xs">Plate # <span className="text-red-500">*</span></Label>
                <Input
                  id="plate_number"
                  required
                  placeholder="Plate #"
                  value={arriveFormData.plate_number}
                  onChange={(e) => setArriveFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="remarks" className="!text-gray-700 font-semibold text-xs">Remarks</Label>
                <Input
                  id="remarks"
                  placeholder="Remarks"
                  value={arriveFormData.remarks}
                  onChange={(e) => setArriveFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-9 text-sm"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsArriveModalOpen(false)} className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-50 h-9">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white shadow-sm h-9">
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Syncing...</span>
                ) : (
                  "Confirm & Sync"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Purchase Modal */}
      <Dialog open={!!viewingPurchase} onOpenChange={(open) => !open && setViewingPurchase(null)}>
        <DialogContent className="!bg-white sm:max-w-[650px] max-h-[95vh] !border-gray-200 shadow-2xl overflow-hidden p-0 z-[120] flex flex-col">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-gray-900">Purchasing Record Inspector</DialogTitle>
              <DialogDescription className="text-[11px] text-gray-500">
                Detailed parameters and metadata for this purchasing entry.
              </DialogDescription>
            </DialogHeader>
          </div>

          {viewingPurchase && (
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {/* Row 1: Key Summary */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Type & PR/PO No.</p>
                  <p className="text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1.5 rounded-md truncate">
                    {viewingPurchase?.type} {viewingPurchase?.pr_number ? `- ${viewingPurchase?.pr_number}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Date Requested</p>
                  <p className="text-xs font-medium text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-md truncate">
                    {viewingPurchase?.date_purchased ? format(new Date(viewingPurchase.date_purchased), "MMM d, yyyy") : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Status</p>
                  <p className={cn("text-xs font-extrabold px-2.5 py-1.5 rounded-md font-mono truncate", viewingPurchase?.status === 'Arrived' ? "text-green-900 bg-green-100/70" : "text-yellow-900 bg-yellow-100/70")}>
                    {viewingPurchase?.status}
                  </p>
                </div>
              </div>

              {/* Row 2: Description & Amount */}
              <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm space-y-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Purchased Items</p>

                  {viewingPurchase?.items && viewingPurchase.items.length > 0 ? (
                    <div className="space-y-2">
                      {viewingPurchase.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col p-2 bg-gray-50 rounded-md border border-gray-100">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-start gap-1.5">
                              {(item.status === "Arrived" || (!item.status && viewingPurchase.status === "Arrived")) ? <Check className="w-4 h-4 text-green-600 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1 shrink-0" />}
                              <span className="text-xs font-semibold text-gray-900 whitespace-pre-wrap">{item.description}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900 font-mono shrink-0">₱{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="mt-2 text-[10px] flex gap-3 text-gray-500 font-medium">
                            <span>Status: <span className={(item.status === 'Arrived' || (!item.status && viewingPurchase.status === "Arrived")) ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>{(item.status === 'Arrived' || (!item.status && viewingPurchase.status === "Arrived")) ? 'Arrived' : 'Pending'}</span></span>
                            {(item.status === 'Arrived' || (!item.status && viewingPurchase.status === "Arrived")) && (item.date_arrived || viewingPurchase.date_arrived) && (
                              <span>Arrived: {format(new Date(item.date_arrived || viewingPurchase.date_arrived!), "MMM d, yyyy")}</span>
                            )}
                            <span>Aging: <span className={(item.status === 'Arrived' || (!item.status && viewingPurchase.status === "Arrived")) ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                              {calculateAging(viewingPurchase.date_purchased, item.date_arrived || viewingPurchase.date_arrived, (item.status === 'Arrived' || (!item.status && viewingPurchase.status === "Arrived")) ? "Arrived" : "Pending")}
                            </span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-100 whitespace-pre-wrap">
                      {viewingPurchase?.item_description}
                    </p>
                  )}
                </div>
                {viewingPurchase?.amount !== undefined && viewingPurchase?.amount > 0 && (
                  <div className="bg-green-50/50 p-2 rounded border border-green-100 flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider">Total Amount</span>
                    <span className="text-sm font-black text-green-700 font-mono">
                      ₱{Number(viewingPurchase.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Row 3: Tracking & Suppliers */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Date Arrived</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md truncate">
                    {viewingPurchase?.date_arrived ? format(new Date(viewingPurchase.date_arrived), "MMM d, yyyy h:mm a") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Aging</p>
                  <p className="text-xs font-extrabold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-md font-mono truncate">
                    {viewingPurchase ? calculateAging(viewingPurchase.date_purchased, viewingPurchase.date_arrived, viewingPurchase.status) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Supplier Name</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md truncate">{viewingPurchase?.supplier_name || "-"}</p>
                </div>
              </div>

              {/* Row 4: Vehicle Details */}
              <div className="grid grid-cols-4 gap-2.5 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Unit / Vehicle</p>
                  <p className="text-xs font-medium text-gray-800 bg-white px-2.5 py-1.5 rounded-md border border-gray-100 truncate">{viewingPurchase?.unit_model || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Plate Number</p>
                  <p className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md font-mono truncate">{viewingPurchase?.plate_number || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Vehicle Owner</p>
                  <p className="text-xs font-bold text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-md truncate">
                    {viewingPurchase?.vehicle_owner || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Customer Type</p>
                  <p className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md truncate uppercase tracking-wide">
                    {viewingPurchase?.customer_type || "-"}
                    {viewingPurchase?.customer_type === 'Insurance' && viewingPurchase?.insurance_company_name && (
                      <span className="text-[10px] font-normal text-blue-600 ml-1">({viewingPurchase?.insurance_company_name})</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Row 5: Remarks */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Remarks</p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md italic">
                  {viewingPurchase?.remarks || "No remarks provided."}
                </p>
              </div>
            </div>
          )}

          {/* Footer Bar with Record Metadata & Back Button */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
            {viewingPurchase && (
              <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-sans">
                <p><span className="font-semibold text-gray-600">ID:</span> <span className="font-mono text-gray-700">{viewingPurchase?.id?.slice(0, 18)}...</span></p>
                <p><span className="font-semibold text-gray-600">Created By:</span> <span className="text-blue-600 font-medium">{viewingPurchase?.created_by || "System"}</span></p>
              </div>
            )}
            <Button
              onClick={() => setViewingPurchase(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-4 shrink-0 ml-auto"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Mark Arrived Modal */}
      <Dialog open={isMarkArrivedModalOpen} onOpenChange={setIsMarkArrivedModalOpen}>
        <DialogContent className="!bg-white !text-gray-900 !border-gray-200 sm:max-w-[400px] shadow-xl [&>button]:!text-gray-700 [&>button:hover]:!text-gray-900">
          <DialogHeader className="border-b !border-gray-200 pb-4">
            <DialogTitle className="text-xl font-extrabold !text-gray-900 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Mark as Arrived
            </DialogTitle>
            <DialogDescription className="!text-gray-500 font-medium text-sm">
              Please specify the date this item arrived.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitMarkArrived} className="space-y-4 py-2 mt-2">
            <div className="space-y-1.5">
              <Label className="!text-gray-700 font-semibold text-xs uppercase">Date Arrived <span className="text-red-500">*</span></Label>
              <Input
                type="date" style={{ colorScheme: "light" }}
                required
                value={arriveDate}
                onChange={(e) => setArriveDate(e.target.value)}
                className="!bg-white !border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 focus-visible:ring-offset-0 !text-gray-900 [color-scheme:light] h-10"
              />
            </div>

            {purchaseToArrive?.items && purchaseToArrive.items.length > 0 && (
              <div className="space-y-1.5 mt-4">
                <Label className="!text-gray-700 font-semibold text-xs uppercase">Select Items that Arrived</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border border-gray-100 rounded-md p-2 bg-gray-50/50">
                  {purchaseToArrive.items.map((item, idx) => (
                     <div key={idx} className={cn("flex items-start justify-between gap-2 p-2 rounded transition-colors", (item.status === 'Arrived' || (!item.status && purchaseToArrive?.status === 'Arrived')) ? 'bg-green-50/50' : 'hover:bg-gray-100')}>
                        <label className="flex items-start gap-2 cursor-pointer flex-1">
                           <input
                              type="checkbox"
                              className="mt-1 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                              disabled={item.status === 'Arrived' || (!item.status && purchaseToArrive?.status === 'Arrived')}
                              checked={item.status === 'Arrived' || (!item.status && purchaseToArrive?.status === 'Arrived') || selectedItemsToArrive.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItemsToArrive(prev => [...prev, idx])
                                } else {
                                  setSelectedItemsToArrive(prev => prev.filter(i => i !== idx))
                                }
                              }}
                           />
                           <div className="flex flex-col">
                              <span className={cn("text-sm font-semibold leading-tight", (item.status === 'Arrived' || (!item.status && purchaseToArrive?.status === 'Arrived')) ? 'text-gray-500' : 'text-gray-900')}>{item.description}</span>
                              <span className="text-[10px] text-gray-500 font-mono mt-0.5">₱{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              {(item.status === 'Arrived' || (!item.status && purchaseToArrive?.status === 'Arrived')) && (item.date_arrived || purchaseToArrive?.date_arrived) && (
                                <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-green-700 bg-green-100/50 px-1.5 py-0.5 rounded w-max">
                                  <span>Arrived: {format(new Date(item.date_arrived || purchaseToArrive?.date_arrived!), "MMM d, yyyy")}</span>
                                  <span className="text-green-900">•</span>
                                  <span>{calculateAging(purchaseToArrive.date_purchased, item.date_arrived || purchaseToArrive?.date_arrived, "Arrived")}</span>
                                </div>
                              )}
                           </div>
                        </label>
                        {(item.status === 'Arrived' || (!item.status && purchaseToArrive?.status === 'Arrived')) && (
                          <Button 
                             type="button"
                             size="sm"
                             variant="ghost" 
                             className="h-6 px-2 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-100 shrink-0"
                             onClick={(e) => {
                               e.preventDefault();
                               handleUndoItemArrival(purchaseToArrive, idx);
                             }}
                             title="Undo Arrival"
                          >
                             <Undo className="w-3 h-3 mr-1" /> Undo
                          </Button>
                        )}
                     </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-gray-100 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsMarkArrivedModalOpen(false)} className="!bg-white !border-gray-300 !text-gray-700 hover:!bg-gray-50">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="!bg-green-600 hover:!bg-green-700 !text-white shadow-sm font-bold">
                {isSubmitting ? "Saving..." : "Confirm Arrival"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
