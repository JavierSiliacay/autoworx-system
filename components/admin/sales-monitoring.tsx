"use client"

import React, { useState, useMemo } from "react"
import { Printer, Calendar as CalendarIcon, FileDown, Eye, Edit, Save, Loader2, X, FileCheck, FileX, Trash2, RefreshCw, BarChart3, TrendingUp, Search } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateReleaseMonitoringDoc } from "@/lib/generate-pdf"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { isAuthorizedAdminEmail } from "@/lib/auth"

export function SalesMonitoring({ records, onUpdate }: { records: any[], onUpdate?: () => void }) {
    const { data: session } = useSession()
    const { toast } = useToast()

    if (!isAuthorizedAdminEmail(session?.user?.email)) {
        return (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
                <X className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-bold">Unauthorized</h3>
                <p>You are not authorized to view this confidential report.</p>
            </div>
        )
    }

    // Extract unique months and years from created_at date strings
    const monthsMap = new Map<string, string>()
    const yearsSet = new Set<string>()

    records.forEach(r => {
        // For Sales Monitoring, we primarily care about the ENTRY date (created_at or original_created_at)
        const dateStr = r.createdAt || r.original_created_at || r.created_at
        if (dateStr) {
            const d = new Date(dateStr)
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear().toString()
                const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`
                const monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                
                if (!monthsMap.has(monthKey)) {
                    monthsMap.set(monthKey, monthLabel)
                }
                yearsSet.add(year)
            }
        }
    })

    // Sort months descending
    const availableMonths = Array.from(monthsMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    // Sort years descending
    const availableYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a))

    const [reportPeriod, setReportPeriod] = useState<"monthly" | "yearly">("monthly")

    // Default to the latest month or current month if no data
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const [selectedMonth, setSelectedMonth] = useState<string>(
        availableMonths.length > 0 ? availableMonths[0][0] : currentMonthKey
    )

    const currentYear = new Date().getFullYear().toString()
    const [selectedYear, setSelectedYear] = useState<string>(
        availableYears.length > 0 ? availableYears[0] : currentYear
    )

    React.useEffect(() => {
        // If the current selected month has no data, but others do, default to the latest month with data
        if (availableMonths.length > 0 && (!selectedMonth || !monthsMap.has(selectedMonth))) {
            setSelectedMonth(availableMonths[0][0])
        }
    }, [availableMonths, selectedMonth, monthsMap])

    React.useEffect(() => {
        if (availableYears.length > 0 && !yearsSet.has(selectedYear)) {
            setSelectedYear(availableYears[0])
        }
    }, [availableYears, selectedYear, yearsSet])

    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editedData, setEditedData] = useState<Record<string, any>>({})
    const [searchQuery, setSearchQuery] = useState("")
    const [claimTypeFilter, setClaimTypeFilter] = useState("all")
    const [isManualModalOpen, setIsManualModalOpen] = useState(false)
    const [manualEntry, setManualEntry] = useState({
        name: "",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_year: "",
        vehicle_plate: "",
        insurance: "Personal Claim",
        created_at: new Date().toISOString().split('T')[0],
        total_amount: 0,
        brpad: 0,
        aircon: 0,
        electrical: 0,
        mechanical: 0,
        remarks: ""
    })

    const normalizeString = (str: string) => {
        if (!str) return ""
        return str.toLowerCase().replace(/[\s\-\.\/\,]/g, "")
    }

    const tableRecords = useMemo(() => {
        return records.filter(r => {
            // Include all records in Sales Monitoring / Unit Entry regardless of backjob status


            const dateStr = r.createdAt || r.original_created_at || r.created_at
            if (!dateStr) return false
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return false

            if (reportPeriod === "monthly") {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                if (key !== selectedMonth) return false
            } else {
                const year = d.getFullYear().toString()
                if (year !== selectedYear) return false
            }

            if (searchQuery.trim()) {
                const q = normalizeString(searchQuery)
                const matches = [
                    r.name,
                    r.insurance,
                    r.vehicle_plate,
                    r.vehicle_make,
                    r.vehicle_model,
                    r.vehicle_year?.toString(),
                    r.estimate_number,
                    r.paul_notes,
                    r.current_repair_part
                ].some(field => normalizeString(field || "").includes(q))
                if (!matches) return false
            }

            if (claimTypeFilter !== "all") {
                const insurance = (r.insurance || "").toLowerCase()
                const isPersonal = insurance.includes("personal") || insurance.includes("cash") || !insurance
                if (claimTypeFilter === "insurance" && isPersonal) return false
                if (claimTypeFilter === "personal" && !isPersonal) return false
            }

            return true
        }).sort((a, b) => {
            const da = new Date(a.createdAt || a.original_created_at || a.created_at).getTime()
            const db = new Date(b.createdAt || b.original_created_at || b.created_at).getTime()
            return da - db 
        })
    }, [records, selectedMonth, selectedYear, reportPeriod, searchQuery, claimTypeFilter])

    const reportPeriodLabel = reportPeriod === "monthly"
        ? (monthsMap.get(selectedMonth) || new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }))
        : `Full Year ${selectedYear}`

    const getCategorizedCosts = (costing: any) => {
        let result = { brpad: 0, aircon: 0, electrical: 0, mechanical: 0, total: 0 }
        if (!costing) return result

        // Sales Monitoring only: exclusively sum up the original Repair Estimate items
        // and intentionally ignore any Gatepass breakdown to reflect true projected sales
        if (costing.items) {
            costing.items.forEach((item: any) => {
                const cat = item.category || ""
                if (cat === "Aircon") result.aircon += item.total || 0
                else if (cat === "Electrical") result.electrical += item.total || 0
                else if (cat === "Mechanical Works") result.mechanical += item.total || 0
                else result.brpad += item.total || 0
            })
        }
        
        // Compute the pristine estimate total using VAT and discounts.
        // We re-calculate instead of trusting costing.total because Gatepass 
        // edits in the DB might permanently overwrite costing.total.
        const originalSubtotal = result.brpad + result.aircon + result.electrical + result.mechanical;
        
        let discount = 0;
        if (Number(costing.discount) > 0) {
            discount = costing.discountType === "percentage" 
                ? (originalSubtotal * Number(costing.discount)) / 100 
                : Number(costing.discount);
        }

        let vat = 0;
        if (costing.vatEnabled) {
            vat = Number(costing.vatAmount) || ((originalSubtotal - discount) * 0.12);
        }

        result.total = originalSubtotal - discount + vat;
        return result
    }

    const yearlyChartData = useMemo(() => {
        if (reportPeriod !== "yearly") return []
        const data = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(2000, i).toLocaleDateString("en-US", { month: "short" }),
            monthNum: i + 1,
            total: 0
        }))
        tableRecords.forEach(r => {
            const dateStr = r.createdAt || r.original_created_at || r.created_at
            const d = new Date(dateStr)
            const m = d.getMonth()
            const costs = getCategorizedCosts(r.costing)
            data[m].total += costs.total
        })
        return data
    }, [tableRecords, reportPeriod])

    const totalYearlySales = useMemo(() => {
        return tableRecords.reduce((sum, r) => {
            const costs = getCategorizedCosts(r.costing)
            return sum + costs.total
        }, 0)
    }, [tableRecords])

    const handlePrint = async () => {
        // Reuse the same generator but we can customize the title if we want
        const htmlContent = generateReleaseMonitoringDoc(tableRecords, reportPeriodLabel, getCategorizedCosts, "SALES MONITORING", "DATE ENTRY")

        const printWindow = window.open("", "_blank")
        if (!printWindow) {
            alert("Please allow popups for this site to view the report.")
            return
        }

        printWindow.document.write(htmlContent)
        printWindow.document.close()

        setTimeout(() => {
            printWindow.focus()
            printWindow.print()
        }, 800)
    }

    const handleDeleteRecord = async (id: string, name: string) => {
        // In Sales Monitoring, "Delete" might mean un-syncing if it's active, 
        // or removing from history. For now, let's keep it simple and handle history cases.
        if (id.length > 36) { // Likely a client-side ID or composite
             toast({ title: "Note", description: "Currently only history records can be permanently deleted from here." })
             return
        }

        if (!window.confirm(`Are you sure you want to PERMANENTLY remove "${name}" from the history/report?`)) {
            return
        }

        setIsSaving(true)
        try {
            const response = await fetch("/api/history?permanent=true", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            })

            if (response.ok) {
                toast({ title: "Removed", description: "Record has been permanently deleted." })
                onUpdate?.()
            } else {
                throw new Error("Delete failed")
            }
        } catch (e) {
            toast({ title: "Error", description: "Could not remove record.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-4 bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Sales Monitoring</h3>
                    <p className="text-sm text-muted-foreground">{reportPeriod === "monthly" ? "Monthly" : "Yearly"} entry logs and potential revenue</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search unit, plate, owner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-[220px] bg-background"
                            disabled={isEditing || isSaving}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <Select value={reportPeriod} onValueChange={(v: any) => setReportPeriod(v)} disabled={isEditing || isSaving}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>

                        {reportPeriod === "monthly" ? (
                            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isEditing || isSaving}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMonths.length > 0 ? (
                                        availableMonths.map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value={currentMonthKey}>{reportPeriodLabel}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isEditing || isSaving}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.length > 0 ? (
                                        availableYears.map(year => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value={currentYear}>{currentYear}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {!isEditing ? (
                        <>
                            <Button onClick={() => { setEditedData({}); setIsEditing(true); }} variant="outline" className="gap-2 shrink-0">
                                <Edit className="w-4 h-4" />
                                Edit Data
                            </Button>
                            <Button onClick={handlePrint} className="gap-2 shrink-0">
                                <Printer className="w-4 h-4" />
                                Print / Download PDF
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={() => { setIsEditing(false); setEditedData({}); }} disabled={isSaving} variant="outline" className="gap-2 shrink-0">
                                <X className="w-4 h-4" />
                                Cancel
                            </Button>
                            <Button onClick={async () => {
                                setIsSaving(true)
                                try {
                                    for (const [id, updates] of Object.entries(editedData)) {
                                        // Update logic depends on if it's history or active
                                        const endpoint = id.includes("-") && id.length > 30 ? "/api/appointments" : "/api/history"
                                        
                                        await fetch(endpoint, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(endpoint === "/api/appointments" ? { id, ...updates } : { id, updates })
                                        })
                                    }
                                    toast({ title: "Saved successfully", description: "The records have been updated." })
                                    setIsEditing(false)
                                    setEditedData({})
                                    onUpdate?.()
                                } catch (error) {
                                    toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" })
                                } finally {
                                    setIsSaving(false)
                                }
                            }} disabled={isSaving} className="gap-2 shrink-0">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </Button>
                        </>
                    )}

                    <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-dashed border-primary text-primary hover:bg-primary/10">
                                <PlusCircle className="w-4 h-4" />
                                Manual Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add Manual Entry</DialogTitle>
                                <DialogDescription>
                                    Add a unit entry directly to the Sales Monitoring sheet.
                                </DialogDescription>
                            </DialogHeader>
                            {/* Reuse the same manual entry form from ReleaseMonitoring but focused on entry date */}
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="s_name" className="text-right">Owner</Label>
                                    <Input id="s_name" value={manualEntry.name} onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="s_plate" className="text-right">Plate</Label>
                                    <Input id="s_plate" value={manualEntry.vehicle_plate} onChange={(e) => setManualEntry({ ...manualEntry, vehicle_plate: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="s_unit" className="text-right">Unit</Label>
                                    <div className="col-span-3 flex gap-2">
                                        <Input className="w-20" placeholder="Year" value={manualEntry.vehicle_year} onChange={(e) => setManualEntry({ ...manualEntry, vehicle_year: e.target.value })} />
                                        <Input placeholder="Make" value={manualEntry.vehicle_make} onChange={(e) => setManualEntry({ ...manualEntry, vehicle_make: e.target.value })} />
                                        <Input placeholder="Model" value={manualEntry.vehicle_model} onChange={(e) => setManualEntry({ ...manualEntry, vehicle_model: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="s_insurance" className="text-right">Claim</Label>
                                    <Input id="s_insurance" value={manualEntry.insurance} onChange={(e) => setManualEntry({ ...manualEntry, insurance: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="s_date" className="text-right">Entry Date</Label>
                                    <Input id="s_date" type="date" value={manualEntry.created_at} onChange={(e) => setManualEntry({ ...manualEntry, created_at: e.target.value })} className="col-span-3" />
                                </div>
                                {/* Breakdown section same as ReleaseMonitoring */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Breakdown</Label>
                                    <div className="col-span-3 grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">BRPAD</Label>
                                            <Input type="number" value={manualEntry.brpad || 0} onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setManualEntry({ ...manualEntry, brpad: val, total_amount: val + (manualEntry.aircon || 0) + (manualEntry.electrical || 0) + (manualEntry.mechanical || 0) });
                                            }} className="h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Aircon</Label>
                                            <Input type="number" value={manualEntry.aircon || 0} onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setManualEntry({ ...manualEntry, aircon: val, total_amount: (manualEntry.brpad || 0) + val + (manualEntry.electrical || 0) + (manualEntry.mechanical || 0) });
                                            }} className="h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Electrical</Label>
                                            <Input type="number" value={manualEntry.electrical || 0} onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setManualEntry({ ...manualEntry, electrical: val, total_amount: (manualEntry.brpad || 0) + (manualEntry.aircon || 0) + val + (manualEntry.mechanical || 0) });
                                            }} className="h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Mechanical</Label>
                                            <Input type="number" value={manualEntry.mechanical || 0} onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setManualEntry({ ...manualEntry, mechanical: val, total_amount: (manualEntry.brpad || 0) + (manualEntry.aircon || 0) + (manualEntry.electrical || 0) + val });
                                            }} className="h-8" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4 pt-2 border-t mt-2">
                                    <Label className="text-right font-bold">TOTAL</Label>
                                    <div className="col-span-3 text-lg font-bold text-primary">₱{manualEntry.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={async () => {
                                    setIsSaving(true)
                                    try {
                                        const response = await fetch("/api/history", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                manualData: {
                                                    ...manualEntry,
                                                    original_created_at: new Date(manualEntry.created_at).toISOString(),
                                                    costing: { 
                                                        total: manualEntry.total_amount, 
                                                        gatepass_breakdown: { 
                                                            brpad: manualEntry.brpad || 0, 
                                                            aircon: manualEntry.aircon || 0, 
                                                            electrical: manualEntry.electrical || 0, 
                                                            mechanical: manualEntry.mechanical || 0, 
                                                            total: manualEntry.total_amount 
                                                        } 
                                                    }
                                                }
                                            })
                                        })
                                        if (response.ok) {
                                            toast({ title: "Success", description: "Manual entry added." })
                                            setIsManualModalOpen(false)
                                            onUpdate?.()
                                        }
                                    } catch (e) {
                                        toast({ title: "Error", description: "Could not add record." })
                                    } finally {
                                        setIsSaving(false)
                                    }
                                }} disabled={isSaving || !manualEntry.name}>
                                    Add Entry
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Charts section similar to ReleaseMonitoring but for Entry Data */}
            {reportPeriod === "yearly" && tableRecords.length > 0 && (
                <div className="p-6 bg-muted/5 border-b border-border">
                    {/* ... (Same chart logic as ReleaseMonitoring) ... */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                         <div className="w-full md:w-1/3 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Entry Performance</span>
                            </div>
                            <h4 className="text-sm text-muted-foreground">Est. Total Entry for {selectedYear}</h4>
                            <p className="text-4xl font-black text-primary mt-2">
                                ₱{totalYearlySales.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="w-full md:w-2/3 h-[200px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearlyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]} className="fill-primary" />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse text-xs">
                    <thead>
                        <tr>
                            <th colSpan={10} className="text-left pb-4 border-none">
                                <h1 className="text-red-700 m-0 text-3xl font-bold font-serif tracking-widest" style={{ textShadow: "1px 1px 0 #fff, 2px 2px 0 #ccc" }}>
                                    SALES MONITORING
                                </h1>
                                <div className="flex gap-10 items-baseline mt-2 mb-2">
                                    <div className="font-bold text-lg text-foreground uppercase">Unit Entry</div>
                                    <div className="font-normal text-sm text-foreground ml-5">As of: {reportPeriodLabel}</div>
                                </div>
                            </th>
                            <th colSpan={6} className="text-right pb-4 border-none align-bottom">
                                <div className="flex items-center justify-end gap-3 mb-2">
                                     <Input placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 h-10" />
                                </div>
                            </th>
                        </tr>
                        <tr className="bg-[#FFD966] text-black border-y border-border">
                            <th className="p-2 border border-border text-center font-bold text-[10px] w-10">NO.</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">UNIT</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">PLATE</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">COLOR</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">OWNER</th>
                            <th className="p-2 border border-border text-center font-bold text-[8px] leading-tight w-20 uppercase">Claim Type</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">JO/ ES/ PO #</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">BRPAD</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">AIRCON</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">ELECTRICAL</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">MECHANICAL</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">TOTAL<br/><span className="text-[7px] font-normal leading-tight opacity-80">(w/ VAT/DISCOUNT)</span></th>
                            <th className="p-2 border border-border text-center font-bold text-[10px] w-12">MOD</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">DATE ENTERED</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px] w-32">REMARKS</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px] w-16 no-print">STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableRecords.length > 0 ? (
                            tableRecords.map((r, idx) => {
                                const unitStr = `${r.vehicle_year || r.vehicleYear || ""} ${r.vehicle_make || r.vehicleMake || ""} ${r.vehicle_model || r.vehicleModel || ""}`.trim()
                                const dateStr = (r.createdAt || r.original_created_at || r.created_at) ? new Date(r.createdAt || r.original_created_at || r.created_at).toLocaleDateString("en-US") : ""
                                const costs = getCategorizedCosts(r.costing)
                                const currentVal = (field: string) => editedData[r.id]?.[field] !== undefined ? editedData[r.id][field] : (r[field] || "")

                                return (
                                    <tr key={r.id} className={`border-b border-border ${isEditing ? 'bg-muted/30' : 'hover:bg-muted/10'}`}>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? (
                                                <button onClick={() => handleDeleteRecord(r.id, r.name)} className="text-red-500"><Trash2 className="w-3 h-3"/></button>
                                            ) : (idx + 1)}
                                        </td>
                                        <td className="p-2 border border-border">{unitStr}</td>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? <Input className="h-6 text-[10px]" value={currentVal("vehicle_plate")} onChange={(e) => setEditedData(prev => ({...prev, [r.id]: {...(prev[r.id]||{}), vehicle_plate: e.target.value}}))} /> : (r.vehicle_plate || r.vehiclePlate)}
                                        </td>
                                        <td className="p-2 border border-border text-center">{r.vehicle_color || r.vehicleColor}</td>
                                        <td className="p-2 border border-border">{r.name}</td>
                                        <td className="p-2 border border-border text-center uppercase text-[9px]">{r.insurance}</td>
                                        <td className="p-2 border border-border text-center">{r.estimate_number || r.estimateNumber || r.trackingCode || ""}</td>
                                        <td className="p-2 border border-border text-right font-mono">{costs.brpad > 0 ? costs.brpad.toLocaleString() : "-"}</td>
                                        <td className="p-2 border border-border text-right font-mono">{costs.aircon > 0 ? costs.aircon.toLocaleString() : "-"}</td>
                                        <td className="p-2 border border-border text-right font-mono">{costs.electrical > 0 ? costs.electrical.toLocaleString() : "-"}</td>
                                        <td className="p-2 border border-border text-right font-mono">{costs.mechanical > 0 ? costs.mechanical.toLocaleString() : "-"}</td>
                                        <td className="p-2 border border-border text-right font-mono font-bold">{costs.total > 0 ? costs.total.toLocaleString() : "-"}</td>
                                        <td className="p-2 border border-border text-center">{r.current_repair_part || r.currentRepairPart || ""}</td>
                                        <td className="p-2 border border-border text-center">{dateStr}</td>
                                        <td className="p-2 border border-border">{r.paul_notes || r.paulNotes || r.remarks}</td>
                                        <td className="p-2 border border-border text-center no-print">
                                            <Badge variant={r.source === 'history' || r.completed_at ? "outline" : "default"} className="text-[8px] px-1 h-4">
                                                {r.source === 'history' || r.completed_at ? "RELEASED" : "IN-PROGRESS"}
                                            </Badge>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr><td colSpan={16} className="p-8 text-center text-muted-foreground">No entry logs found for this period.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
