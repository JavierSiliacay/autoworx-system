"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Search, Plus, ArrowLeft, Package,
  Tag, Loader2, Edit2, Trash2,
  Filter, ChevronRight, Globe, Info,
  CarFront, Database, Save, X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { VEHICLE_BRANDS } from "@/lib/constants"
import { AccountingRestrictionOverlay } from "@/components/admin/accounting-restriction-overlay"

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface PartPrice {
  id: string
  brand: string
  part_name: string
  category: string
  price: number
  specifications: string
  updated_at: string
  updated_by: string
}

const CATEGORIES = ["PMS", "Brakes", "Suspension", "Engine", "Electrical", "Body Parts", "General", "Genuine", "Surplus", "Custom"]

const formatNumberWithCommas = (val: string) => {
  const numeric = val.replace(/[^0-9.]/g, "");
  const parts = numeric.split(".");
  // Only allow one decimal point
  if (parts.length > 2) return parts[0] + "." + parts[1];
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

export default function PartsPricesPage() {
  const router = useRouter()
  const { status, data: session } = useSession()

  const [prices, setPrices] = useState<PartPrice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingPart, setEditingPart] = useState<PartPrice | null>(null)

  const [formData, setFormData] = useState({
    brand: "",
    part_name: "",
    category: "Genuine",
    customCategory: "",
    price: "",
    specifications: ""
  })

  /* ── Auth guard ── */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin")
    // Staff and Admin are allowed based on the user's request
  }, [status, router])

  /* ── Fetch data ── */
  const fetchPrices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/parts/prices")
      if (res.ok) {
        const data = await res.json()
        setPrices(data)
      }
    } catch (err) {
      console.error("Failed to fetch prices:", err)
      toast({ title: "Error", description: "Failed to load price list.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchPrices()
    }
  }, [status])

  /* ── Logic ── */
  const brandsWithPrices = useMemo(() => {
    const brands = new Set(prices.map(p => p.brand))
    return Array.from(brands)
  }, [prices])

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    prices.forEach(p => {
      counts[p.brand] = (counts[p.brand] || 0) + 1
    })
    return counts
  }, [prices])

  const filteredPrices = useMemo(() => {
    const searchTokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)

    return prices.filter(p => {
      // 1. Brand Filter
      const matchesBrand = !selectedBrand || selectedBrand === "All Brands" || p.brand === selectedBrand

      // 2. Tokenized Search Filter
      if (searchTokens.length === 0) return matchesBrand

      const searchableText = `${p.part_name} ${p.brand} ${p.category} ${p.specifications || ""}`.toLowerCase()
      const matchesSearch = searchTokens.every(token => searchableText.includes(token))

      return matchesBrand && matchesSearch
    })
  }, [prices, selectedBrand, searchQuery])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.brand || !formData.part_name || !formData.price) {
      toast({ title: "Required Fields", description: "Brand, Part Name, and Price are required.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const method = editingPart ? "PUT" : "POST"
      const cleanPrice = Number(formData.price.replace(/,/g, ""))
      const finalCategory = formData.category === "Custom" ? formData.customCategory : formData.category

      if (formData.category === "Custom" && !formData.customCategory) {
        toast({ title: "Required", description: "Please enter your custom category name.", variant: "destructive" })
        setIsSaving(false)
        return
      }

      const payload = {
        brand: formData.brand,
        part_name: formData.part_name,
        category: finalCategory,
        price: cleanPrice,
        specifications: formData.specifications,
        ...(editingPart && { id: editingPart.id })
      }

      const res = await fetch("/api/parts/prices", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: "Success", description: `Price entry ${editingPart ? "updated" : "added"} successfully.` })
        setIsModalOpen(false)
        fetchPrices()
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown database error" }))
        throw new Error(errorData.error || "Failed to save")
      }
    } catch (err: any) {
      console.error("Save error:", err)
      toast({ title: "Error", description: err.message || "Failed to save data.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this price entry?")) return

    try {
      const res = await fetch(`/api/parts/prices?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Entry removed successfully." })
        fetchPrices()
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" })
    }
  }

  const openAddModal = (brand?: string) => {
    setEditingPart(null)
    setFormData({
      brand: brand || (selectedBrand !== "All Brands" ? selectedBrand || "" : ""),
      part_name: "",
      category: "Genuine",
      customCategory: "",
      price: "",
      specifications: ""
    })
    setIsModalOpen(true)
  }

  const openEditModal = (part: PartPrice) => {
    const isStandard = ["PMS", "Brakes", "Suspension", "Engine", "Electrical", "Body Parts", "General", "Genuine", "Surplus"].includes(part.category)
    setEditingPart(part)
    setFormData({
      brand: part.brand,
      part_name: part.part_name,
      category: isStandard ? part.category : "Custom",
      customCategory: isStandard ? "" : part.category,
      price: formatNumberWithCommas(String(part.price)),
      specifications: part.specifications || ""
    })
    setIsModalOpen(true)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading Parts Catalogue...</p>
      </div>
    )
  }

  return (
    <AccountingRestrictionOverlay moduleName="Parts Pricing Ledger">
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
                <Tag className="w-6 h-6 text-primary" />
                PARTS PRICE LIST
              </h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Reference Catalogue</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search parts or brands..."
                className="pl-9 bg-slate-100/10 border-slate-700/50 focus:bg-slate-800/50 transition-all text-slate-100 placeholder:text-slate-500 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => openAddModal()} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Price</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        {/* ─── Brand Selector ─── */}
        {!selectedBrand ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CarFront className="w-5 h-5 text-primary" />
                Select a Brand
              </h2>
              <Badge variant="outline" className="bg-white text-slate-900 border-slate-300 font-bold">{VEHICLE_BRANDS.length - 1} Brands Available</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Special Card for All Brands */}
              <motion.button
                whileHover={{ scale: 1.02, translateY: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedBrand("All Brands")}
                className="group relative aspect-square bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Globe className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-600 group-hover:text-primary">All Brands</span>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {prices.length > 0 ? (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] font-bold border-none px-2 py-0.5">
                      {prices.length} Items
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-[9px] font-medium border-none px-2 py-0.5">
                      No items
                    </Badge>
                  )}
                </div>
              </motion.button>

              {VEHICLE_BRANDS.filter(b => b !== "Other").map((brand) => {
                const hasPrices = brandsWithPrices.includes(brand)
                const logoPath = `/carbrands/${brand.toLowerCase()}.png`

                return (
                  <motion.button
                    key={brand}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedBrand(brand)}
                    className="group relative aspect-square bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="relative w-full h-full flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500 opacity-80 group-hover:opacity-100">
                      <Image
                        src={logoPath}
                        alt={brand}
                        fill
                        className="object-contain p-2"
                        onError={(e) => {
                          // If image fails, show a fallback
                          (e.target as any).style.display = 'none';
                        }}
                      />
                      {/* Fallback Initial */}
                      <div className="brand-fallback hidden group-has-[img[style*='display: none']]:flex w-12 h-12 rounded-full bg-slate-50 items-center justify-center text-xl font-black text-slate-300">
                        {brand[0]}
                      </div>
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">{brand}</span>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {hasPrices ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-[9px] font-black border-emerald-100 px-2 py-0.5 shadow-sm">
                          {brandCounts[brand] || 0} Items
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-[9px] font-medium border-slate-100 px-2 py-0.5">
                          No items listed
                        </Badge>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        ) : (
          /* ─── Detailed List View ─── */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedBrand(null)} className="rounded-full bg-white text-slate-900 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="font-bold">Back</span>
                </Button>
                <div className="flex items-center gap-3">
                  {selectedBrand !== "All Brands" && (
                    <div className="relative w-10 h-10">
                      <Image
                        src={`/carbrands/${selectedBrand.toLowerCase()}.png`}
                        alt={selectedBrand}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedBrand} CATALOGUE</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-900 text-white hover:bg-slate-800 border-none px-3 py-1 font-bold">{filteredPrices.length} Items</Badge>
                <Button size="sm" onClick={() => openAddModal(selectedBrand === "All Brands" ? "" : selectedBrand)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add New
                </Button>
              </div>
            </div>

            {/* Price Table - Matching /parts style */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Part Name</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence mode="popLayout">
                      {filteredPrices.length > 0 ? (
                        filteredPrices.map((item) => (
                          <motion.tr
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={item.id}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-[10px] text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded">{item.brand}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-sm">{item.part_name}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{item.specifications || "Standard Spec"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tight bg-slate-50 text-slate-600 border-slate-200">
                                {item.category}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-black text-lg text-primary">₱{item.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Database className="w-12 h-12 text-slate-200" />
                              <p className="text-slate-400 font-medium italic">No parts found for this selection.</p>
                              <Button variant="outline" size="sm" onClick={() => openAddModal()}>Add First Part</Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* ─── Add/Edit Modal ─── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {editingPart ? "Edit Price Entry" : "New Price Entry"}
            </DialogTitle>
            <DialogDescription>
              Set the standard reference price for this part.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="brand" className="text-xs font-black uppercase text-slate-400">Car Brand</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(val) => setFormData({ ...formData, brand: val })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100 font-medium">
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_BRANDS.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="category" className="text-xs font-black uppercase text-slate-400">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100 font-medium">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AnimatePresence>
              {formData.category === "Custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="customCategory" className="text-xs font-black uppercase text-blue-400">Specify Custom Category</Label>
                  <Input
                    id="customCategory"
                    placeholder="e.g. Replacement, Aftermarket"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    className="bg-blue-500/10 border-blue-500/30 text-slate-100 font-medium placeholder:text-slate-400"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="part_name" className="text-xs font-black uppercase text-slate-400">Part Name</Label>
              <Input
                id="part_name"
                placeholder="e.g. Oil Filter, Brake Pads"
                value={formData.part_name}
                onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-slate-100 font-medium placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-xs font-black uppercase text-slate-400">Price (₱)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                <Input
                  id="price"
                  type="text"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: formatNumberWithCommas(e.target.value) })}
                  className="pl-8 bg-slate-800/50 border-slate-700 font-bold text-slate-100 text-lg placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specifications" className="text-xs font-black uppercase text-slate-400">Specifications / Notes</Label>
              <Input
                id="specifications"
                placeholder="e.g. 1pc, 4L, or specific dimensions"
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl min-w-[100px]">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {editingPart ? "Update" : "Save Part"}
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </AccountingRestrictionOverlay>
  )
}
