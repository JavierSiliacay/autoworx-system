"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Search, Plus, Loader2, Check, Printer, FileText, ListChecks, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format, differenceInDays } from "date-fns"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<Purchasing | null>(null)
  const [targetPurchase, setTargetPurchase] = useState<Purchasing | null>(null)
  
  const [arriveFormData, setArriveFormData] = useState({
    date_arrived: format(new Date(), "yyyy-MM-dd"),
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

  const [formData, setFormData] = useState({
    type: "PR",
    item_description: "",
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
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        (p.item_description?.toLowerCase() || "").includes(q) ||
        (p.supplier_name?.toLowerCase() || "").includes(q) ||
        (p.remarks?.toLowerCase() || "").includes(q)
      )
    }
    if (typeFilter !== "all") {
        result = result.filter(p => p.type === typeFilter)
    }
    if (statusFilter !== "all") {
        result = result.filter(p => p.status === statusFilter)
    }
    return result
  }, [purchases, searchQuery, typeFilter, statusFilter])

  const handleArriveClick = (purchase: Purchasing) => {
    setTargetPurchase(purchase)
    setArriveFormData({
      date_arrived: format(new Date(), "yyyy-MM-dd"),
      po_number: "",
      category: "SHOP PARTS AND GOODS",
      customCategory: "",
      total_amount: "",
      description: purchase.item_description || "",
      charge_to: "",
      invoice_number: "",
      supplier_name: purchase.supplier_name || "",
      unit_vehicle: "",
      plate_number: "",
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
      const finalDateArrived = `${arriveFormData.date_arrived}T${arriveTime}`

      const resPurchase = await fetch(`/api/purchasing?id=${targetPurchase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Arrived", date_arrived: finalDateArrived })
      })
      if (!resPurchase.ok) throw new Error("Failed to update purchasing status")

      const finalCategory = arriveFormData.category === "CUSTOM" ? arriveFormData.customCategory : arriveFormData.category
      const resExpense = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: finalCategory,
          description: arriveFormData.description,
          date_issued: arriveFormData.date_arrived,
          supplier_name: arriveFormData.supplier_name,
          type_of_payment: arriveFormData.po_number ? `PO - ${arriveFormData.po_number}` : "PO",
          total_amount: parseFloat(arriveFormData.total_amount.replace(/,/g, '')) || 0,
          remarks: arriveFormData.remarks,
          charge_to: arriveFormData.charge_to,
          invoice_number: arriveFormData.invoice_number,
          unit_vehicle: arriveFormData.unit_vehicle,
          plate_number: arriveFormData.plate_number
        })
      })

      if (!resExpense.ok) throw new Error("Failed to sync to expenses")

      toast({ title: "Success", description: "Item marked as arrived and synced to Expenses." })
      fetchPurchases()
      setIsArriveModalOpen(false)
      setTargetPurchase(null)
    } catch (error) {
      toast({ title: "Error", description: "Could not update status.", variant: "destructive" })
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

      const payload = {
        ...formData,
        date_purchased: finalDatePurchased
      }

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
      setFormData({
        type: "PR",
        item_description: "",
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
    setFormData({
      type: purchase.type,
      item_description: purchase.item_description,
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
              setFormData({
                type: "PR",
                item_description: "",
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
                <th colSpan={9} className="border-0 bg-white px-0 py-4 font-normal normal-case">
                  <div className="flex flex-col w-full mb-4">
                    <h1 className="text-xl font-black uppercase tracking-tight text-black text-center mb-4">PURCHASING MONITORING</h1>
                  </div>
                </th>
              </tr>
              <tr>
                <th scope="col" className="px-4 py-3 min-w-[120px]">DATE PURCHASED</th>
                <th scope="col" className="px-4 py-3 min-w-[80px]">TYPE</th>
                <th scope="col" className="px-4 py-3 min-w-[200px]">ITEM DESCRIPTION</th>
                <th scope="col" className="px-4 py-3 min-w-[150px]">SUPPLIER</th>
                <th scope="col" className="px-4 py-3 min-w-[100px]">STATUS</th>
                <th scope="col" className="px-4 py-3 min-w-[120px]">DATE ARRIVED</th>
                <th scope="col" className="px-4 py-3 min-w-[120px]">AGING</th>
                <th scope="col" className="px-4 py-3 min-w-[150px]">REMARKS</th>
                <th scope="col" className="px-4 py-3 min-w-[100px] text-center print:hidden">ACTION</th>
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
                  <tr key={purchase.id} className="transition-colors font-medium">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{format(new Date(purchase.date_purchased), "MMM d, yyyy h:mm a")}</td>
                    <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded text-xs font-bold", purchase.type === "PR" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800")}>
                            {purchase.type}
                        </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">{purchase.item_description}</td>
                    <td className="px-4 py-3">{purchase.supplier_name || "-"}</td>
                    <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 inline-flex items-center gap-1 rounded text-xs font-bold", purchase.status === "Arrived" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>
                            {purchase.status === "Arrived" && <Check className="w-3 h-3" />}
                            {purchase.status}
                        </span>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap text-gray-600">
                        {purchase.date_arrived ? format(new Date(purchase.date_arrived), "MMM d, yyyy h:mm a") : "-"}
                    </td>
                    <td className="px-4 py-3 text-red-600 font-bold whitespace-nowrap">{calculateAging(purchase.date_purchased, purchase.date_arrived, purchase.status)}</td>
                    <td className="px-4 py-3 text-xs italic">{purchase.remarks || "-"}</td>
                    <td className="px-4 py-3 text-center print:hidden">
                        <div className="flex items-center justify-center gap-2">
                          {purchase.status === "Pending" && (
                              <Button 
                                onClick={() => handleArriveClick(purchase)}
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white font-bold h-7 text-xs px-2"
                                title="Mark as Arrived"
                              >
                                  <Check className="w-3 h-3 mr-1" /> Arrive
                              </Button>
                          )}
                          <Button
                            onClick={() => handleEdit(purchase)}
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 !bg-white !border-blue-200 !text-blue-600 hover:!bg-blue-50 hover:!text-blue-700"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(purchase.id)}
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 !bg-white !border-red-200 !text-red-600 hover:!bg-red-50 hover:!text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <DialogContent className="max-w-2xl !bg-white [&>button]:!text-gray-700 [&>button:hover]:!text-gray-900">
          <DialogHeader className="border-b !border-gray-200 pb-4">
            <DialogTitle className="text-xl font-extrabold !text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              {editingPurchase ? "Edit Purchasing Item" : "Add Purchasing Item"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Fill in the details for the new purchase request or order.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="!text-gray-700 font-semibold text-xs uppercase">Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val) => setFormData(prev => ({...prev, type: val}))}
                >
                  <SelectTrigger className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PR">Purchase Request (PR)</SelectItem>
                    <SelectItem value="PO">Purchase Order (PO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="!text-gray-700 font-semibold text-xs uppercase">Date Purchased / Requested *</Label>
                <Input 
                  type="date" 
                  required
                  value={formData.date_purchased}
                  onChange={(e) => setFormData(prev => ({...prev, date_purchased: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="!text-gray-700 font-semibold text-xs uppercase">Item Description *</Label>
                <Textarea 
                  required
                  placeholder="What is being purchased?"
                  value={formData.item_description}
                  onChange={(e) => setFormData(prev => ({...prev, item_description: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium min-h-[80px]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="!text-gray-700 font-semibold text-xs uppercase">Supplier Name</Label>
                <Input 
                  placeholder="Optional supplier name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData(prev => ({...prev, supplier_name: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="!text-gray-700 font-semibold text-xs uppercase">Remarks</Label>
                <Textarea 
                  placeholder="Any additional notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({...prev, remarks: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="border-t !border-gray-200 pt-4 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="!bg-white hover:!bg-gray-100 !text-gray-700 font-bold border-gray-300">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="!bg-blue-600 hover:!bg-blue-700 !text-white font-bold px-8">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Purchase"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isArriveModalOpen} onOpenChange={setIsArriveModalOpen}>
        <DialogContent className="sm:max-w-2xl !bg-white max-h-[90vh] overflow-y-auto [&>button]:!text-gray-700 [&>button:hover]:!text-gray-900">
          <form onSubmit={handleConfirmArrive}>
            <DialogHeader>
              <DialogTitle className="!text-gray-900 text-xl font-bold">Item Arrival & Sync</DialogTitle>
              <DialogDescription>
                Confirm arrival for <strong>{targetPurchase?.item_description}</strong>. This will automatically sync to Expenses Monitoring.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date_arrived" className="!text-gray-700 font-semibold">Arrive Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="date_arrived"
                  type="date" 
                  required
                  style={{ colorScheme: 'light' }}
                  value={arriveFormData.date_arrived}
                  onChange={(e) => setArriveFormData(prev => ({...prev, date_arrived: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="po_number" className="!text-gray-700 font-semibold">PO Number <span className="text-red-500">*</span></Label>
                <Input 
                  id="po_number"
                  required
                  placeholder="Enter PO Number"
                  value={arriveFormData.po_number}
                  onChange={(e) => setArriveFormData(prev => ({...prev, po_number: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category" className="!text-gray-700 font-semibold">Expense Category <span className="text-red-500">*</span></Label>
                <Select required value={arriveFormData.category} onValueChange={(v) => setArriveFormData(prev => ({...prev, category: v}))}>
                  <SelectTrigger className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="!text-gray-900 hover:bg-gray-100">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_amount" className="!text-gray-700 font-semibold">Total Amount (₱) <span className="text-red-500">*</span></Label>
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
                      setArriveFormData(prev => ({...prev, total_amount: ''}));
                      return;
                    }
                    const parts = val.split('.');
                    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                    if (parts[0]) parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
                    val = parts.join('.');
                    setArriveFormData(prev => ({...prev, total_amount: val}));
                  }}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
              {arriveFormData.category === "CUSTOM" && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 md:col-span-2">
                  <Label htmlFor="customCategory" className="!text-gray-700 font-semibold text-xs">Custom Category <span className="text-red-500">*</span></Label>
                  <Input 
                    id="customCategory"
                    required
                    placeholder="Enter custom category"
                    value={arriveFormData.customCategory}
                    onChange={(e) => setArriveFormData(prev => ({...prev, customCategory: e.target.value}))}
                    className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                  />
                </div>
              )}
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="description" className="!text-gray-700 font-semibold">Expenses Description <span className="text-red-500">*</span></Label>
                <Input 
                  id="description"
                  required
                  placeholder="Expenses Description"
                  value={arriveFormData.description}
                  onChange={(e) => setArriveFormData(prev => ({...prev, description: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="charge_to" className="!text-gray-700 font-semibold">Charge To <span className="text-red-500">*</span></Label>
                <Input 
                  id="charge_to"
                  required
                  placeholder="Charge To"
                  value={arriveFormData.charge_to}
                  onChange={(e) => setArriveFormData(prev => ({...prev, charge_to: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_number" className="!text-gray-700 font-semibold">Invoice No.</Label>
                <Input 
                  id="invoice_number"
                  placeholder="Invoice No."
                  value={arriveFormData.invoice_number}
                  onChange={(e) => setArriveFormData(prev => ({...prev, invoice_number: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier_name" className="!text-gray-700 font-semibold">Supplier Name</Label>
                <Input 
                  id="supplier_name"
                  placeholder="Supplier Name"
                  value={arriveFormData.supplier_name}
                  onChange={(e) => setArriveFormData(prev => ({...prev, supplier_name: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_vehicle" className="!text-gray-700 font-semibold">Unit/Vehicle <span className="text-red-500">*</span></Label>
                <Input 
                  id="unit_vehicle"
                  required
                  placeholder="Unit/Vehicle"
                  value={arriveFormData.unit_vehicle}
                  onChange={(e) => setArriveFormData(prev => ({...prev, unit_vehicle: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plate_number" className="!text-gray-700 font-semibold">Plate # <span className="text-red-500">*</span></Label>
                <Input 
                  id="plate_number"
                  required
                  placeholder="Plate #"
                  value={arriveFormData.plate_number}
                  onChange={(e) => setArriveFormData(prev => ({...prev, plate_number: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="remarks" className="!text-gray-700 font-semibold">Remarks</Label>
                <Input 
                  id="remarks"
                  placeholder="Remarks"
                  value={arriveFormData.remarks}
                  onChange={(e) => setArriveFormData(prev => ({...prev, remarks: e.target.value}))}
                  className="w-full !bg-white !border-gray-300 !text-gray-900 font-medium h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsArriveModalOpen(false)} className="!bg-white !border-gray-300 !text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
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
    </div>
  )
}
