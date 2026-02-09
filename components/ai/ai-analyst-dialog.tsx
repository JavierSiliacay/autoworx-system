"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Brain, Loader2, Sparkles, FileText, TrendingUp, AlertTriangle, Download, Calendar } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"

export function AIAnalystDialog() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState<string | null>(null)
    const [rawData, setRawData] = useState<any[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Date selection states
    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState<string>((now.getMonth() + 1).toString())
    const [selectedYear, setSelectedYear] = useState<string>(now.getFullYear().toString())

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ]

    const years = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - i).toString())

    const generateReport = async () => {
        setLoading(true)
        setError(null)
        setReport(null)
        setRawData(null)

        try {
            const response = await fetch("/api/admin/ai-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    month: parseInt(selectedMonth),
                    year: parseInt(selectedYear)
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate analyst report")
            }

            setReport(data.report)
            setRawData(data.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const exportToPDF = () => {
        if (!report) return

        const doc = new jsPDF()
        const margin = 20
        const pageWidth = doc.internal.pageSize.getWidth()
        const monthLabel = months.find(m => m.value === selectedMonth)?.label

        // Header
        doc.setFontSize(22)
        doc.setTextColor(26, 95, 156) // Primary blue
        doc.text("AUTOWORX REPAIRS", margin, 25)

        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(`Monthly Business Report: ${monthLabel} ${selectedYear}`, margin, 32)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 38)

        doc.setLineWidth(0.5)
        doc.setDrawColor(26, 95, 156)
        doc.line(margin, 42, pageWidth - margin, 42)

        // Content
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)

        const splitText = doc.splitTextToSize(report, pageWidth - (margin * 2))
        doc.text(splitText, margin, 52)

        // Footer (Page numbering and branding)
        const pageCount = (doc as any).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(10)
            doc.setTextColor(150, 150, 150)
            doc.text("Autoworx Intelligence System - Proprietary Business Analysis", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
        }

        doc.save(`Autoworx_Monthly_Report_${monthLabel}_${selectedYear}.pdf`)
    }

    const exportToExcel = () => {
        if (!rawData || rawData.length === 0) return

        // Format data for Excel
        const formattedData = rawData.map(item => ({
            "Date Archived": new Date(item.date).toLocaleDateString(),
            "Vehicle": item.vehicle,
            "Service": item.service,
            "Labor Cost": item.costing?.items?.filter((i: any) => i.type === "labor").reduce((sum: number, i: any) => sum + i.total, 0) || 0,
            "Parts Cost": item.costing?.items?.filter((i: any) => i.type === "parts").reduce((sum: number, i: any) => sum + i.total, 0) || 0,
            "Total Amount": item.costing?.total || 0
        }))

        const ws = XLSX.utils.json_to_sheet(formattedData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Sales Analysis")

        const monthLabel = months.find(m => m.value === selectedMonth)?.label
        XLSX.writeFile(wb, `Autoworx_Report_${monthLabel}_${selectedYear}.xlsx`)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary active:scale-95 transition-all">
                    <Brain className="w-4 h-4" />
                    AI Analyst
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-primary/20 shadow-2xl">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Sparkles className="w-6 h-6 text-primary" />
                                AI Business Analyst
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Select a month to see your sales performance and AI strategic tips.
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[130px] bg-background">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[100px] bg-background">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={generateReport} disabled={loading} className="gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                                Analyze
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
                    {!report && !loading && !error && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-primary/10 rounded-full text-primary">
                                <TrendingUp className="w-12 h-12" />
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-xl font-semibold mb-2">Ready to analyze your sales?</h3>
                                <p className="text-muted-foreground">
                                    Choose a month above to generate a detailed AI report with Philippine Peso (₱) pricing and revenue insights.
                                </p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            <div className="text-center">
                                <p className="font-semibold text-lg">Processing Sales Data...</p>
                                <p className="text-muted-foreground italic text-sm">Formatting all amounts to Philippine Peso (₱)...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-destructive/10 rounded-full text-destructive">
                                <AlertTriangle className="w-12 h-12" />
                            </div>
                            <div className="text-center max-w-sm">
                                <h3 className="text-error font-semibold text-lg">Analysis Failed</h3>
                                <p className="text-muted-foreground">{error}</p>
                            </div>
                            <Button variant="outline" onClick={generateReport}>Try Again</Button>
                        </div>
                    )}

                    {report && (
                        <ScrollArea className="flex-1 rounded-xl border border-border bg-card p-6 shadow-inner">
                            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-primary prose-strong:text-foreground">
                                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground/90">
                                    {report}
                                </pre>
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {report && (
                    <div className="p-4 border-t bg-muted/30 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">Generated by Autoworx AIS • Amounts in PHP (₱)</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-1 h-8 text-xs border-primary/30 text-primary hover:bg-primary/5">
                                <FileText className="w-3 h-3" />
                                Download Monthly Report (PDF)
                            </Button>
                            <Button variant="ghost" size="sm" onClick={exportToExcel} className="gap-1 h-8 text-xs text-muted-foreground hover:text-green-600">
                                <Download className="w-3 h-3" />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
