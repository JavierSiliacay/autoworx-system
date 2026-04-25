"use client"

import React, { useState, useMemo } from "react"
import { Printer, Calendar as CalendarIcon, FileDown, Eye, Edit, Save, Loader2, X, FileCheck, FileX, Trash2, RefreshCw, BarChart3, TrendingUp, Search } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateReleaseMonitoringDoc } from "@/lib/generate-pdf"
import { useToast } from "@/components/ui/use-toast"
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
import { isAuthorizedForReport } from "@/lib/auth"

export function ReleaseMonitoring({ records, onUpdate }: { records: any[], onUpdate?: () => void }) {
    const { data: session } = useSession()

    if (!isAuthorizedForReport(session?.user?.email)) {
        return (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
                <X className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-bold">Unauthorized</h3>
                <p>You are not authorized to view this confidential report.</p>
            </div>
        )
    }

    // Extract unique months and years from completed_at / created_at date strings
    const monthsMap = new Map<string, string>()
    const yearsSet = new Set<string>()

    records.forEach(r => {
        const dateStr = r.completed_at || r.original_created_at
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

    // Default to the latest year or current year if no data
    const currentYear = new Date().getFullYear().toString()
    const [selectedYear, setSelectedYear] = useState<string>(
        availableYears.length > 0 ? availableYears[0] : currentYear
    )

    // Sync selectedMonth and selectedYear when data loads
    React.useEffect(() => {
        if (availableMonths.length > 0 && !monthsMap.has(selectedMonth)) {
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
        completed_at: new Date().toISOString().split('T')[0],
        total_amount: 0,
        brpad: 0,
        aircon: 0,
        electrical: 0,
        mechanical: 0,
        remarks: ""
    })
    const { toast } = useToast()

    const normalizeString = (str: string) => {
        if (!str) return ""
        return str.toLowerCase().replace(/[\s\-\.\/\,]/g, "")
    }

    // Filter records by selected month, and EXCLUDE back-jobs as per admin requirement (they already paid for original)
    const tableRecords = useMemo(() => {
        return records.filter(r => {
            // Exclude back-jobs/re-entries from fiscal reports
            if (r.is_backjob) return false

            const dateStr = r.completed_at || r.original_created_at
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

            // Comprehensive Search filter (Normalized)
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

            // Claim Type filter (Dropdown)
            if (claimTypeFilter !== "all") {
                const insurance = (r.insurance || "").toLowerCase()
                const isPersonal = insurance.includes("personal") || insurance.includes("cash") || !insurance
                if (claimTypeFilter === "insurance" && isPersonal) return false
                if (claimTypeFilter === "personal" && !isPersonal) return false
            }

            return true
        }).sort((a, b) => {
            const da = new Date(a.completed_at || a.original_created_at).getTime()
            const db = new Date(b.completed_at || b.original_created_at).getTime()
            return da - db // Ascending order
        })
    }, [records, selectedMonth, selectedYear, reportPeriod, searchQuery, claimTypeFilter])

    // Get display text for the period
    const reportPeriodLabel = reportPeriod === "monthly"
        ? (monthsMap.get(selectedMonth) || new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }))
        : `Full Year ${selectedYear}`

    const getCategorizedCosts = (costing: any) => {
        let result = { brpad: 0, aircon: 0, electrical: 0, mechanical: 0, total: 0 }
        if (!costing) return result

        // Priority 1: Use Gatepass Override if Sir Paul entered specific values in the Gatepass modal
        if (costing.gatepass_breakdown) {
            const gb = costing.gatepass_breakdown;
            return {
                brpad: Number(gb.brpad) || 0,
                aircon: Number(gb.aircon) || 0,
                electrical: Number(gb.electrical) || 0,
                mechanical: Number(gb.mechanical) || 0,
                total: Number(gb.total) || costing.total || 0
            }
        }

        // Priority 2: Use dynamic categorization if no manual Gatepass override exists
        if (costing.items) {
            costing.items.forEach((item: any) => {
                const cat = item.category || ""
                if (cat === "Aircon") result.aircon += item.total || 0
                else if (cat === "Electrical") result.electrical += item.total || 0
                else if (cat === "Mechanical Works") result.mechanical += item.total || 0
                else result.brpad += item.total || 0
            })
        }

        result.total = costing.total || 0
        return result
    }

    // Calculate chart data for Yearly View
    const yearlyChartData = useMemo(() => {
        if (reportPeriod !== "yearly") return []

        const data = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(2000, i).toLocaleDateString("en-US", { month: "short" }),
            monthNum: i + 1,
            total: 0
        }))

        tableRecords.forEach(r => {
            const dateStr = r.completed_at || r.original_created_at
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
        const htmlContent = generateReleaseMonitoringDoc(tableRecords, reportPeriodLabel, getCategorizedCosts)

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
        if (!window.confirm(`Are you sure you want to PERMANENTLY remove "${name}" from the monitoring report? This cannot be undone.`)) {
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
            toast({ title: "Error", description: "Operation failed.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleBatchUpdate = async () => {
        const entryIds = Object.keys(editedData)
        if (entryIds.length === 0) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            const updates = entryIds.map(id => ({
                id,
                ...editedData[id]
            }))

            const response = await fetch("/api/history", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates })
            })

            if (response.ok) {
                toast({ title: "Success", description: "Records updated successfully." })
                setIsEditing(false)
                setEditedData({})
                onUpdate?.()
            } else {
                throw new Error("Update failed")
            }
        } catch (e) {
            toast({ title: "Error", description: "Could not save changes.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const isSales = false;
    return (
        <div className="space-y-4 bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Release Monitoring</h3>
                    <p className="text-sm text-muted-foreground">{reportPeriod === "monthly" ? "Monthly" : "Yearly"} release logs and repair costs</p>
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
                            <Button onClick={handleBatchUpdate} disabled={isSaving} className="gap-2 shrink-0">
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
                                    Add a unit entry directly to the Release Monitoring sheet.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="m_name" className="text-right">Owner</Label>
                                    <Input id="m_name" value={manualEntry.name} onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="m_plate" className="text-right">Plate</Label>
                                    <Input id="m_plate" value={manualEntry.vehicle_plate} onChange={(e) => setManualEntry({ ...manualEntry, vehicle_plate: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="m_unit" className="text-right">Unit</Label>
                                    <div className="col-span-3 flex gap-2">
                                        <Input className="w-20" placeholder="Year" value={manualEntry.vehicle_year} onChange={(e) => setManualEntry({ ...manualEntry, vehicle_year: e.target.value })} />
                                        <Input placeholder="Make" value={manualEntry.vehicle_make} onChange={(e) => setManualEntry({ ...manualEntry, vehicle_make: e.target.value })} />
                                        <Input placeholder="Model" value={manualEntry.vehicle_model} onChange={(e) => setManualEntry({ ...manualEntry, vehicle_model: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="m_insurance" className="text-right">Claim</Label>
                                    <Input id="m_insurance" value={manualEntry.insurance} onChange={(e) => setManualEntry({ ...manualEntry, insurance: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="m_date" className="text-right">Release Date</Label>
                                    <Input id="m_date" type="date" value={manualEntry.completed_at} onChange={(e) => setManualEntry({ ...manualEntry, completed_at: e.target.value })} className="col-span-3" />
                                </div>
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
                                <div className="grid grid-cols-4 items-center gap-4 pt-2">
                                    <Label htmlFor="remarks" className="text-right">Remarks</Label>
                                    <Input id="remarks" value={manualEntry.remarks} onChange={(e) => setManualEntry({ ...manualEntry, remarks: e.target.value })} className="col-span-3" />
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
                                            toast({ title: "Success", description: "Manual record added." })
                                            setIsManualModalOpen(false)
                                            setManualEntry({
                                                name: "",
                                                vehicle_make: "",
                                                vehicle_model: "",
                                                vehicle_year: "",
                                                vehicle_plate: "",
                                                insurance: "Personal Claim",
                                                completed_at: new Date().toISOString().split('T')[0],
                                                total_amount: 0,
                                                brpad: 0,
                                                aircon: 0,
                                                electrical: 0,
                                                mechanical: 0,
                                                remarks: ""
                                            })
                                            onUpdate?.()
                                        } else {
                                            throw new Error("Failed to add record")
                                        }
                                    } catch (e) {
                                        toast({ title: "Error", description: "Could not add manual record.", variant: "destructive" })
                                    } finally {
                                        setIsSaving(false)
                                    }
                                }} disabled={isSaving || !manualEntry.name}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Add Record
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {reportPeriod === "yearly" && tableRecords.length > 0 && (
                <div className="p-6 bg-muted/5 border-b border-border">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-full md:w-1/3 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Annual Performance</span>
                            </div>
                            <h4 className="text-sm text-muted-foreground">Total Sales for {selectedYear}</h4>
                            <p className="text-4xl font-black text-primary mt-2">
                                ₱{totalYearlySales.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                            <div className="mt-4 pt-4 border-t border-primary/10 flex justify-between text-xs">
                                <div className="text-muted-foreground">Units Released: <span className="font-bold text-foreground">{tableRecords.length}</span></div>
                                <div className="text-muted-foreground">Avg. per Unit: <span className="font-bold text-foreground">₱{(totalYearlySales / tableRecords.length || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}</span></div>
                            </div>
                        </div>

                        <div className="w-full md:w-2/3 h-[200px] mt-4 md:mt-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearlyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fill: '#888' }} 
                                    />
                                    <YAxis 
                                        hide 
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-background border border-border p-2 rounded shadow-lg text-[10px]">
                                                        <p className="font-bold">{payload[0].payload.name}</p>
                                                        <p className="text-primary font-mono font-bold">₱{Number(payload[0].value).toLocaleString("en-PH")}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar 
                                        dataKey="total" 
                                        radius={[4, 4, 0, 0]} 
                                        className="fill-primary"
                                    >
                                        {yearlyChartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.total === Math.max(...yearlyChartData.map(d => d.total)) ? "var(--primary)" : "var(--primary)"} 
                                                fillOpacity={entry.total === 0 ? 0 : (0.4 + (entry.total / Math.max(...yearlyChartData.map(d => d.total)) * 0.6))} 
                                            />
                                        ))}
                                    </Bar>
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
                                    RELEASE MONITORING
                                </h1>
                                <div className="flex gap-10 items-baseline mt-2 mb-2">
                                    <div className="font-bold text-lg text-foreground">SALES</div>
                                    <div className="font-normal text-sm text-foreground ml-5">As of: {reportPeriodLabel}</div>
                                </div>
                            </th>
                            <th colSpan={6} className="text-right pb-4 border-none align-bottom">
                                <div className="flex items-center justify-end gap-3 mb-2">
                                    <div className="relative w-64 group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Eye className="h-4 w-4 text-muted-foreground group-focus-within:text-red-500 transition-colors" />
                                        </div>
                                        <Input
                                            placeholder="Search: Owner, Plate, Unit, JO#, Remarks..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-10 pl-10 bg-background/50 border-border focus:border-red-500/50 focus:ring-red-500/20 rounded-lg text-xs transition-all placeholder:text-[10px]"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <Select value={claimTypeFilter} onValueChange={setClaimTypeFilter}>
                                        <SelectTrigger className="w-[140px] h-10 border-border bg-background/50 focus:ring-red-500/20">
                                            <SelectValue placeholder="Claim Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Claims</SelectItem>
                                            <SelectItem value="insurance">Insurance</SelectItem>
                                            <SelectItem value="personal">Personal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </th>
                        </tr>
                        <tr className="bg-[#FFD966] text-black border-y border-border">
                            <th className="p-2 border border-border text-center font-bold text-[10px] w-10">NO.</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">UNIT</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">PLATE</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">COLOR</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">OWNER</th>
                            <th className="p-2 border border-border text-center font-bold text-[8px] leading-tight w-20">CLAIM TYPE<br />INSURANCE/PERSONAL</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">JO/ ES/ PO #</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">BRPAD</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">AIRCON</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">ELECTRICAL</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">MECHANICAL</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px]">TOTAL</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px] w-12">MOD</th>
                            {!isSales && <th className="p-2 border border-border text-center font-bold text-[10px]">DATE COMPLETE</th>}
                            <th className="p-2 border border-border text-center font-bold text-[10px]">DATE RELEASED</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px] w-32">REMARKS</th>
                            <th className="p-2 border border-border text-center font-bold text-[10px] w-16 no-print">DOCS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableRecords.length > 0 ? (
                            tableRecords.map((r, idx) => {
                                const claimType = r.insurance ? r.insurance.toUpperCase() : ""
                                const unitStr = `${r.vehicle_year || ""} ${r.vehicle_make || ""} ${r.vehicle_model || ""}`.trim()
                                const completeDateStr = (r.status_updated_at || r.statusUpdatedAt) 
                                    ? new Date(r.status_updated_at || r.statusUpdatedAt).toLocaleDateString("en-US") 
                                    : (r.completed_at ? new Date(r.completed_at).toLocaleDateString("en-US") : "-")
                                const releaseDateStr = r.completed_at || r.original_created_at ? new Date(r.completed_at || r.original_created_at).toLocaleDateString("en-US") : ""
                                const modVal = r.current_repair_part || ""
                                const costs = getCategorizedCosts(r.costing)

                                const currentVal = (field: string) => editedData[r.id]?.[field] !== undefined ? editedData[r.id][field] : (r[field] || "")

                                return (
                                    <tr key={r.id} className={`border-b border-border ${isEditing ? 'bg-muted/30' : 'hover:bg-muted/10'} text-foreground`}>
                                        <td className="p-2 border border-border text-center relative group/row">
                                            {isEditing ? (
                                                <button
                                                    onClick={() => handleDeleteRecord(r.id, r.name)}
                                                    className="p-1 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            ) : (idx + 1)}
                                        </td>
                                        <td className="p-2 border border-border text-left truncate max-w-[150px]" title={unitStr}>{unitStr}</td>
                                        <td className="p-2 border border-border text-center font-mono">
                                            {isEditing ? (
                                                <Input className="h-7 px-2 text-xs w-full min-w-[80px]" value={currentVal("vehicle_plate")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_plate: e.target.value } }))} />
                                            ) : (r.vehicle_plate)}
                                        </td>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? (
                                                <Input className="h-7 px-2 text-xs w-[60px]" value={currentVal("vehicle_color")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_color: e.target.value } }))} />
                                            ) : (r.vehicle_color || "")}
                                        </td>
                                        <td className="p-2 border border-border text-left truncate max-w-[150px]" title={r.name}>
                                            {isEditing ? (
                                                <Input className="h-7 px-2 text-xs w-full" value={currentVal("name")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), name: e.target.value } }))} />
                                            ) : (r.name)}
                                        </td>
                                        <td className="p-2 border border-border text-center text-[10px]">
                                            {isEditing ? (
                                                <Input className="h-7 px-2 text-[10px] w-full" value={currentVal("insurance")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), insurance: e.target.value } }))} />
                                            ) : (claimType)}
                                        </td>
                                        <td className="p-2 border border-border text-left">
                                            {isEditing ? (
                                                <Input className="h-7 px-2 text-xs w-full" value={currentVal("estimate_number")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), estimate_number: e.target.value } }))} />
                                            ) : (r.estimate_number || "")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono">
                                            {isEditing ? (
                                                <Input
                                                    className="h-7 px-2 text-xs text-right w-full min-w-[70px]"
                                                    type="number"
                                                    value={editedData[r.id]?.costing?.gatepass_breakdown?.brpad ?? costs.brpad}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value) || 0
                                                        const currentCosting = editedData[r.id]?.costing || r.costing || { items: [] }
                                                        const currentGB = currentCosting.gatepass_breakdown || getCategorizedCosts(currentCosting)
                                                        const newGB = { ...currentGB, brpad: val }
                                                        newGB.total = newGB.brpad + newGB.aircon + newGB.electrical + newGB.mechanical
                                                        setEditedData(prev => ({
                                                            ...prev,
                                                            [r.id]: { ...(prev[r.id] || {}), costing: { ...currentCosting, gatepass_breakdown: newGB, total: newGB.total } }
                                                        }))
                                                    }}
                                                />
                                            ) : (costs.brpad > 0 ? costs.brpad.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono">
                                            {isEditing ? (
                                                <Input
                                                    className="h-7 px-2 text-xs text-right w-full min-w-[70px]"
                                                    type="number"
                                                    value={editedData[r.id]?.costing?.gatepass_breakdown?.aircon ?? costs.aircon}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value) || 0
                                                        const currentCosting = editedData[r.id]?.costing || r.costing || { items: [] }
                                                        const currentGB = currentCosting.gatepass_breakdown || getCategorizedCosts(currentCosting)
                                                        const newGB = { ...currentGB, aircon: val }
                                                        newGB.total = newGB.brpad + newGB.aircon + newGB.electrical + newGB.mechanical
                                                        setEditedData(prev => ({
                                                            ...prev,
                                                            [r.id]: { ...(prev[r.id] || {}), costing: { ...currentCosting, gatepass_breakdown: newGB, total: newGB.total } }
                                                        }))
                                                    }}
                                                />
                                            ) : (costs.aircon > 0 ? costs.aircon.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono">
                                            {isEditing ? (
                                                <Input
                                                    className="h-7 px-2 text-xs text-right w-full min-w-[70px]"
                                                    type="number"
                                                    value={editedData[r.id]?.costing?.gatepass_breakdown?.electrical ?? costs.electrical}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value) || 0
                                                        const currentCosting = editedData[r.id]?.costing || r.costing || { items: [] }
                                                        const currentGB = currentCosting.gatepass_breakdown || getCategorizedCosts(currentCosting)
                                                        const newGB = { ...currentGB, electrical: val }
                                                        newGB.total = newGB.brpad + newGB.aircon + newGB.electrical + newGB.mechanical
                                                        setEditedData(prev => ({
                                                            ...prev,
                                                            [r.id]: { ...(prev[r.id] || {}), costing: { ...currentCosting, gatepass_breakdown: newGB, total: newGB.total } }
                                                        }))
                                                    }}
                                                />
                                            ) : (costs.electrical > 0 ? costs.electrical.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono">
                                            {isEditing ? (
                                                <Input
                                                    className="h-7 px-2 text-xs text-right w-full min-w-[70px]"
                                                    type="number"
                                                    value={editedData[r.id]?.costing?.gatepass_breakdown?.mechanical ?? costs.mechanical}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value) || 0
                                                        const currentCosting = editedData[r.id]?.costing || r.costing || { items: [] }
                                                        const currentGB = currentCosting.gatepass_breakdown || getCategorizedCosts(currentCosting)
                                                        const newGB = { ...currentGB, mechanical: val }
                                                        newGB.total = newGB.brpad + newGB.aircon + newGB.electrical + newGB.mechanical
                                                        setEditedData(prev => ({
                                                            ...prev,
                                                            [r.id]: { ...(prev[r.id] || {}), costing: { ...currentCosting, gatepass_breakdown: newGB, total: newGB.total } }
                                                        }))
                                                    }}
                                                />
                                            ) : (costs.mechanical > 0 ? costs.mechanical.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono font-bold text-red-600">
                                            {isEditing ? (
                                                (editedData[r.id]?.costing?.total ?? costs.total).toLocaleString("en-PH", { minimumFractionDigits: 2 })
                                            ) : (costs.total > 0 ? costs.total.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? (
                                                <Input className="h-7 px-2 text-[10px] w-full" value={currentVal("current_repair_part")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), current_repair_part: e.target.value } }))} />
                                            ) : (modVal)}
                                        </td>
                                        {!isSales && (
                                            <td className="p-2 border border-border text-center">
                                                {isEditing ? (
                                                    <Input
                                                        type="date"
                                                        className="h-7 px-2 text-[10px] w-full"
                                                        value={currentVal("status_updated_at") ? new Date(currentVal("status_updated_at")).toISOString().split('T')[0] : ""}
                                                        onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), status_updated_at: new Date(e.target.value).toISOString() } }))}
                                                    />
                                                ) : (completeDateStr)}
                                            </td>
                                        )}
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="date"
                                                    className="h-7 px-2 text-[10px] w-full"
                                                    value={currentVal("completed_at") ? new Date(currentVal("completed_at")).toISOString().split('T')[0] : ""}
                                                    onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), completed_at: new Date(e.target.value).toISOString() } }))}
                                                />
                                            ) : (releaseDateStr)}
                                        </td>
                                        <td className="p-2 border border-border text-left truncate max-w-[120px]" title={r.paul_notes || ""}>
                                            {isEditing ? (
                                                <Input className="h-7 px-2 text-xs w-full" value={currentVal("paul_notes")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), paul_notes: e.target.value } }))} />
                                            ) : (r.paul_notes || "")}
                                        </td>
                                        <td className="p-2 border border-border text-center no-print">
                                            {(() => {
                                                const loas = r.costing?.loaAttachments || []
                                                if (loas.length > 0) {
                                                    return (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => {
                                                                const url = loas[0] // Preview the first one
                                                                if (url.toLowerCase().endsWith('.pdf')) {
                                                                    window.open(url, '_blank')
                                                                } else {
                                                                    // We can't easily trigger the parent's modal without a prop
                                                                    // So we'll just open in a new tab for now
                                                                    window.open(url, '_blank')
                                                                }
                                                            }}
                                                            title={`View ${loas.length} document(s)`}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    )
                                                }
                                                return <span className="text-[8px] text-muted-foreground italic">No LOA</span>
                                            })()}
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={isSales ? 16 : 17} className="p-8 text-center text-muted-foreground italic border border-border">
                                    No completed units found for this {reportPeriod === "monthly" ? "month" : "year"}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {tableRecords.length > 0 && (
                        <tfoot>
                            <tr className="bg-muted/30 font-bold border border-border text-foreground">
                                <td colSpan={7} className="p-2 border border-border text-right">GRAND TOTAL</td>
                                <td className="p-2 border border-border text-right">
                                    {tableRecords.reduce((sum, r) => sum + getCategorizedCosts(r.costing).brpad, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2 border border-border text-right">
                                    {tableRecords.reduce((sum, r) => sum + getCategorizedCosts(r.costing).aircon, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2 border border-border text-right">
                                    {tableRecords.reduce((sum, r) => sum + getCategorizedCosts(r.costing).electrical, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2 border border-border text-right">
                                    {tableRecords.reduce((sum, r) => sum + getCategorizedCosts(r.costing).mechanical, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2 border border-border text-right font-bold">
                                    {tableRecords.reduce((sum, r) => sum + getCategorizedCosts(r.costing).total, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                </td>
                                <td colSpan={3} className="border border-border"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    )
}
