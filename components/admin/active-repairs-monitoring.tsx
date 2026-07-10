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
import { generateActiveRepairsDoc } from "@/lib/generate-pdf"
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

const SERVICE_CATEGORIES = [
    "Mechanical Works",
    "Electrical",
    "Aircon",
    "Tinsmith/Alignment",
    "Glassworks",
    "Remove and Install",
    "Detailing",
    "Painting",
    "Parts"
];

export function ActiveRepairsMonitoring({ records, onUpdate }: { records: any[], onUpdate?: () => void }) {
    const { data: session } = useSession()
    const { toast } = useToast()

    // Extract unique months and years from created_at date strings
    const monthsMap = new Map<string, string>()
    const yearsSet = new Set<string>()

    records.forEach(r => {
        // For Active On-Going Repairs, we primarily care about the ENTRY date (created_at or original_created_at)
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
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [claimTypeFilter, setClaimTypeFilter] = useState("all")
    const [isManualModalOpen, setIsManualModalOpen] = useState(false)
    const [viewDetailsModal, setViewDetailsModal] = useState<{isOpen: boolean, record: any | null}>({ isOpen: false, record: null })
    const [manualEntry, setManualEntry] = useState({
        name: "",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_year: "",
        vehicle_plate: "",
        insurance: "Personal Claim",
        created_at: new Date().toISOString().split('T')[0],
        total_amount: "",
        brpad: "",
        aircon: "",
        electrical: "",
        mechanical: "",
        remarks: ""
    })

    const normalizeString = (str: string) => {
        if (!str) return ""
        return str.toLowerCase().replace(/[\s\-\.\/\,]/g, "")
    }

    const tableRecords = useMemo(() => {
        return records.filter(r => {
            // Include all records in Active On-Going Repairs / Unit Entry regardless of backjob status


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
                        r.trackingCode || r.tracking_code,
                        ...(r.costing?.items || []).map((item: any) => item.category),
                        ...(r.costing?.items || []).map((item: any) => item.type),
                        ...(r.costing?.items || []).map((item: any) => item.description)
                    ].some(field => normalizeString(field || "").includes(normToken))
                })
                if (!isRecordMatch) return false
            }

            if (selectedCategories.length > 0) {
                const itemCategories = (r.costing?.items || []).map((item: any) => item.category?.trim()).filter(Boolean);
                const hasMatch = selectedCategories.some(cat => itemCategories.includes(cat));
                if (!hasMatch) return false;
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
    }, [records, selectedMonth, selectedYear, reportPeriod, searchQuery, claimTypeFilter, selectedCategories])

    const reportPeriodLabel = reportPeriod === "monthly"
        ? (monthsMap.get(selectedMonth) || new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }))
        : (reportPeriod === "all" || selectedYear === "all" ? "All Years" : `Full Year ${selectedYear}`)

    const getCategorizedCosts = (r: any) => {
        const costing = r.costing
        let result = { brpad: 0, aircon: 0, electrical: 0, mechanical: 0, total: 0 }
        
        // Use edited data if available
        const edited = editedData[r.id] || {}
        
        if (!costing && !edited.brpad && !edited.aircon && !edited.electrical && !edited.mechanical) return result

        // If we are currently editing costs, prioritize those live values
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

        // PRIORITIZE SAVED OVERRIDES: If a manual adjustment (gatepass_breakdown) exists, use it.
        // This allows admins to override the original estimate numbers in Active On-Going Repairs.
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

        // Active On-Going Repairs only: exclusively sum up the original Repair Estimate items
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



        return result
    }

    

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

    const handlePrint = async () => {
        let filteredRecords = [...tableRecords]

        if (filteredRecords.length === 0) {
            toast({ title: "No data", description: `No records found for this period.`, variant: "destructive" })
            return
        }

        let dynamicTitle = "ACTIVE ON-GOING REPAIRS"

        const htmlContent = generateActiveRepairsDoc(filteredRecords, reportPeriodLabel, dynamicTitle, "DATE ENTRY")

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

    const handlePrintJobOrder = async (record: any) => {
        try {
            const { generateJobOrderPDF } = await import("@/lib/generate-pdf");
            const htmlContent = await generateJobOrderPDF(record);

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                toast({ title: "Popup Blocked", description: "Please allow popups to print the Job Order.", variant: "destructive" });
                return;
            }

            printWindow.document.open();
            printWindow.document.write(htmlContent);
            printWindow.document.close();

            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);
        } catch (error) {
            console.error("Error generating Job Order PDF:", error);
            toast({ title: "Error", description: "Failed to generate Job Order PDF.", variant: "destructive" });
        }
    };

    const handlePrintHistoryEntry = async (record: any, entry: any) => {
        const appointment = {
            ...record,
            assigneeDriver: entry.assignee,
            assignedTechnician: entry.assignee,
            insurance: entry.jobClassification,
            costing: {
                ...(record.costing || {}),
                jobDescription: entry.jobDescription || "",
                scopeOfWorks: entry.scopeOfWorks,
                partsText: entry.partsText,
                serviceAdvisorName: entry.serviceAdvisor,
                // Place this entry last so slice(-1)[0].targetDate resolves correctly in the PDF
                jobOrderHistory: [
                    ...(record.costing?.jobOrderHistory?.filter((h: any) => h.id !== entry.id) || []),
                    entry
                ]
            }
        };

        try {
            const { generateJobOrderPDF } = await import("@/lib/generate-pdf");
            const htmlContent = await generateJobOrderPDF(appointment as any);

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                toast({ title: "Popup Blocked", description: "Please allow popups to print the Job Order.", variant: "destructive" });
                return;
            }

            printWindow.document.write(`
              <html>
                <head><title>Job Order History</title></head>
                <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
                  <div style="text-align: center; padding: 40px; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <div style="width: 40px; height: 40px; border: 4px solid #1a5f9c; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 18px;">Generating Job Order (History Version)</h2>
                    <p style="color: #6b7280; margin: 0; font-size: 14px;">Version: ${entry.printedAt ? new Date(entry.printedAt).toLocaleString() : ""}</p>
                    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
                  </div>
                </body>
              </html>
            `);

            printWindow.document.open();
            printWindow.document.write(htmlContent);
            printWindow.document.close();

            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);

            toast({
                title: "Reprinting Job Order",
                description: `Printing version from ${entry.printedAt ? new Date(entry.printedAt).toLocaleString() : "this history entry"}`,
            });
        } catch (error: any) {
            console.error("Error generating Job Order PDF:", error);
            toast({ title: "Error", description: "Failed to generate Job Order PDF.", variant: "destructive" });
        }
    };

    const handleDeleteRecord = async (id: string, name: string) => {
        const record = records.find(r => String(r.id) === String(id));
        if (!record) {
            toast({ title: "Error", description: "Record not found in current view.", variant: "destructive" });
            return;
        }

        if (!window.confirm(`Are you sure you want to PERMANENTLY remove "${name}" from the system? This action cannot be undone.`)) {
            return
        }

        setIsSaving(true)
        try {
            // Determine if the record is from history/archived or still in active appointments
            const isHistory = record.source === 'history' || !!record.archived_at;
            const endpoint = isHistory ? "/api/history?permanent=true" : "/api/appointments?permanent=true";

            const response = await fetch(endpoint, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            })

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                toast({ 
                    title: "Record Deleted", 
                    description: `"${name}" has been permanently removed from the database.`,
                })
                // Trigger refresh in parent component
                if (onUpdate) {
                    onUpdate();
                }
            } else {
                throw new Error(data.error || "Delete request failed");
            }
        } catch (e: any) {
            console.error("[SalesMonitoring] Delete error:", e);
            toast({ 
                title: "Deletion Failed", 
                description: e.message || "Could not remove record. Please check your connection and try again.", 
                variant: "destructive" 
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (!isAuthorizedForSales(session?.user?.email)) {
        return (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
                <X className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-bold">Unauthorized</h3>
                <p>You are not authorized to view this confidential report.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Active On-Going Repairs</h3>
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
                                <SelectTrigger className="w-[90px]">
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

                                        const isHistory = record.source === 'history' || !!record.archived_at;
                                        const endpoint = isHistory ? "/api/history" : "/api/appointments";

                                        const updates: any = { ...rawUpdates }

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
                                    Add a unit entry directly to the Active On-Going Repairs sheet.
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
                                                                className="text-[9px] h-7 px-2 font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                                                                onClick={() => setManualEntry({ ...manualEntry, created_at: format(new Date(), "yyyy-MM-dd") })}
                                                            >
                                                                TODAY
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="text-[9px] h-7 px-2 font-bold hover:bg-primary/10 hover:text-primary transition-colors"
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
                                                        total: Number(manualEntry.total_amount) || 0,
                                                        gatepass_breakdown: {
                                                            brpad: Number(manualEntry.brpad) || 0,
                                                            aircon: Number(manualEntry.aircon) || 0,
                                                            electrical: Number(manualEntry.electrical) || 0,
                                                            mechanical: Number(manualEntry.mechanical) || 0,
                                                            total: Number(manualEntry.total_amount) || 0
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
                                                total_amount: "",
                                                brpad: "",
                                                aircon: "",
                                                electrical: "",
                                                mechanical: "",
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

                    <Dialog open={viewDetailsModal.isOpen} onOpenChange={(open) => !open && setViewDetailsModal({ isOpen: false, record: null })}>
                        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Unit Details: {viewDetailsModal.record?.name || viewDetailsModal.record?.vehicle_plate || 'Unknown Unit'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Cost Breakdown</h3>
                                    {viewDetailsModal.record?.costing?.items?.length > 0 ? (
                                        <div className="border rounded-md">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted text-left">
                                                    <tr>
                                                        <th className="p-2 border-b">Description</th>
                                                        <th className="p-2 border-b">Category</th>
                                                        <th className="p-2 border-b text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {viewDetailsModal.record.costing.items.map((item: any, i: number) => (
                                                        <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                                                            <td className="p-2">{item.description || "N/A"}</td>
                                                            <td className="p-2">{item.category || item.type || "N/A"}</td>
                                                            <td className="p-2 text-right">{item.amount ? `₱${formatWithCommas(item.amount)}` : "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">No cost breakdown available.</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Job Order History</h3>
                                    {viewDetailsModal.record?.costing?.jobOrderHistory?.length > 0 ? (
                                        <div className="border rounded-md">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted text-left">
                                                    <tr>
                                                        <th className="p-2 border-b">Date Printed</th>
                                                        <th className="p-2 border-b">Classification</th>
                                                        <th className="p-2 border-b">Target Date</th>
                                                        <th className="p-2 border-b w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {viewDetailsModal.record.costing.jobOrderHistory.map((history: any, i: number) => {
                                                        const isRecent = i === viewDetailsModal.record.costing.jobOrderHistory.length - 1;
                                                        return (
                                                            <tr key={i} className={`border-b last:border-0 hover:bg-muted/10 ${isRecent ? 'bg-blue-500/5' : ''}`}>
                                                                <td className="p-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{history.printedAt ? new Date(history.printedAt).toLocaleString() : (history.date ? new Date(history.date).toLocaleString() : "-")}</span>
                                                                        {isRecent && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0 bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">Recent Print</Badge>}
                                                                    </div>
                                                                    {history.printedBy && <div className="text-[10px] text-muted-foreground mt-0.5">by {history.printedBy}</div>}
                                                                </td>
                                                                <td className="p-2">{history.jobClassification || history.note || "N/A"}</td>
                                                                <td className="p-2">{history.targetDate ? new Date(history.targetDate).toLocaleDateString() : "-"}</td>
                                                                <td className="p-2 text-right">
                                                                    <Button variant={isRecent ? "default" : "ghost"} size="icon" className={isRecent ? "h-6 w-6 bg-blue-500 hover:bg-blue-600" : "h-6 w-6"} onClick={() => handlePrintHistoryEntry(viewDetailsModal.record, history)} title="Print this version">
                                                                        <Printer className="w-3 h-3" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">No Job Order history because this unit the Job Order digital print is not yet implemented</p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter className="sm:justify-between">
                                {viewDetailsModal.record?.costing?.jobOrderHistory?.length > 0 ? (
                                    <Button onClick={() => handlePrintJobOrder(viewDetailsModal.record)} className="gap-2">
                                        <Printer className="w-4 h-4" />
                                        Print Job Order
                                    </Button>
                                ) : (
                                    <div />
                                )}
                                <Button variant="outline" onClick={() => setViewDetailsModal({ isOpen: false, record: null })}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Print Modal Removed */}
                </div>
            </div>

            <div className="p-2 overflow-x-auto">
                <div className="flex flex-wrap items-center gap-2 mb-4 mt-2">
                    {SERVICE_CATEGORIES.map(cat => (
                        <Badge 
                            key={cat} 
                            variant={selectedCategories.includes(cat) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                            onClick={() => {
                                setSelectedCategories(prev => 
                                    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                )
                            }}
                        >
                            {cat}
                        </Badge>
                    ))}
                    {selectedCategories.length > 0 && (
                        <Badge 
                            variant="destructive" 
                            className="cursor-pointer ml-auto"
                            onClick={() => setSelectedCategories([])}
                        >
                            Clear Filters
                        </Badge>
                    )}
                </div>
                <table className="w-full border-collapse text-[9px]">
                    <thead>
                        <tr>
                            <th colSpan={6} className="text-left pb-4 border-none">
                                <h1 className="text-red-700 m-0 text-3xl font-bold font-serif tracking-widest" style={{ textShadow: "1px 1px 0 #fff, 2px 2px 0 #ccc" }}>
                                    ACTIVE REPAIRS
                                </h1>
                                <div className="flex gap-10 items-baseline mt-2 mb-2">
                                    <div className="font-bold text-lg text-foreground uppercase">Unit Entry</div>
                                    <div className="font-normal text-sm text-foreground ml-5">As of: {reportPeriodLabel}</div>
                                </div>
                            </th>
                            <th colSpan={8} className="text-right pb-4 border-none align-bottom">
                                <div className="flex flex-col items-end gap-1 mb-2">
                                    <Input placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 h-10" />
                                    {(searchQuery.trim() !== "" || selectedCategories.length > 0) && (
                                        <span className="text-xs text-muted-foreground font-normal mt-1 mr-1">
                                            {tableRecords.length > 0 ? `Found ${tableRecords.length} unit${tableRecords.length === 1 ? '' : 's'}` : `No units found`}
                                            {searchQuery.trim() !== "" && ` matching "${searchQuery}"`}
                                            {selectedCategories.length > 0 && ` for ${selectedCategories.join(", ")}`}
                                        </span>
                                    )}
                                </div>
                            </th>
                        </tr>
                        <tr className="bg-[#FFD966] text-black border-y border-border">
                            <th className="p-1 border border-border text-center font-bold text-[9px] w-10">NO.</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px]">UNIT</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px]">PLATE</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px]">COLOR</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px]">OWNER</th>
                            <th className="p-1 border border-border text-center font-bold text-[8px] leading-tight w-20 uppercase">Claim Type</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px]">JO/ ES/ PO #</th>
                            
                            
                            
                            
                            
                            <th className="p-1 border border-border text-center font-bold text-[9px]">MOD</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px]">DATE ENTERED</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px]">TARGET DATE</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px] w-14">AGE (DAYS)</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px] w-14">AGE (MONTHS)</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px] w-32">REMARKS</th>
                            <th className="p-1 border border-border text-center font-bold text-[9px] w-16 no-print">STATUS</th>
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
                                const currentVal = (field: string) => {
                                    if (editedData[r.id]?.[field] !== undefined) return editedData[r.id][field];
                                    
                                    // Try snake_case then camelCase
                                    const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                                    return r[field] ?? r[camelField] ?? "";
                                }

                                // Age Calculation logic
                                const entryDate = syncDateStr ? new Date(syncDateStr) : null;
                                const now = new Date();
                                let ageDays = 0;
                                let ageMonths = 0;

                                if (entryDate) {
                                    const diffTime = Math.abs(now.getTime() - entryDate.getTime());
                                    ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    ageMonths = (now.getFullYear() - entryDate.getFullYear()) * 12 + (now.getMonth() - entryDate.getMonth());
                                    if (now.getDate() < entryDate.getDate()) {
                                        ageMonths--;
                                    }
                                    ageMonths = Math.max(0, ageMonths);
                                }

                                // Target Date logic
                                const jobOrderHistory = r.costing?.jobOrderHistory || [];
                                const latestHistory = jobOrderHistory.length > 0 ? jobOrderHistory[jobOrderHistory.length - 1] : null;
                                const targetDateRaw = latestHistory?.targetDate || r.target_date || r.targetDate;
                                let formattedTargetDate = "";
                                if (targetDateRaw) {
                                    const [y, m, d] = targetDateRaw.split("-").map(Number);
                                    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                                        formattedTargetDate = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                    }
                                }

                                return (
                                    <tr 
                                        key={r.id} 
                                        className={`group border-b border-border transition-all duration-200 ${isEditing ? 'bg-muted/30' : 'hover:bg-muted/20 cursor-pointer hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-blue-500 relative hover:z-10'}`}
                                        onClick={(e) => {
                                            if (!isEditing) {
                                                // Prevent opening if they click inside an input or button just in case
                                                if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                                                    setViewDetailsModal({ isOpen: true, record: r })
                                                }
                                            }
                                        }}
                                    >
                                        <td className="p-1 border border-border text-center">
                                            {isEditing ? (
                                                <button onClick={() => handleDeleteRecord(r.id, r.name)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                                            ) : (idx + 1)}
                                        </td>
                                        <td className={`p-1 border border-border text-left relative ${!isEditing ? "truncate max-w-[90px]" : "min-w-[150px]"}`} title={unitStr}>
                                            {isEditing ? (
                                                <div className="flex gap-1">
                                                    <Input className="h-6 text-[9px] w-12 px-1" placeholder="Year" value={currentVal("vehicle_year")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_year: e.target.value } }))} />
                                                    <Input className="h-6 text-[9px] flex-1 px-1" placeholder="Make" value={currentVal("vehicle_make")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_make: e.target.value } }))} />
                                                    <Input className="h-6 text-[9px] flex-1 px-1" placeholder="Model" value={currentVal("vehicle_model")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_model: e.target.value } }))} />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="truncate">{unitStr}</span>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-primary flex-shrink-0" title="View Details">
                                                        <Eye className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-1 border border-border text-center">
                                            {isEditing ? <Input className="h-6 text-[9px] px-1 text-center min-w-[90px]" value={currentVal("vehicle_plate")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_plate: e.target.value } }))} /> : (r.vehicle_plate || r.vehiclePlate)}
                                        </td>
                                        <td className="p-1 border border-border text-center">
                                            {isEditing ? <Input className="h-6 text-[9px] px-1 text-center min-w-[90px]" value={currentVal("vehicle_color")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), vehicle_color: e.target.value } }))} /> : (r.vehicle_color || r.vehicleColor)}
                                        </td>
                                        <td className={`p-1 border border-border text-left ${!isEditing ? "truncate max-w-[90px]" : "min-w-[180px]"}`} title={r.name}>
                                            {isEditing ? <Input className="h-6 text-[9px] px-1 w-full" value={currentVal("name")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), name: e.target.value } }))} /> : r.name}
                                        </td>
                                        <td className="p-1 border border-border text-center uppercase text-[9px]">
                                            {isEditing ? <Input className="h-6 text-[9px] px-1 text-center min-w-[100px]" value={currentVal("insurance")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), insurance: e.target.value } }))} /> : (r.insurance)}
                                        </td>
                                        <td className="p-1 border border-border text-center">
                                            {isEditing ? <Input className="h-6 text-[9px] px-1 text-center min-w-[120px]" value={currentVal("estimate_number")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), estimate_number: e.target.value } }))} /> : (r.estimate_number || r.estimateNumber || r.trackingCode || "")}
                                        </td>
                                        
                                        <td className="p-1 border border-border text-center">
                                            {isEditing ? <Input className="h-6 text-[9px] px-1 text-center" value={currentVal("current_repair_part")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), current_repair_part: e.target.value } }))} /> : (r.current_repair_part || r.currentRepairPart || "")}
                                        </td>
                                        <td className="p-1 border border-border text-center font-mono text-[9px] uppercase">
                                            {isEditing ? (
                                                <Input 
                                                    type="date" 
                                                    className="h-6 text-[9px] px-1 text-center w-full" 
                                                    value={currentVal("synced_at") ? new Date(currentVal("synced_at")).toISOString().split('T')[0] : (syncDateStr ? new Date(syncDateStr).toISOString().split('T')[0] : "")} 
                                                    onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), synced_at: e.target.value } }))} 
                                                />
                                            ) : dateStr}
                                        </td>
                                        <td className="p-1 border border-border text-center font-mono text-[9px] text-amber-500 font-bold">
                                            {formattedTargetDate || "-"}
                                        </td>
                                        <td className="p-1 border border-border text-center font-mono text-[9px]">
                                            {ageDays}d
                                        </td>
                                        <td className="p-1 border border-border text-center font-mono text-[9px]">
                                            {ageMonths}m
                                        </td>
                                        <td className={`p-1 border border-border text-left ${!isEditing ? "truncate max-w-[110px]" : "min-w-[200px]"}`} title={r.paul_notes || r.paulNotes || r.remarks || ""}>
                                            {isEditing ? (
                                                <Input 
                                                    className="h-6 text-[10px] px-1 w-full" 
                                                    value={currentVal("paul_notes")} 
                                                    onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), paul_notes: e.target.value } }))} 
                                                />
                                            ) : (r.paul_notes || r.paulNotes || r.remarks)}
                                        </td>
                                        <td className="p-1 border border-border text-center no-print">
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
                                                    ON-GOING REPAIR
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr><td colSpan={18} className="p-12 text-center text-muted-foreground italic">No records found for {reportPeriodLabel}.</td></tr>
                        )}
                    </tbody>
                    
                </table>
            </div>
        </div>
    )
}
