"use client"

import React, { useState, useMemo } from "react"
import { Printer, Calendar as CalendarIcon, FileDown, Eye, Edit, Save, Loader2, X, FileCheck, FileX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateReleaseMonitoringDoc } from "@/lib/generate-pdf"
import { useToast } from "@/components/ui/use-toast"

export function ReleaseMonitoring({ records, onUpdate }: { records: any[], onUpdate?: () => void }) {
    // Extract unique months from completed_at / created_at date strings
    const monthsMap = new Map<string, string>()

    records.forEach(r => {
        const dateStr = r.completed_at || r.original_created_at
        if (dateStr) {
            const d = new Date(dateStr)
            if (!isNaN(d.getTime())) {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                if (!monthsMap.has(key)) {
                    monthsMap.set(key, label)
                }
            }
        }
    })

    // Sort months descending
    const availableMonths = Array.from(monthsMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))

    // Default to the latest month or current month if no data
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const [selectedMonth, setSelectedMonth] = useState<string>(
        availableMonths.length > 0 ? availableMonths[0][0] : currentMonthKey
    )

    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editedData, setEditedData] = useState<Record<string, any>>({})
    const { toast } = useToast()

    // Filter records by selected month
    const tableRecords = useMemo(() => {
        return records.filter(r => {
            const dateStr = r.completed_at || r.original_created_at
            if (!dateStr) return false
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return false
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            return key === selectedMonth
        }).sort((a, b) => {
            const da = new Date(a.completed_at || a.original_created_at).getTime()
            const db = new Date(b.completed_at || b.original_created_at).getTime()
            return da - db // Ascending order
        })
    }, [records, selectedMonth])

    // Get display text for the month
    const currentMonthLabel = monthsMap.get(selectedMonth) || new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })

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

    const handlePrint = async () => {
        const htmlContent = generateReleaseMonitoringDoc(tableRecords, currentMonthLabel, getCategorizedCosts)

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

    return (
        <div className="space-y-4 bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Release Monitoring Report</h3>
                    <p className="text-sm text-muted-foreground">Monthly sales performance and released units</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
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
                                    <SelectItem value={currentMonthKey}>{currentMonthLabel}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
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
                                        if (Object.keys(updates).length > 0) {
                                            await fetch("/api/history", {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ id, updates })
                                            })
                                        }
                                    }
                                    toast({ title: "Saved successfully", description: "The records have been updated." })
                                    setIsEditing(false)
                                    setEditedData({})
                                    onUpdate?.()
                                    toast({ title: "Report Updated", description: "Changes have been successfully saved." })
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
                </div>
            </div>

            <div className="p-4 overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse text-xs">
                    <thead>
                        <tr>
                            <th colSpan={15} className="text-left pb-4 border-none">
                                <h1 className="text-red-700 m-0 text-3xl font-bold font-serif tracking-widest" style={{ textShadow: "1px 1px 0 #fff, 2px 2px 0 #ccc" }}>
                                    RELEASE MONITORING
                                </h1>
                                <div className="flex gap-10 items-baseline mt-2 mb-2">
                                    <div className="font-bold text-lg text-foreground">SALES</div>
                                    <div className="font-normal text-sm text-foreground ml-5">As of: {currentMonthLabel}</div>
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
                                const dateStr = r.completed_at || r.original_created_at ? new Date(r.completed_at || r.original_created_at).toLocaleDateString("en-US") : ""
                                const modVal = r.current_repair_part || ""
                                const costs = getCategorizedCosts(r.costing)

                                const currentVal = (field: string) => editedData[r.id]?.[field] !== undefined ? editedData[r.id][field] : (r[field] || "")

                                return (
                                    <tr key={r.id} className={`border-b border-border ${isEditing ? 'bg-muted/30' : 'hover:bg-muted/10'} text-foreground`}>
                                        <td className="p-2 border border-border text-center">{idx + 1}</td>
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
                                            ) : ("")}
                                        </td>
                                        <td className="p-2 border border-border text-right font-mono">{costs.brpad > 0 ? costs.brpad.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-"}</td>
                                        <td className="p-2 border border-border text-right font-mono">{costs.aircon > 0 ? costs.aircon.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-"}</td>
                                        <td className="p-2 border border-border text-right font-mono">{costs.electrical > 0 ? costs.electrical.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-"}</td>
                                        <td className="p-2 border border-border text-right font-mono">{costs.mechanical > 0 ? costs.mechanical.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-"}</td>
                                        <td className="p-2 border border-border text-right font-mono font-bold">{costs.total > 0 ? costs.total.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "-"}</td>
                                        <td className="p-2 border border-border text-center">
                                            {isEditing ? (
                                                <Input className="h-7 px-2 text-[10px] w-full" value={currentVal("current_repair_part")} onChange={(e) => setEditedData(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), current_repair_part: e.target.value } }))} />
                                            ) : (modVal)}
                                        </td>
                                        <td className="p-2 border border-border text-center">{dateStr}</td>
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
                                <td colSpan={16} className="p-8 text-center text-muted-foreground italic border border-border">
                                    No completed units found for this month.
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
