"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Search, Plus, ArrowLeft, Package,
  Tag, Loader2, Edit2, Trash2,
  Filter, PaintBucket, Save, X
} from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"

import { COMMON_UNITS } from "@/lib/constants"

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface PriceListItem {
  id: string
  item_name: string
  category: string
  unit: string
  supplier_price: number
  selling_price: number
  updated_at: string
  updated_by: string
}

const CATEGORIES = ["Nax Paints", "Premila Paints", "Solvents & Thinners", "Primers", "Topcoats", "Consumables", "Abrasives", "Custom"]

const formatNumberWithCommas = (val: string) => {
  const numeric = val.replace(/[^0-9.]/g, "");
  const parts = numeric.split(".");
  if (parts.length > 2) return parts[0] + "." + parts[1];
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

export default function ItemsPriceListPage() {
  const router = useRouter()
  const { status } = useSession()

  const [items, setItems] = useState<PriceListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories")

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null)

  const [formData, setFormData] = useState({
    item_name: "",
    category: "Nax Paints",
    customCategory: "",
    unit: "Lit",
    customUnit: "",
    supplier_price: "",
    selling_price: ""
  })

  /* ── Auth guard ── */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin")
  }, [status, router])

  /* ── Fetch data ── */
  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/parts/prices/items")
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (err) {
      console.error("Failed to fetch items:", err)
      toast({ title: "Error", description: "Failed to load items.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchItems()
    }
  }, [status])

  /* ── Logic ── */
  const activeCategories = useMemo(() => {
    const cats = new Set(items.map(p => p.category))
    return Array.from(cats)
  }, [items])

  const filteredItems = useMemo(() => {
    const searchTokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)

    return items.filter(p => {
      // 1. Category Filter
      const matchesCategory = selectedCategory === "All Categories" || p.category === selectedCategory

      // 2. Tokenized Search Filter
      if (searchTokens.length === 0) return matchesCategory

      const searchableText = `${p.item_name} ${p.category} ${p.unit}`.toLowerCase()
      const matchesSearch = searchTokens.every(token => searchableText.includes(token))

      return matchesCategory && matchesSearch
    })
  }, [items, selectedCategory, searchQuery])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.item_name || !formData.supplier_price || !formData.selling_price) {
      toast({ title: "Required Fields", description: "Item Name, Supplier Price, and Selling Price are required.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const method = editingItem ? "PUT" : "POST"
      const cleanSupplierPrice = Number(formData.supplier_price.replace(/,/g, ""))
      const cleanSellingPrice = Number(formData.selling_price.replace(/,/g, ""))
      
      const finalCategory = formData.category === "Custom" ? formData.customCategory : formData.category
      const finalUnit = formData.unit === "Custom" ? formData.customUnit : formData.unit

      if (formData.category === "Custom" && !formData.customCategory) {
        toast({ title: "Required", description: "Please enter your custom category name.", variant: "destructive" })
        setIsSaving(false)
        return
      }

      const payload = {
        item_name: formData.item_name,
        category: finalCategory,
        unit: finalUnit,
        supplier_price: cleanSupplierPrice,
        selling_price: cleanSellingPrice,
        ...(editingItem && { id: editingItem.id })
      }

      const res = await fetch("/api/parts/prices/items", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: "Success", description: `Item ${editingItem ? "updated" : "added"} successfully.` })
        setIsModalOpen(false)
        fetchItems()
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown database error" }))
        throw new Error(errorData.error || "Failed to save")
      }
    } catch (err: any) {
      console.error("Save error:", err)
      toast({ title: "Error", description: err.message || "Failed to save data. Make sure you created the price_list_items table in Supabase.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const res = await fetch(`/api/parts/prices/items?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Item removed successfully." })
        fetchItems()
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" })
    }
  }

  const openAddModal = () => {
    setEditingItem(null)
    setFormData({
      item_name: "",
      category: selectedCategory !== "All Categories" ? selectedCategory : "Nax Paints",
      customCategory: "",
      unit: "Lit",
      customUnit: "",
      supplier_price: "",
      selling_price: ""
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: PriceListItem) => {
    const isStandardCategory = CATEGORIES.includes(item.category)
    const isStandardUnit = COMMON_UNITS.includes(item.unit as any)

    setEditingItem(item)
    setFormData({
      item_name: item.item_name,
      category: isStandardCategory ? item.category : "Custom",
      customCategory: isStandardCategory ? "" : item.category,
      unit: isStandardUnit ? item.unit : "Custom",
      customUnit: isStandardUnit ? "" : item.unit,
      supplier_price: formatNumberWithCommas(String(item.supplier_price)),
      selling_price: formatNumberWithCommas(String(item.selling_price))
    })
    setIsModalOpen(true)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading Items Catalogue...</p>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* ─── Header ─── */}
      <header className="bg-white border-b sticky top-0 z-30 px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin/dashboard")} className="text-slate-900 hover:bg-slate-200 hover:text-black transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <PaintBucket className="w-6 h-6 text-primary" />
                ITEMS PRICE LIST
              </h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Paints, Solvents, & Consumables</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search items..."
                className="pl-9 bg-white border-slate-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={openAddModal} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Item</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Button
            variant={selectedCategory === "All Categories" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("All Categories")}
            className="rounded-full"
          >
            All
          </Button>
          {Array.from(new Set([...CATEGORIES.filter(c => c !== "Custom"), ...activeCategories])).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* ─── Table ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Unit</th>
                  <th className="px-6 py-4 text-right">Supplier Price (₱)</th>
                  <th className="px-6 py-4 text-right">Selling Price (₱)</th>
                  <th className="px-6 py-4 text-right">Updated</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No items found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-900">{item.item_name}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="text-slate-600 font-medium">
                          {item.unit}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">
                        {item.supplier_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-green-700">
                        {item.selling_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-medium text-slate-900">
                            {new Date(item.updated_at).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-500 max-w-[100px] truncate" title={item.updated_by}>
                            {item.updated_by}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </main>

      {/* ─── Add/Edit Modal ─── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900 font-bold flex items-center gap-2">
                {editingItem ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                {editingItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-6">
              <div className="grid gap-2">
                <Label className="text-slate-700">Item Name <span className="text-red-500">*</span></Label>
                <Input
                  required
                  placeholder="e.g. Nax Multipurpose thinner"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-slate-700">Category <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger className="text-slate-900">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.category === "Custom" && (
                  <div className="grid gap-2">
                    <Label className="text-slate-700">Custom Category <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="Enter category"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      className="text-slate-900"
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label className="text-slate-700">Unit <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(val) => setFormData({ ...formData, unit: val })}
                  >
                    <SelectTrigger className="text-slate-900">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_UNITS.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                      <SelectItem value="Gal">Gal</SelectItem>
                      <SelectItem value="litro">litro</SelectItem>
                      <SelectItem value="Custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.unit === "Custom" && (
                  <div className="grid gap-2">
                    <Label className="text-slate-700">Custom Unit <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="e.g. roll, pack"
                      value={formData.customUnit}
                      onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                      className="text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-slate-700">Supplier's Price (₱) <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    placeholder="0.00"
                    value={formData.supplier_price}
                    onChange={(e) => setFormData({ ...formData, supplier_price: formatNumberWithCommas(e.target.value) })}
                    className="font-mono text-slate-900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-slate-700">Selling Price (₱) <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    placeholder="0.00"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: formatNumberWithCommas(e.target.value) })}
                    className="font-mono text-green-700 font-bold"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingItem ? "Save Changes" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}
