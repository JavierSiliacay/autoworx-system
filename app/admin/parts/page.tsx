"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { createClient } from "@/lib/supabase/client"
import {
    Wrench,
    LogOut,
    Package,
    Search,
    Plus,
    History,
    AlertTriangle,
    ChevronRight,
    Filter,
    ArrowRight,
    CheckCircle2,
    Trash2,
    Edit,
    RefreshCw,
    LayoutDashboard,
    Clock,
    CheckCircle,
    PlusCircle,
    Copy,
    ArrowLeft,
    X,
    ShoppingBag,
    Monitor
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

export default function PartsRoom() {
    const router = useRouter()
    const { status, data: session } = useSession()
    const [activeView, setActiveView] = useState<"units" | "stock">("units")
    const [searchQuery, setSearchQuery] = useState("")

    // Placeholder states
    const [units, setUnits] = useState<any[]>([])
    const [stock, setStock] = useState<any[]>([])
    const [selectedUnit, setSelectedUnit] = useState<any>(null)
    const [unitParts, setUnitParts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPartsLoading, setIsPartsLoading] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingPart, setEditingPart] = useState<any>(null)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inventorySearch, setInventorySearch] = useState("")
    const [categories, setCategories] = useState<string[]>(['Engine Oil', 'Filters', 'Brake Pads', 'Coolant', 'Electrical'])
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [newCategory, setNewCategory] = useState("")
    const [isElectron, setIsElectron] = useState(false)

    const handleSavePart = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedUnit) return

        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const partData: any = {
            name: formData.get("name"),
            brand: formData.get("brand"),
            part_type: formData.get("part_type"),
            price: 0,
            quantity: parseInt(formData.get("quantity") as string) || 1,
            status: formData.get("status") || 'pending',
            inventory_id: editingPart?.inventory_id || null
        }

        try {
            const url = "/api/parts"
            const method = (editingPart && editingPart.id) ? "PUT" : "POST"

            if (editingPart && editingPart.id) {
                partData.id = editingPart.id
            } else {
                partData.appointment_id = selectedUnit.id
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(partData),
            })

            if (res.ok) {
                toast({ title: "Success", description: (editingPart && editingPart.id) ? "Part updated." : "Part added to unit." })
                setIsAddModalOpen(false)
                setEditingPart(null)
                fetchUnitParts(selectedUnit.id)
                fetchInventory()
            } else {
                const err = await res.json()
                toast({ title: "Error", description: err.error || "Failed to save part", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        }
        setIsSubmitting(false)
    }


    const handleDeletePart = async (id: string) => {
        if (!confirm("Remove this part from the list?")) return
        try {
            const res = await fetch(`/api/parts?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast({ title: "Removed", description: "Part removed from unit list." })
                fetchUnitParts(selectedUnit.id)
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove part", variant: "destructive" })
        }
    }

    const handleToggleAvailability = async (part: any) => {
        let newStatus = 'pending'
        if (part.status === 'pending') newStatus = 'available'
        else if (part.status === 'available') newStatus = 'needs_buy'
        else if (part.status === 'needs_buy') newStatus = 'pending'
        try {
            const res = await fetch("/api/parts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: part.id, status: newStatus }),
            })

            if (res.ok) {
                toast({ title: "Status Updated", description: `${part.name} is now ${newStatus}.` })
                fetchUnitParts(selectedUnit.id)
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
    }

    const handleDuplicateItem = (item: any) => {
        const newItem = { ...item };
        delete newItem.id;
        delete newItem.created_at;
        newItem.name = `${newItem.name} (Copy)`;
        setEditingItem(newItem);
        setIsInventoryModalOpen(true);
    }

    const fetchUnits = useCallback(async () => {
        try {
            const res = await fetch("/api/appointments")
            if (res.ok) {
                const data = await res.json()
                // Filter for non-completed/non-cancelled if desired, 
                // but user said "match from admin active appointments"
                setUnits(data)
            }
        } catch (error) {
            console.error("Error fetching units:", error)
        }
    }, [])

    const fetchUnitParts = useCallback(async (appointmentId: string) => {
        setIsPartsLoading(true)
        try {
            const res = await fetch(`/api/parts?appointment_id=${appointmentId}`)
            if (res.ok) {
                const data = await res.json()
                setUnitParts(data)
            }
        } catch (error) {
            console.error("Error fetching parts:", error)
        }
        setIsPartsLoading(false)
    }, [])

    const fetchInventory = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/inventory")
            if (res.ok) {
                const data = await res.json()
                setStock(data)
            }
        } catch (error) {
            console.error("Error fetching inventory:", error)
        }
        setIsLoading(false)
    }, [])

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/inventory/categories")
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data) && data.length > 0) {
                    setCategories(data.map((c: any) => c.name))
                }
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }, [])

    const handleAddNewCategory = async () => {
        if (!newCategory.trim()) return;
        if (categories.some(c => c.toLowerCase() === newCategory.trim().toLowerCase())) {
            toast({ title: "Already exists", description: "This category is already in your list." })
            setNewCategory("");
            setIsAddingCategory(false);
            return;
        }

        try {
            const res = await fetch("/api/inventory/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategory.trim() }),
            })

            if (res.ok) {
                toast({ title: "Category Saved", description: `"${newCategory.trim()}" has been added to the warehouse.` })
                fetchCategories()
                setNewCategory("");
                setIsAddingCategory(false);
            } else {
                let errorMessage = "Failed to save category";
                try {
                    const err = await res.json()
                    errorMessage = err.error || errorMessage;
                } catch (e) {
                    // Body is not JSON
                    if (res.status === 401) errorMessage = "Unauthorized session. Please re-login.";
                    if (res.status === 404) errorMessage = "API endpoint not found.";
                }
                toast({ title: "Error", description: errorMessage, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Network or Server error", variant: "destructive" })
        }
    }

    useEffect(() => {
        if (selectedUnit) {
            fetchUnitParts(selectedUnit.id)
        }
    }, [selectedUnit, fetchUnitParts])

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push("/admin")
    }

    const handleSaveInventory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const itemData: any = {
            name: formData.get("name"),
            sku: formData.get("sku"),
            category: formData.get("category"),
            brand: formData.get("brand"),
            cost_price: 0,
            selling_price: 0,
            quantity: parseInt(formData.get("quantity") as string) || 0,
            min_stock_level: parseInt(formData.get("min_stock_level") as string) || 2,
            location: formData.get("location"),
        }

        try {
            const url = "/api/inventory"
            const method = editingItem ? "PUT" : "POST"
            if (editingItem) itemData.id = editingItem.id

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(itemData),
            })

            if (res.ok) {
                toast({ title: "Success", description: editingItem ? "Item updated." : "Item added to inventory." })
                setIsInventoryModalOpen(false)
                setEditingItem(null)
                fetchInventory()
            } else {
                const err = await res.json()
                toast({ title: "Error", description: err.error || "Failed to save item", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        }
        setIsSubmitting(false)
    }

    const handleDeleteInventory = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return
        try {
            const res = await fetch(`/api/inventory?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast({ title: "Deleted", description: "Item removed from inventory." })
                fetchInventory()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete item", variant: "destructive" })
        }
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/admin")
            return
        }
        if (status === "authenticated" && session?.user?.role !== "admin") {
            router.push("/admin")
            return
        }

        fetchUnits()
        fetchInventory()
        fetchCategories()
        setIsElectron(typeof window !== 'undefined' && !!(window as any).electron)
    }, [status, session, router, fetchUnits, fetchInventory, fetchCategories])

    const filteredUnits = units.filter(unit =>
        unit.vehicle_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.vehicle_model.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                    <p className="text-slate-500 font-medium animate-pulse">Entering the Parts Room...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Professional Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-3 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <Link href="/admin/dashboard" className="flex items-center gap-2 group">
                                <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-lg group-hover:bg-primary transition-colors">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-serif text-lg font-bold tracking-tight text-slate-900">
                                        PARTS ROOM
                                    </span>
                                    <span className="text-[9px] uppercase tracking-widest text-slate-500 -mt-1 font-bold">
                                        Inventory & Logistics
                                    </span>
                                </div>
                            </Link>

                            {/* Center Navigation - The "Teleport" Button in reverse */}
                            <nav className="hidden md:flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                                <Link href="/admin/dashboard">
                                    <Button variant="ghost" size="sm" className="rounded-full text-slate-600 hover:text-primary">
                                        <LayoutDashboard className="w-4 h-4 mr-2" />
                                        Office / Admin
                                    </Button>
                                </Link>
                                <div className="w-px h-4 bg-slate-300 mx-1" />
                                <Button variant="secondary" size="sm" className="rounded-full shadow-sm bg-white text-primary">
                                    <Package className="w-4 h-4 mr-2" />
                                    Parts Room
                                </Button>
                            </nav>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex flex-col items-end mr-4">
                                <span className="text-xs font-bold text-slate-900">{session?.user?.name}</span>
                                <span className="text-[10px] text-slate-500">Parts In-Charge</span>
                            </div>
                            {!isElectron && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="hidden sm:flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all mr-2"
                                    onClick={() => {
                                        window.open('https://drive.google.com/file/d/1QKgR1ooGJLMrUXAh5ZGtSOPnnAKMz4mW/view?usp=sharing', '_blank');

                                        toast({
                                            title: "Redirecting to Download",
                                            description: "Opening Google Drive. Once downloaded, extract the ZIP and run 'electron.exe'.",
                                        })
                                    }}
                                >
                                    <Monitor className="w-4 h-4" />
                                    <span className="hidden lg:inline">Get Windows App</span>
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-200 hover:bg-slate-50 text-slate-700">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col lg:flex-row mx-auto w-full max-w-[1600px]">
                {/* Left Sidebar: Unit Selector */}
                <aside className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search Unit / Plate..."
                                className="pl-10 bg-white border-slate-200 text-sm text-slate-900 font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={activeView === "units" ? "default" : "outline"}
                                size="sm"
                                className="flex-1 text-xs h-8"
                                onClick={() => setActiveView("units")}
                            >
                                Active Units
                            </Button>
                            <Button
                                variant={activeView === "stock" ? "default" : "outline"}
                                size="sm"
                                className="flex-1 text-xs h-8"
                                onClick={() => setActiveView("stock")}
                            >
                                Warehouse
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {activeView === "units" ? (
                            <>
                                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Waiting for Parts
                                </div>
                                {filteredUnits.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 mx-2">
                                        <p className="text-xs text-slate-400">No active units found</p>
                                    </div>
                                ) : filteredUnits.map((unit) => (
                                    <button
                                        key={unit.id}
                                        onClick={() => setSelectedUnit(unit)}
                                        className={`w-full text-left p-3 rounded-lg transition-all group ${selectedUnit?.id === unit.id
                                            ? 'bg-primary text-white shadow-md'
                                            : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold text-sm ${selectedUnit?.id === unit.id ? 'text-white' : 'text-slate-900'}`}>
                                                {unit.vehicle_plate}
                                            </span>
                                            <Badge className={selectedUnit?.id === unit.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 border-blue-100'}>
                                                {unit.status === 'pending' ? 'New' : unit.status}
                                            </Badge>
                                        </div>
                                        <p className={`text-xs ${selectedUnit?.id === unit.id ? 'text-white/80' : 'text-slate-500'}`}>
                                            {unit.vehicle_make} {unit.vehicle_model} • {unit.vehicle_color || 'No Color'}
                                        </p>
                                    </button>
                                ))}
                            </>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-2">
                                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                    Warehouse Categories
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 hover:bg-slate-100"
                                        onClick={() => setIsAddingCategory(!isAddingCategory)}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                                {isAddingCategory && (
                                    <div className="px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="flex items-center gap-1">
                                            <Input
                                                className="h-8 text-xs bg-white text-slate-900 font-bold"
                                                placeholder="Category name..."
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleAddNewCategory();
                                                    }
                                                }}
                                            />
                                            <Button
                                                size="sm"
                                                className="h-8 px-2 bg-slate-900"
                                                onClick={handleAddNewCategory}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1 p-2">
                                    {categories.map((cat) => (
                                        <div key={cat} className="group flex items-center gap-1">
                                            <button
                                                onClick={() => setInventorySearch(cat)}
                                                className="flex-1 text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors flex items-center justify-between"
                                            >
                                                {cat}
                                                <Badge variant="outline" className="text-[10px] opacity-20 group-hover:opacity-100 transition-opacity">Stocked</Badge>
                                            </button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                                                title={activeView === "stock" ? `Add new ${cat} to Warehouse` : `Quick add ${cat} to unit`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (activeView === "stock") {
                                                        setEditingItem({ category: cat });
                                                        setIsInventoryModalOpen(true);
                                                    } else {
                                                        if (selectedUnit) {
                                                            setEditingPart({
                                                                name: "",
                                                                brand: "",
                                                                part_type: cat,
                                                                price: 0,
                                                                quantity: 1,
                                                                status: 'pending'
                                                            });
                                                            setIsAddModalOpen(true);
                                                        } else {
                                                            toast({
                                                                title: "Select a Unit First",
                                                                description: "Select an active unit from the sidebar to add parts to.",
                                                            });
                                                            setActiveView("units");
                                                        }
                                                    }
                                                }}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Center Section Switcher */}
                <section className="flex-1 bg-white overflow-hidden flex flex-col">
                    {activeView === "units" ? (
                        <div className="flex-1 overflow-y-auto">
                            {selectedUnit ? (
                                <div className="p-8 animate-in fade-in duration-300">
                                    <div className="flex justify-between items-end mb-8 border-b pb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-primary uppercase tracking-widest">Workshop Floor</span>
                                                <ChevronRight className="w-4 h-4 text-slate-300" />
                                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Unit {selectedUnit.vehicle_plate}</span>
                                            </div>
                                            <h2 className="text-3xl font-serif font-bold text-slate-900">{selectedUnit.vehicle_color} {selectedUnit.vehicle_make} {selectedUnit.vehicle_model}</h2>
                                            <p className="text-slate-500 uppercase text-xs font-bold tracking-tighter">Owner: {selectedUnit.name} • Service: {selectedUnit.service}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="outline" className="h-12 px-6" onClick={() => fetchUnitParts(selectedUnit.id)}>
                                                <RefreshCw className={`w-4 h-4 mr-2 ${isPartsLoading ? 'animate-spin' : ''}`} />
                                                Refresh
                                            </Button>
                                            <Button variant="outline" className="h-12 px-6 border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setActiveView("stock")}>
                                                <Package className="w-4 h-4 mr-2" />
                                                Pick from Cabinet
                                            </Button>
                                            <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800" onClick={() => {
                                                setEditingPart(null)
                                                setIsAddModalOpen(true)
                                            }}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Part
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                        {isPartsLoading ? (
                                            <div className="p-12 text-center">
                                                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-300 mb-2" />
                                                <p className="text-sm text-slate-500">Loading parts list...</p>
                                            </div>
                                        ) : unitParts.length === 0 ? (
                                            <div className="p-12 text-center bg-slate-50/30">
                                                <Package className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                                                <h3 className="font-bold text-slate-900">No parts listed yet</h3>
                                                <p className="text-sm text-slate-500 mt-1">Sir Sincer, use the button above to start listing parts.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-200">
                                                            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Item Details</th>
                                                            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Quantity</th>
                                                            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {unitParts.map((part) => (
                                                            <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <div className="font-bold text-slate-900">{part.name}</div>
                                                                        <button
                                                                            onClick={() => handleToggleAvailability(part)}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={`text-[9px] uppercase tracking-tighter h-5 ${part.status === 'available'
                                                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                                                    : part.status === 'needs_buy'
                                                                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                                    }`}
                                                                            >
                                                                                {part.status === 'available' ? (
                                                                                    <><CheckCircle className="w-2 h-2 mr-1" /> Available</>
                                                                                ) : part.status === 'needs_buy' ? (
                                                                                    <><ShoppingBag className="w-2 h-2 mr-1" /> Needs Buy</>
                                                                                ) : (
                                                                                    <><Clock className="w-2 h-2 mr-1" /> Pending</>
                                                                                )}
                                                                            </Badge>
                                                                        </button>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500">Type: {part.part_type} • Brand: {part.brand || 'No Brand'}</div>
                                                                </td>
                                                                <td className="p-4 text-center font-bold text-slate-900">
                                                                    {part.quantity}
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex justify-center gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-9 px-3 text-slate-400 hover:text-primary hover:bg-slate-50"
                                                                            onClick={() => {
                                                                                setEditingPart(part)
                                                                                setIsAddModalOpen(true)
                                                                            }}
                                                                        >
                                                                            <Edit className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-9 px-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                            onClick={() => handleDeletePart(part.id)}
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                        <Package className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to your Room, Sincer</h3>
                                    <p className="text-slate-500 max-w-sm">Select a vehicle from the unit selector on the left to manage its parts and billing.</p>

                                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                                        <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl text-left">
                                            <AlertTriangle className="w-6 h-6 text-blue-600 mb-3" />
                                            <h4 className="font-bold text-blue-900 mb-1">PWA Ready</h4>
                                            <p className="text-xs text-blue-700/70 leading-relaxed">Install this app on your Windows desktop for a faster, professional workshop experience.</p>
                                            <Button variant="link" className="p-0 h-auto text-xs text-blue-700 font-bold mt-2">
                                                Learn how <ArrowRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </div>
                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left">
                                            <RefreshCw className="w-6 h-6 text-slate-400 mb-3" />
                                            <h4 className="font-bold text-slate-900 mb-1">Live Sync</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">Your "Send to Bill" actions are instantly visible on Sir Paul's main office dashboard.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Warehouse / General Inventory View */
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30 p-8">
                            {selectedUnit && (
                                <div className="mb-6 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                                            UNIT
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900">Target: {selectedUnit.vehicle_plate}</h4>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{selectedUnit.vehicle_make} {selectedUnit.vehicle_model}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedUnit(null)} className="h-8 text-xs text-red-500 font-bold hover:bg-red-50">
                                            <X className="w-3 h-3 mr-1.5" />
                                            Remove Target
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setActiveView("units")} className="h-8 text-xs text-primary font-bold hover:bg-slate-50">
                                            <ArrowLeft className="w-3 h-3 mr-1.5" />
                                            Return to Floor
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-3xl font-serif font-bold text-slate-900">Main Stock Cabinet</h2>
                                    <p className="text-slate-500">Monitor availability and stock levels across all categories.</p>
                                </div>
                                <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800" onClick={() => {
                                    setEditingItem(null)
                                    setIsInventoryModalOpen(true)
                                }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add New Stock Item
                                </Button>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
                                <div className="p-4 border-b border-slate-100 flex gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Filter stock by name, SKU or brand..."
                                            className="pl-10 h-11 text-slate-900 font-medium"
                                            value={inventorySearch}
                                            onChange={(e) => setInventorySearch(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" className="h-11">
                                        <Filter className="w-4 h-4 mr-2" />
                                        Advanced Filters
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-slate-50 z-10">
                                            <tr className="border-b border-slate-200">
                                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Stock Details</th>
                                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Status</th>
                                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Quantity</th>
                                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {stock.filter(item =>
                                                item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                                                item.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                                                item.brand.toLowerCase().includes(inventorySearch.toLowerCase())
                                            ).map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-900">{item.name}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0">{item.sku}</Badge>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.brand} • {item.category}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {item.quantity <= item.min_stock_level ? (
                                                            <Badge className="bg-red-50 text-red-600 border-red-100 uppercase text-[9px]">Low Stock</Badge>
                                                        ) : (
                                                            <Badge className="bg-green-50 text-green-600 border-green-100 uppercase text-[9px]">Healthy</Badge>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="font-bold text-lg text-slate-900">{item.quantity}</div>
                                                        <div className="text-[10px] text-slate-400">Loc: {item.location}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex justify-center gap-1.5">
                                                            {selectedUnit && (
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 shadow-sm"
                                                                    title="Add to current unit"
                                                                    onClick={() => {
                                                                        setEditingPart({
                                                                            inventory_id: item.id,
                                                                            name: item.name,
                                                                            brand: item.brand,
                                                                            part_type: item.category,
                                                                            price: 0,
                                                                            quantity: 1,
                                                                            status: 'available'
                                                                        });
                                                                        setIsAddModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                onClick={() => handleDuplicateItem(item)}
                                                                title="Add Similar (Edit a new then add)"
                                                            >
                                                                <PlusCircle className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900" onClick={() => {
                                                                setEditingItem(item)
                                                                setIsInventoryModalOpen(true)
                                                            }}>
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteInventory(item.id)}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {/* Footer / Status Bar */}
            <footer className="bg-white border-t border-slate-200 px-8 py-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="flex gap-6">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        System Online
                    </span>
                    <span className="flex items-center gap-2">
                        <RefreshCw className="w-3 h-3" />
                        Last Synced: Just now
                    </span>
                </div>
                <div>
                    Autoworx Inventory v1.0 • Built with Passion
                </div>
            </footer>
            {/* Add/Edit Part Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                setIsAddModalOpen(open)
                if (!open) setEditingPart(null)
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{(editingPart && editingPart.id) ? 'Edit Part' : 'Add Part'} for {selectedUnit?.vehicle_plate}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSavePart} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Part Name</Label>
                            <Input id="name" name="name" defaultValue={editingPart?.name} placeholder="e.g. Front Bumper" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="brand">Brand</Label>
                                <Input id="brand" name="brand" defaultValue={editingPart?.brand} placeholder="Toyota OEM" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="part_type">Type</Label>
                                <Input id="part_type" name="part_type" defaultValue={editingPart?.part_type} placeholder="Body" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input id="quantity" name="quantity" type="number" defaultValue={editingPart?.quantity || 1} required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Availability</Label>
                            <select
                                id="status"
                                name="status"
                                defaultValue={editingPart?.status || 'pending'}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="pending">Pending (Processing)</option>
                                <option value="available">Available (Already on hand)</option>
                                <option value="needs_buy">Needs to buy by purchaser</option>
                            </select>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => {
                                setIsAddModalOpen(false)
                                setEditingPart(null)
                            }}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : ((editingPart && editingPart.id) ? "Update Part" : "Add to Unit List")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Warehouse Inventory Modal */}
            <Dialog open={isInventoryModalOpen} onOpenChange={(open) => {
                setIsInventoryModalOpen(open)
                if (!open) setEditingItem(null)
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Stock Item' : 'Add New Inventory Item'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveInventory} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="sku">SKU / Part Number</Label>
                                <Input id="sku" name="sku" defaultValue={editingItem?.sku} placeholder="SHOCK-001" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" name="category" defaultValue={editingItem?.category} placeholder="Suspension" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input id="name" name="name" defaultValue={editingItem?.name} placeholder="Gas Shock Absorber" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="brand">Brand</Label>
                                <Input id="brand" name="brand" defaultValue={editingItem?.brand} placeholder="Kayaba" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Warehouse Location</Label>
                                <Input id="location" name="location" defaultValue={editingItem?.location} placeholder="Rack A, Shelf 2" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Quantity in Stock</Label>
                                <Input id="quantity" name="quantity" type="number" defaultValue={editingItem?.quantity} placeholder="10" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="min_stock_level">Min Stock Level</Label>
                                <Input id="min_stock_level" name="min_stock_level" type="number" defaultValue={editingItem?.min_stock_level || 2} required />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsInventoryModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : (editingItem ? "Update Stock" : "Add to Warehouse")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
