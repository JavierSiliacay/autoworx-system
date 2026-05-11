"use client"

import React, { useState, useMemo } from "react"
import { Printer, Calendar as CalendarIcon, FileDown, Eye, Edit, Save, Loader2, X, FileCheck, FileX, Trash2, RefreshCw, BarChart3, TrendingUp, Search } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell } from 'recharts'
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
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
import { isAuthorizedForSales } from "@/lib/auth"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Check } from "lucide-react"

const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
]

const formatWithCommas = (value: string | number) => {
    if (value === undefined || value === null || value === "") return "";
    const stringValue = value.toString().replace(/,/g, "");
    const parts = stringValue.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
};

const parseCommaNumber = (value: string) => {
    return value.replace(/,/g, "");
};

export function SalesMonitoring({ records, onUpdate }: { records: any[], onUpdate?: () => void }) {
    const { data: session } = useSession()
    const { toast } = useToast()

    if (!isAuthorizedForSales(session?.user?.email)) {
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
        const dateStr = r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at
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

    const [reportPeriod, setReportPeriod] = useState<"monthly" | "yearly" | "all">("monthly")

    // Default to the latest month or current month if no data
    const currentYear = new Date().getFullYear().toString()
    const currentMonthKey = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    
    const [selectedYear, setSelectedYear] = useState<string>(
        availableYears.length > 0 ? availableYears[0] : currentYear
    )
    
    const [selectedMonth, setSelectedMonth] = useState<string>(
        availableMonths.length > 0 ? availableMonths[0][0] : currentMonthKey
    )

    React.useEffect(() => {
        // Only set initial selection if none exists
        if (availableMonths.length > 0 && !selectedMonth) {
            setSelectedMonth(availableMonths[0][0])
            setSelectedYear(availableMonths[0][0].split('-')[0])
        }
    }, [availableMonths, selectedMonth])

    React.useEffect(() => {
        if (availableYears.length > 0 && selectedYear !== "all" && !yearsSet.has(selectedYear) && !selectedYear) {
            setSelectedYear(availableYears[0])
        }
    }, [availableYears, selectedYear, yearsSet])

    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editedData, setEditedData] = useState<Record<string, any>>({})
    const [searchQuery, setSearchQuery] = useState("")
    const [claimTypeFilter, setClaimTypeFilter] = useState("all")
    const [isManualModalOpen, setIsManualModalOpen] = useState(false)
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
    const [printFilter, setPrintFilter] = useState<"all" | "in-progress" | "released">("all")
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


            const dateStr = r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at
            if (!dateStr) return false
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return false

            if (reportPeriod === "monthly") {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                if (key !== selectedMonth) return false
            } else if (reportPeriod === "yearly") {
                const year = d.getFullYear().toString()
                if (selectedYear !== "all" && year !== selectedYear) return false
            }

            if (searchQuery.trim()) {
                const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
                const isRecordMatch = tokens.every(token => {
                    const normToken = normalizeString(token)
                    return [
                        r.name,
                        r.insurance,
                        r.vehicle_plate || r.vehiclePlate,
                        r.vehicle_color || r.vehicleColor,
                        r.vehicle_make || r.vehicleMake,
                        r.vehicle_model || r.vehicleModel,
                        r.vehicle_year?.toString() || r.vehicleYear?.toString(),
                        r.estimate_number || r.estimateNumber,
                        r.paul_notes || r.paulNotes,
                        r.current_repair_part || r.currentRepairPart,
                        r.trackingCode || r.tracking_code
                    ].some(field => normalizeString(field || "").includes(normToken))
                })
                if (!isRecordMatch) return false
            }

            if (claimTypeFilter !== "all") {
                const insurance = (r.insurance || "").toLowerCase()
                const isPersonal = insurance.includes("personal") || insurance.includes("cash") || !insurance
                if (claimTypeFilter === "insurance" && isPersonal) return false
                if (claimTypeFilter === "personal" && !isPersonal) return false
            }

            return true
        }).sort((a, b) => {
            const daStr = a.syncedAt || a.synced_at || a.createdAt || a.original_created_at || a.created_at
            const dbStr = b.syncedAt || b.synced_at || b.createdAt || b.original_created_at || b.created_at
            const da = new Date(daStr || 0).getTime()
            const db = new Date(dbStr || 0).getTime()
            return da - db
        })
    }, [records, selectedMonth, selectedYear, reportPeriod, searchQuery, claimTypeFilter])

    const reportPeriodLabel = reportPeriod === "monthly"
        ? (monthsMap.get(selectedMonth) || new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }))
        : (reportPeriod === "all" || selectedYear === "all" ? "All Years" : `Full Year ${selectedYear}`)

    const getCategorizedCosts = (r: any) => {
        const costing = r.costing
        let result = { brpad: 0, aircon: 0, electrical: 0, mechanical: 0, total: 0 }
        
        // Use edited data if available
        const edited = editedData[r.id] || {}
        
        if (!costing && !edited.brpad && !edited.aircon && !edited.electrical && !edited.mechanical) return result

        // If we are editing costs directly, prioritze those
        if (edited.brpad !== undefined || edited.aircon !== undefined || edited.electrical !== undefined || edited.mechanical !== undefined || edited.total !== undefined) {
            result.brpad = Number(edited.brpad ?? (costing?.gatepass_breakdown?.brpad ?? 0))
            result.aircon = Number(edited.aircon ?? (costing?.gatepass_breakdown?.aircon ?? 0))
            result.electrical = Number(edited.electrical ?? (costing?.gatepass_breakdown?.electrical ?? 0))
            result.mechanical = Number(edited.mechanical ?? (costing?.gatepass_breakdown?.mechanical ?? 0))
            
            const subtotal = result.brpad + result.aircon + result.electrical + result.mechanical
            let discount = 0;
            if (Number(costing?.discount) > 0) {
                discount = costing.discountType === "percentage"
                    ? (subtotal * Number(costing.discount)) / 100
                    : Number(costing.discount);
            }
            let vat = 0;
            if (costing?.vatEnabled) {
                vat = Number(costing.vatAmount) || ((subtotal - discount) * 0.12);
            }
            result.total = edited.total !== undefined ? Number(edited.total) : (subtotal - discount + vat);
            return result
        }

        // Sales Monitoring only: exclusively sum up the original Repair Estimate items
        // and intentionally ignore any Gatepass breakdown to reflect true projected sales
        if (costing?.items && costing.items.length > 0) {
            costing.items.forEach((item: any) => {
                const cat = item.category || ""
                if (cat === "Aircon") result.aircon += item.total || 0
                else if (cat === "Electrical") result.electrical += item.total || 0
                else if (cat === "Mechanical Works") result.mechanical += item.total || 0
                else result.brpad += item.total || 0
            })

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

        // MANUAL ENTRY FALLBACK: If items produced no numbers
        if (costing?.gatepass_breakdown) {
            const gb = costing.gatepass_breakdown
            return {
                brpad: Number(gb.brpad) || 0,
                aircon: Number(gb.aircon) || 0,
                electrical: Number(gb.electrical) || 0,
                mechanical: Number(gb.mechanical) || 0,
                total: Number(gb.total) || Number(costing.total) || 0
            }
        }

        return result
    }

    const yearlyChartData = useMemo(() => {
        if (reportPeriod === "monthly") return []

        if (reportPeriod === "all" || selectedYear === "all") {
            const dataMap = new Map<string, number>()
            availableYears.forEach(y => dataMap.set(y, 0))

            tableRecords.forEach(r => {
                const dateStr = r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at
                if (!dateStr) return
                const d = new Date(dateStr)
                const year = d.getFullYear().toString()
                const costs = getCategorizedCosts(r)
                dataMap.set(year, (dataMap.get(year) || 0) + costs.total)
            })

            return Array.from(dataMap.entries())
                .map(([name, total]) => ({ name, total }))
                .sort((a, b) => a.name.localeCompare(b.name))
        } else {
            const data = Array.from({ length: 12 }, (_, i) => ({
                name: new Date(2000, i).toLocaleDateString("en-US", { month: "short" }),
                monthNum: i + 1,
                total: 0
            }))
            tableRecords.forEach(r => {
                const dateStr = r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at
                if (!dateStr) return
                const d = new Date(dateStr)
                const m = d.getMonth()
                const costs = getCategorizedCosts(r)
                data[m].total += costs.total
            })
            return data
        }
    }, [tableRecords, reportPeriod, selectedYear, availableYears])

    const tableTotals = useMemo(() => {
        return tableRecords.reduce((acc, r) => {
            const costs = getCategorizedCosts(r)
            return {
                brpad: acc.brpad + costs.brpad,
                aircon: acc.aircon + costs.aircon,
                electrical: acc.electrical + costs.electrical,
                mechanical: acc.mechanical + costs.mechanical,
                total: acc.total + costs.total
            }
        }, { brpad: 0, aircon: 0, electrical: 0, mechanical: 0, total: 0 })
    }, [tableRecords, editedData])

    const handlePrint = () => {
        setIsPrintModalOpen(true)
    }

    const executePrint = async () => {
        let filteredRecords = [...tableRecords]
        if (printFilter === "in-progress") {
            filteredRecords = tableRecords.filter(r => !(r.source === 'history' || r.completed_at || r.isArchived))
        } else if (printFilter === "released") {
            filteredRecords = tableRecords.filter(r => (r.source === 'history' || r.completed_at || r.isArchived))
        }

        if (filteredRecords.length === 0) {
            toast({ title: "No data", description: `No ${printFilter} records found for this period.`, variant: "destructive" })
            return
        }

        // Reuse the same generator but we can customize the title if we want
        const htmlContent = generateReleaseMonitoringDoc(filteredRecords, reportPeriodLabel, (costing: any, recordId?: string) => {
            const record = filteredRecords.find(r => String(r.id) === String(recordId)) || { costing };
            return getCategorizedCosts(record);
        }, "SALES MONITORING", "DATE ENTRY")

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
        
        setIsPrintModalOpen(false)
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
                                <SelectItem value="all">All Years</SelectItem>
                            </SelectContent>
                        </Select>

                        {reportPeriod === "monthly" ? (
                            <div className="flex items-center gap-2">
                                <Select value={selectedYear} onValueChange={(y) => {
                                    setSelectedYear(y);
                                    const monthPart = selectedMonth.split('-')[1] || "01";
                                    setSelectedMonth(`${y}-${monthPart}`);
                                }} disabled={isEditing || isSaving}>
                                    <SelectTrigger className="w-[90px]">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map(year => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select 
                                    value={selectedMonth.split('-')[1] || "01"} 
                                    onValueChange={(m) => setSelectedMonth(`${selectedYear}-${m}`)} 
                                    disabled={isEditing || isSaving}
                                >
                                    <SelectTrigger className="w-[130px]">
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map(m => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : reportPeriod === "yearly" ? (
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
                        ) : null}
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
                                    for (const [id, rawUpdates] of Object.entries(editedData)) {
                                        const record = records.find(r => String(r.id) === String(id))
                                        if (!record) continue

                                        const isHistory = record.archived_at || record.source === 'history' || record.completed_at;
                                        const endpoint = isHistory ? "/api/history" : "/api/appointments";

                                        const updates: any = { ...rawUpdates }

                                        // Handle nested costing updates
                                        if (updates.brpad !== undefined || updates.aircon !== undefined || updates.electrical !== undefined || updates.mechanical !== undefined || updates.total !== undefined) {
                                            const currentCosts = getCategorizedCosts(record)
                                            const newGb = {
                                                brpad: updates.brpad !== undefined ? Number(updates.brpad) : currentCosts.brpad,
                                                aircon: updates.aircon !== undefined ? Number(updates.aircon) : currentCosts.aircon,
                                                electrical: updates.electrical !== undefined ? Number(updates.electrical) : currentCosts.electrical,
                                                mechanical: updates.mechanical !== undefined ? Number(updates.mechanical) : currentCosts.mechanical,
                                            }
                                            
                                            const calculatedSubtotal = newGb.brpad + newGb.aircon + newGb.electrical + newGb.mechanical
                                            
                                            // Maintain VAT and discount from original costing if possible
                                            const oldCosting = record.costing || {}
                                            let discount = 0;
                                            if (Number(oldCosting.discount) > 0) {
                                                discount = oldCosting.discountType === "percentage"
                                                    ? (calculatedSubtotal * Number(oldCosting.discount)) / 100
                                                    : Number(oldCosting.discount);
                                            }
                                            let vat = 0;
                                            if (oldCosting.vatEnabled) {
                                                vat = Number(oldCosting.vatAmount) || ((calculatedSubtotal - discount) * 0.12);
                                            }

                                            // If total was manually overridden, use that. Otherwise use calculated.
                                            const finalTotal = updates.total !== undefined ? Number(updates.total) : (calculatedSubtotal - discount + vat)

                                            updates.costing = {
                                                ...oldCosting,
                                                total: finalTotal,
                                                gatepass_breakdown: {
                                                    ...newGb,
                                                    total: finalTotal
                                                }
                                            }
                                            
                                            // Clean up individual cost fields from updates as they are now in updates.costing
                                            delete updates.brpad
                                            delete updates.aircon
                                            delete updates.electrical
                                            delete updates.mechanical
                                            delete updates.total
                                        }

                                        // Map camelCase to snake_case if needed (though API should handle some)
                                        if (updates.vehicleMake !== undefined) { updates.vehicle_make = updates.vehicleMake; delete updates.vehicleMake; }
                                        if (updates.vehicleModel !== undefined) { updates.vehicle_model = updates.vehicleModel; delete updates.vehicleModel; }
                                        if (updates.vehicleYear !== undefined) { updates.vehicle_year = updates.vehicleYear; delete updates.vehicleYear; }
                                        if (updates.vehiclePlate !== undefined) { updates.vehicle_plate = updates.vehiclePlate; delete updates.vehiclePlate; }
                                        if (updates.vehicleColor !== undefined) { updates.vehicle_color = updates.vehicleColor; delete updates.vehicleColor; }
                                        if (updates.paulNotes !== undefined) { updates.paul_notes = updates.paulNotes; delete updates.paulNotes; }

                                        const res = await fetch(endpoint, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(endpoint === "/api/appointments" ? { id, ...updates } : { id, updates })
                                        })

                                        if (!res.ok) {
                                            const errText = await res.text();
                                            console.error(`[SalesMonitoring] Update failed for ${id}:`, errText);
                                            throw new Error(`Failed to update ${record.name || id}`);
                                        }
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
                                    <div className="col-span-3">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal h-10",
                                                        !manualEntry.created_at && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {manualEntry.created_at ? (
                                                        format(new Date(manualEntry.created_at), "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    captionLayout="dropdown"
                                                    fromYear={2000}
                                                    toYear={new Date().getFullYear() + 5}
                                                    selected={manualEntry.created_at ? new Date(manualEntry.created_at) : undefined}
                                                    onSelect={(date) => setManualEntry({ ...manualEntry, created_at: date ? format(date, "yyyy-MM-dd") : "" })}
                                                    initialFocus
                                                    footer={
                                                        <div className="flex items-center justify-between gap-2 p-3 border-t bg-muted/10">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="text-[10px] h-7 px-2 font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                                                                onClick={() => setManualEntry({ ...manualEntry, created_at: format(new Date(), "yyyy-MM-dd") })}
                                                            >
                                                                TODAY
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="text-[10px] h-7 px-2 font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                                                                onClick={() => {
                                                                    const yesterday = new Date();
                                                                    yesterday.setDate(yesterday.getDate() - 1);
                                                                    setManualEntry({ ...manualEntry, created_at: format(yesterday, "yyyy-MM-dd") });
                                                                }}
                                                            >
                                                                YESTERDAY
                                                            </Button>
                                                        </div>
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                {/* Breakdown section same as ReleaseMonitoring */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Breakdown</Label>
                                    <div className="col-span-3 grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">BRPAD</Label>
                                            <Input type="text" value={formatWithCommas(manualEntry.brpad)} onChange={(e) => {
                                                const rawValue = parseCommaNumber(e.target.value);
                                                if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                    const val = parseFloat(rawValue) || 0;
                                                    setManualEntry({ ...manualEntry, brpad: val, total_amount: val + (manualEntry.aircon || 0) + (manualEntry.electrical || 0) + (manualEntry.mechanical || 0) });
                                                }
                                            }} className="h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Aircon</Label>
                                            <Input type="text" value={formatWithCommas(manualEntry.aircon)} onChange={(e) => {
                                                const rawValue = parseCommaNumber(e.target.value);
                                                if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                    const val = parseFloat(rawValue) || 0;
                                                    setManualEntry({ ...manualEntry, aircon: val, total_amount: (manualEntry.brpad || 0) + val + (manualEntry.electrical || 0) + (manualEntry.mechanical || 0) });
                                                }
                                            }} className="h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Electrical</Label>
                                            <Input type="text" value={formatWithCommas(manualEntry.electrical)} onChange={(e) => {
                                                const rawValue = parseCommaNumber(e.target.value);
                                                if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                    const val = parseFloat(rawValue) || 0;
                                                    setManualEntry({ ...manualEntry, electrical: val, total_amount: (manualEntry.brpad || 0) + (manualEntry.aircon || 0) + val + (manualEntry.mechanical || 0) });
                                                }
                                            }} className="h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Mechanical</Label>
                                            <Input type="text" value={formatWithCommas(manualEntry.mechanical)} onChange={(e) => {
                                                const rawValue = parseCommaNumber(e.target.value);
                                                if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                    const val = parseFloat(rawValue) || 0;
                                                    setManualEntry({ ...manualEntry, mechanical: val, total_amount: (manualEntry.brpad || 0) + (manualEntry.aircon || 0) + (manualEntry.electrical || 0) + val });
                                                }
                                            }} className="h-8" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4 pt-2 border-t mt-2">
                                    <Label className="text-right font-bold text-red-600">TOTAL</Label>
                                    <div className="col-span-3">
                                        <Input 
                                            type="text" 
                                            value={formatWithCommas(manualEntry.total_amount)} 
                                            onChange={(e) => {
                                                const rawValue = parseCommaNumber(e.target.value);
                                                if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                    setManualEntry({ ...manualEntry, total_amount: parseFloat(rawValue) || 0 });
                                                }
                                            }}
                                            className="font-bold text-red-600 border-red-200 focus:border-red-500 h-9"
                                            placeholder="Enter final total amount"
                                        />
                                        <p className="text-[9px] text-muted-foreground mt-1 italic flex justify-between items-center">
                                            <span>Calculated sum: ₱{((manualEntry.brpad || 0) + (manualEntry.aircon || 0) + (manualEntry.electrical || 0) + (manualEntry.mechanical || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                                            {manualEntry.total_amount !== ((manualEntry.brpad || 0) + (manualEntry.aircon || 0) + (manualEntry.electrical || 0) + (manualEntry.mechanical || 0)) && (
                                                <span className="text-red-600 font-bold bg-red-50 px-1 rounded">Entered Total: ₱{manualEntry.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4 pt-2">
                                    <Label htmlFor="s_remarks" className="text-right">Remarks</Label>
                                    <Input id="s_remarks" value={manualEntry.remarks} onChange={(e) => setManualEntry({ ...manualEntry, remarks: e.target.value })} className="col-span-3" />
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
                                                    vehicle_year: manualEntry.vehicle_year || "",
                                                    original_created_at: (() => {
                                                        const now = new Date();
                                                        const [y, m, d] = manualEntry.created_at.split('-').map(Number);
                                                        const dateWithTime = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
                                                        return dateWithTime.toISOString();
                                                    })(),
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
                                            setManualEntry({
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
                                            onUpdate?.()
                                        } else {
                                            const errorData = await response.json().catch(() => ({}));
                                            throw new Error(errorData.error || "Failed to add record")
                                        }
                                    } catch (e: any) {
                                        toast({ title: "Error", description: e.message || "Could not add record.", variant: "destructive" })
                                    } finally {
                                        setIsSaving(false)
                                    }
                                }} disabled={isSaving || !manualEntry.name}>
                                    Add Entry
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Printer className="w-5 h-5 text-primary" />
                                    Print Configuration
                                </DialogTitle>
                                <DialogDescription>
                                    Select which records to include in the <strong>{reportPeriodLabel}</strong> report.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4">
                                <RadioGroup value={printFilter} onValueChange={(v: any) => setPrintFilter(v)} className="grid gap-3">
                                    <Label
                                        htmlFor="print-all"
                                        className={cn(
                                            "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                                            printFilter === "all" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value="all" id="print-all" className="sr-only" />
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">All Records</p>
                                                <p className="text-xs text-muted-foreground">Print everything currently visible</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="ml-auto font-mono">{tableRecords.length}</Badge>
                                    </Label>

                                    <Label
                                        htmlFor="print-released"
                                        className={cn(
                                            "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                                            printFilter === "released" ? "border-green-600 bg-green-600/10 ring-1 ring-green-600" : "border-border"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value="released" id="print-released" className="sr-only" />
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">Released Only</p>
                                                <p className="text-xs text-muted-foreground">Only units already finished</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="ml-auto font-mono text-green-600 border-green-200">
                                            {tableRecords.filter(r => (r.source === 'history' || r.completed_at || r.isArchived)).length}
                                        </Badge>
                                    </Label>

                                    <Label
                                        htmlFor="print-inprogress"
                                        className={cn(
                                            "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                                            printFilter === "in-progress" ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500" : "border-border"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value="in-progress" id="print-inprogress" className="sr-only" />
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">In-Progress Only</p>
                                                <p className="text-xs text-muted-foreground">Only units currently in repair</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="ml-auto font-mono text-orange-600 border-orange-200">
                                            {tableRecords.filter(r => !(r.source === 'history' || r.completed_at || r.isArchived)).length}
                                        </Badge>
                                    </Label>
                                </RadioGroup>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>Cancel</Button>
                                <Button onClick={executePrint} className="gap-2">
                                    <Printer className="w-4 h-4" />
                                    Generate PDF
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Charts section similar to ReleaseMonitoring but for Entry Data */}
            {tableRecords.length > 0 && (
                <div className="p-6 bg-muted/5 border-b border-border">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-full md:w-1/3 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Entry Performance</span>
                            </div>
                            <h4 className="text-sm text-muted-foreground">Est. Total Entry for {reportPeriodLabel}</h4>
                            <p className="text-4xl font-black text-primary mt-2">
                                ₱{tableTotals.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        {reportPeriod !== "monthly" && (
                            <div className="w-full md:w-2/3 h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={yearlyChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                                        <YAxis hide />
                                        <ChartTooltip />
                                        <Bar dataKey="total" radius={[4, 4, 0, 0]} className="fill-primary" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
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
                            <th className="p-2 border border-border text-center font-bold text-[10px]">TOTAL<br /><span className="text-[7px] font-normal leading-tight opacity-80">(w/ VAT/DISCOUNT)</span></th>
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
                                const syncDateStr = r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at
                                const dateStr = syncDateStr ? new Date(syncDateStr).toLocaleString("en-US", {
                                    month: "numeric",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true
                                }) : ""
                                const costs = getCategorizedCosts(r)
                                const currentVal = (field: string) => editedData[r.id]?.[field] !== undefined ? editedData[r.id][field] : (r[field] || "")

                                return (
                                    <tr key={r.id} className={`border-b border-border ${isEditing ? 'bg-muted/30' : 'hover:bg-muted/10'}`}>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? (
                                                <button onClick={() => handleDeleteRecord(r.id, r.name)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                                            ) : (idx + 1)}
                                        </td>
                                        <td className="p-2 border border-border">
                                            {isEditing ? (
                                                <div className="flex gap-1">
                                                    <Input className="h-6 text-[9px] w-12 px-1" placeholder="Year" value={currentVal("vehicle_year")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_year: e.target.value } }))} />
                                                    <Input className="h-6 text-[9px] flex-1 px-1" placeholder="Make" value={currentVal("vehicle_make")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_make: e.target.value } }))} />
                                                    <Input className="h-6 text-[9px] flex-1 px-1" placeholder="Model" value={currentVal("vehicle_model")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_model: e.target.value } }))} />
                                                </div>
                                            ) : unitStr}
                                        </td>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? <Input className="h-6 text-[10px] px-1 text-center" value={currentVal("vehicle_plate")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_plate: e.target.value } }))} /> : (r.vehicle_plate || r.vehiclePlate)}
                                        </td>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? <Input className="h-6 text-[10px] px-1 text-center" value={currentVal("vehicle_color")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_color: e.target.value } }))} /> : (r.vehicle_color || r.vehicleColor)}
                                        </td>
                                        <td className="p-2 border border-border">
                                            {isEditing ? <Input className="h-6 text-[10px] px-1" value={currentVal("name")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), name: e.target.value } }))} /> : r.name}
                                        </td>
                                        <td className="p-2 border border-border text-center uppercase text-[9px]">
                                            {isEditing ? <Input className="h-6 text-[9px] px-1 text-center" value={currentVal("insurance")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), insurance: e.target.value } }))} /> : (r.insurance)}
                                        </td>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? <Input className="h-6 text-[10px] px-1 text-center" value={currentVal("estimate_number")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), estimate_number: e.target.value } }))} /> : (r.estimate_number || r.estimateNumber || r.trackingCode || "")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono">
                                            {isEditing ? (
                                                <Input 
                                                    type="text" 
                                                    className="h-6 text-[10px] px-1 text-right w-full" 
                                                    value={formatWithCommas(currentVal("brpad") || (costs.brpad > 0 ? costs.brpad : ""))} 
                                                    onChange={(e) => {
                                                        const rawValue = parseCommaNumber(e.target.value);
                                                        if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                            setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), brpad: rawValue } }))
                                                        }
                                                    }} 
                                                />
                                            ) : (costs.brpad > 0 ? costs.brpad.toLocaleString() : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono">
                                            {isEditing ? (
                                                <Input 
                                                    type="text" 
                                                    className="h-6 text-[10px] px-1 text-right w-full" 
                                                    value={formatWithCommas(currentVal("aircon") || (costs.aircon > 0 ? costs.aircon : ""))} 
                                                    onChange={(e) => {
                                                        const rawValue = parseCommaNumber(e.target.value);
                                                        if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                            setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), aircon: rawValue } }))
                                                        }
                                                    }} 
                                                />
                                            ) : (costs.aircon > 0 ? costs.aircon.toLocaleString() : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono">
                                            {isEditing ? (
                                                <Input 
                                                    type="text" 
                                                    className="h-6 text-[10px] px-1 text-right w-full" 
                                                    value={formatWithCommas(currentVal("electrical") || (costs.electrical > 0 ? costs.electrical : ""))} 
                                                    onChange={(e) => {
                                                        const rawValue = parseCommaNumber(e.target.value);
                                                        if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                            setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), electrical: rawValue } }))
                                                        }
                                                    }} 
                                                />
                                            ) : (costs.electrical > 0 ? costs.electrical.toLocaleString() : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono">
                                            {isEditing ? (
                                                <Input 
                                                    type="text" 
                                                    className="h-6 text-[10px] px-1 text-right w-full" 
                                                    value={formatWithCommas(currentVal("mechanical") || (costs.mechanical > 0 ? costs.mechanical : ""))} 
                                                    onChange={(e) => {
                                                        const rawValue = parseCommaNumber(e.target.value);
                                                        if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                            setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), mechanical: rawValue } }))
                                                        }
                                                    }} 
                                                />
                                            ) : (costs.mechanical > 0 ? costs.mechanical.toLocaleString() : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono font-bold">
                                            {isEditing ? (
                                                <Input 
                                                    type="text" 
                                                    className="h-6 text-[10px] px-1 text-right w-full font-bold" 
                                                    value={formatWithCommas(editedData[r.id]?.total ?? (costs.total > 0 ? costs.total : ""))} 
                                                    onChange={(e) => {
                                                        const rawValue = parseCommaNumber(e.target.value);
                                                        if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
                                                            setEditedData(prev => ({ 
                                                                ...prev, 
                                                                [r.id]: { ...(prev[r.id] || {}), total: parseFloat(rawValue) || 0 } 
                                                            }))
                                                        }
                                                    }} 
                                                />
                                            ) : (costs.total > 0 ? costs.total.toLocaleString() : "-")}
                                        </td>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? <Input className="h-6 text-[10px] px-1 text-center" value={currentVal("current_repair_part")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), current_repair_part: e.target.value } }))} /> : (r.current_repair_part || r.currentRepairPart || "")}
                                        </td>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? (
                                                <Input 
                                                    type="date" 
                                                    className="h-6 text-[9px] px-1 text-center w-full" 
                                                    value={currentVal("synced_at") ? new Date(currentVal("synced_at")).toISOString().split('T')[0] : (syncDateStr ? new Date(syncDateStr).toISOString().split('T')[0] : "")} 
                                                    onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), synced_at: e.target.value } }))} 
                                                />
                                            ) : dateStr}
                                        </td>
                                        <td className="p-2 border border-border">
                                            {isEditing ? (
                                                <Input 
                                                    className="h-6 text-[10px] px-1" 
                                                    value={currentVal("paul_notes")} 
                                                    onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), paul_notes: e.target.value } }))} 
                                                />
                                            ) : (r.paul_notes || r.paulNotes || r.remarks)}
                                        </td>
                                        <td className="p-2 border border-border text-center no-print">
                                            {r.archived_reason === "Manual Entry" ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge variant="outline" className="text-[8px] px-1 h-4 cursor-help border-blue-500/40 text-blue-500">
                                                            MANUAL
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="bg-blue-600 text-white border-none shadow-lg">
                                                        <p className="font-bold">Synced from Release Monitoring</p>
                                                        <p className="text-xs">Manually added by admin</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : r.source === 'history' || r.completed_at ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge variant="outline" className="text-[8px] px-1 h-4 cursor-help">
                                                            RELEASED
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="bg-emerald-600 text-white border-none shadow-lg">
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className="font-bold">Released on:</p>
                                                            <p>{new Date(r.completed_at || r.synced_at || r.created_at).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <Badge variant="default" className="text-[8px] px-1 h-4">
                                                    IN-PROGRESS
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr><td colSpan={16} className="p-12 text-center text-muted-foreground italic">No records found for {reportPeriodLabel}.</td></tr>
                        )}
                    </tbody>
                    {tableRecords.length > 0 && (
                        <tfoot>
                            <tr className="bg-[#FFD966]/20 font-bold border-t-2 border-border">
                                <td colSpan={7} className="p-2 border border-border text-right uppercase text-[10px]">Total Sales for {reportPeriodLabel}</td>
                                <td className="p-2 border border-border text-right font-mono text-[10px]">{tableTotals.brpad > 0 ? tableTotals.brpad.toLocaleString() : "-"}</td>
                                <td className="p-2 border border-border text-right font-mono text-[10px]">{tableTotals.aircon > 0 ? tableTotals.aircon.toLocaleString() : "-"}</td>
                                <td className="p-2 border border-border text-right font-mono text-[10px]">{tableTotals.electrical > 0 ? tableTotals.electrical.toLocaleString() : "-"}</td>
                                <td className="p-2 border border-border text-right font-mono text-[10px]">{tableTotals.mechanical > 0 ? tableTotals.mechanical.toLocaleString() : "-"}</td>
                                <td className="p-2 border border-border text-right font-mono text-primary text-[11px] font-black">₱{tableTotals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td colSpan={4} className="p-2 border border-border"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    )
}
