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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts"

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
        const pageHeight = doc.internal.pageSize.getHeight()
        const monthLabel = months.find(m => m.value === selectedMonth)?.label

        // Helper to handle page breaks
        let yPos = 20
        const checkPageBreak = (needed: number) => {
            if (yPos + needed > pageHeight - 30) {
                doc.addPage()
                yPos = 25
                addFooter()
                return true
            }
            return false
        }

        const addFooter = () => {
            const totalPages = (doc as any).internal.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(`CONFIDENTIAL - AUTOWORX BUSINESS INTELLIGENCE - PAGE ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        }

        // --- PAGE 1: COVER ---
        doc.setFillColor(26, 95, 156) // Autoworx Blue
        doc.rect(0, 0, pageWidth, 60, 'F')

        doc.setFontSize(28)
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.text("AUTOWORX REPAIRS", margin, 35)

        doc.setFontSize(10)
        doc.setTextColor(200, 220, 255)
        doc.setFont("helvetica", "normal")
        doc.text("EXECUTIVE PERFORMANCE ANALYSIS REPORT", margin, 45)

        yPos = 75
        doc.setFontSize(12)
        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "bold")
        doc.text(`REPORT PERIOD: ${monthLabel?.toUpperCase()} ${selectedYear}`, margin, yPos)
        yPos += 7
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Generated on: ${new Date().toLocaleDateString()} @ ${new Date().toLocaleTimeString()}`, margin, yPos)
        yPos += 15

        // Parse sections
        const [writtenPart, dataPart] = report.split(/### DATA_BLOCK/).map(p => p.trim())
        const sections = writtenPart.split(/### /).filter(Boolean)

        sections.forEach((section) => {
            const lines = section.split('\n')
            const title = lines[0].trim()
            const content = lines.slice(1).join('\n').trim()

            checkPageBreak(30)

            // Section Header
            doc.setFillColor(245, 248, 252)
            doc.rect(margin, yPos, pageWidth - (margin * 2), 10, 'F')
            doc.setFontSize(13)
            doc.setTextColor(26, 95, 156)
            doc.setFont("helvetica", "bold")
            doc.text(title, margin + 5, yPos + 7)
            yPos += 18

            // Render content based on section type
            if (title.includes("FINANCIAL")) {
                doc.setFontSize(10)
                doc.setTextColor(80, 80, 80)

                // Draw Table
                const items = content.split('\n').filter(l => l.includes(':'))
                items.forEach((item, idx) => {
                    const cleanLine = item.replace(/^- \*\*/, "").replace(/\*\*/g, "").trim()
                    const parts = cleanLine.split(':')
                    const label = parts[0]
                    const val = parts.slice(1).join(':').trim()

                    // Row Background
                    if (idx % 2 === 0) doc.setFillColor(252, 252, 252)
                    else doc.setFillColor(255, 255, 255)
                    doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F')

                    doc.setFont("helvetica", "bold")
                    doc.text(label.toUpperCase(), margin + 5, yPos)
                    doc.setFont("helvetica", "bold")
                    doc.setTextColor(26, 95, 156)
                    doc.text(val.replace(/₱/g, "PHP "), pageWidth - margin - 5, yPos, { align: 'right' })

                    doc.setTextColor(80, 80, 80)
                    yPos += 8
                })
                yPos += 10
            } else if (title.includes("STRATEGIC")) {
                const bullets = content.split('\n').filter(l => l.trim().length > 0)
                bullets.forEach(bullet => {
                    checkPageBreak(15)
                    doc.setFillColor(26, 95, 156)
                    doc.circle(margin + 5, yPos - 2, 1, 'F')

                    doc.setFontSize(10)
                    doc.setFont("helvetica", "normal")
                    const cleanBullet = bullet.replace(/^- |\d\. /g, "").replace(/\*\*/g, "")
                    const splitBullet = doc.splitTextToSize(cleanBullet, pageWidth - (margin * 2) - 15)
                    doc.text(splitBullet, margin + 12, yPos)
                    yPos += (splitBullet.length * 6) + 4
                })
                yPos += 10
            } else {
                doc.setFontSize(10)
                doc.setFont("helvetica", "normal")
                const splitContent = doc.splitTextToSize(content.replace(/\*\*/g, ""), pageWidth - (margin * 2))
                doc.text(splitContent, margin, yPos)
                yPos += (splitContent.length * 6) + 10
            }
        })

        // --- DRAW MINI CHART ---
        try {
            if (dataPart) {
                const chartData = JSON.parse(dataPart.replace(/```json|```/g, '').trim())
                if (chartData && chartData.length > 0) {
                    checkPageBreak(60)
                    doc.setFontSize(12)
                    doc.setFont("helvetica", "bold")
                    doc.setTextColor(26, 95, 156)
                    doc.text("REVENUE DISTRIBUTION (OVERVIEW)", margin, yPos)
                    yPos += 10

                    const chartX = margin + 10
                    const chartW = 120
                    const chartH = 40
                    const barW = (chartW / chartData.length) - 10

                    const maxVal = Math.max(...chartData.map((d: any) => d.value))

                    chartData.forEach((d: any, i: number) => {
                        const h = (d.value / maxVal) * chartH
                        doc.setFillColor(26, 95, 156, (100 - (i * 20)) / 100)
                        doc.rect(chartX + (i * (barW + 10)), yPos + (chartH - h), barW, h, 'F')

                        doc.setFontSize(7)
                        doc.setTextColor(100, 100, 100)
                        doc.text(d.name, chartX + (i * (barW + 10)) + (barW / 2), yPos + chartH + 5, { align: 'center' })
                        doc.setFontSize(6)
                        doc.text(`PHP ${d.value}`, chartX + (i * (barW + 10)) + (barW / 2), yPos + (chartH - h) - 2, { align: 'center' })
                    })
                    yPos += 60
                }
            }
        } catch (e) {
            console.error("PDF Chart drawing failed", e)
        }

        addFooter()
        doc.save(`Autoworx_Executive_Report_${monthLabel}_${selectedYear}.pdf`)
    }

    const exportToExcel = () => {
        if (!rawData || rawData.length === 0) return

        // Format data for Excel
        const formattedData = rawData.map(item => ({
            "Date Archived": new Date(item.date).toLocaleDateString(),
            "Vehicle": item.vehicle,
            "Service": item.service,
            "Labor Fees": item.costing?.items?.filter((i: any) => i.type === "labor").reduce((sum: number, i: any) => sum + i.total, 0) || 0,
            "Parts Sales": item.costing?.items?.filter((i: any) => i.type === "parts").reduce((sum: number, i: any) => sum + i.total, 0) || 0,
            "Grand Total": item.costing?.total || 0
        }))

        const ws = XLSX.utils.json_to_sheet(formattedData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Sales Data")

        const monthLabel = months.find(m => m.value === selectedMonth)?.label
        XLSX.writeFile(wb, `Autoworx_Sales_Data_${monthLabel}_${selectedYear}.xlsx`)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary active:scale-95 transition-all">
                    <Brain className="w-4 h-4" />
                    AI Analyst
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden border-primary/20 shadow-2xl">
                <DialogHeader className="p-6 border-b bg-background">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-foreground">
                                    Business Intelligence
                                </DialogTitle>
                                <DialogDescription className="font-medium text-muted-foreground">
                                    Strategic insights and performance metrics.
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 p-3 bg-muted/40 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-2">
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-[140px] h-10 bg-background border-border shadow-sm">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[100px] h-10 bg-background border-border shadow-sm">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={generateReport}
                                disabled={loading}
                                size="default"
                                className="gap-2 px-6 h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-bold transition-all active:scale-95"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Run Analysis
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
                    {!report && !loading && !error && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-80">
                            <div className="p-6 bg-primary/5 rounded-full text-primary border border-primary/10 shadow-inner">
                                <FileText className="w-16 h-16" />
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-2xl font-bold mb-2 text-primary/80">Generate Insight Report</h3>
                                <p className="text-muted-foreground font-medium">
                                    Click the button above to start the professional AI analysis of your archived shop data.
                                </p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain className="w-6 h-6 text-primary/40" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-extrabold text-xl text-primary/95">Analyzing Business Metrics</p>
                                <p className="text-muted-foreground font-medium italic mt-1">Cross-referencing services and revenue streams...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-destructive/5 rounded-3xl p-12">
                            <div className="p-5 bg-destructive/10 rounded-full text-destructive shadow-sm">
                                <AlertTriangle className="w-12 h-12" />
                            </div>
                            <div className="text-center max-w-sm">
                                <h3 className="text-destructive font-black text-xl uppercase tracking-wider">Analysis Blocked</h3>
                                <p className="text-muted-foreground font-medium mt-2">{error}</p>
                            </div>
                            <Button variant="outline" onClick={generateReport} className="mt-4 border-destructive/20 text-destructive hover:bg-destructive/10">Try Again</Button>
                        </div>
                    )}

                    {report && (
                        <div className="h-[500px] overflow-hidden">
                            <BusinessReportView report={report} />
                        </div>
                    )}
                </div>

                {report && (
                    <div className="p-4 border-t bg-muted/40 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">System Authenticated</span>
                            <span className="text-xs font-bold text-primary/70">Verified Autoworx Intelligence Output</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="default" size="sm" onClick={exportToPDF} className="gap-2 h-9 px-4 font-bold shadow-md">
                                <Download className="w-4 h-4" />
                                Formal PDF Report
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2 h-9 px-4 font-bold border-primary/20 text-primary hover:bg-primary/5">
                                <FileText className="w-4 h-4" />
                                Raw Data Export
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function BusinessReportView({ report }: { report: string }) {
    // Separate the written report from the JSON data block
    const [writtenPart, dataPart] = report.split(/### DATA_BLOCK/).map(p => p.trim())

    let chartData: any[] = []
    try {
        if (dataPart) {
            chartData = JSON.parse(dataPart.replace(/```json|```/g, '').trim())
        }
    } catch (e) {
        console.error("Chart parsing failed", e)
    }

    const sections = writtenPart.split(/### (.*?)\n/).filter(Boolean)
    const parsedSections: { title: string; content: string }[] = []

    for (let i = 0; i < sections.length; i += 2) {
        if (sections[i] && sections[i + 1]) {
            const title = sections[i].trim();
            parsedSections.push({
                title: title,
                content: sections[i + 1].trim()
            })
        }
    }

    return (
        <ScrollArea className="h-[500px] w-full rounded-2xl border border-border bg-muted/20">
            <div className="p-8 space-y-10 max-w-4xl mx-auto">
                {/* Visual Dashboard Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="p-8 bg-card border border-border rounded-2xl shadow-sm flex flex-col justify-center">
                        <h2 className="text-2xl font-bold text-foreground">Performance Analysis</h2>
                        <p className="text-sm text-muted-foreground font-medium mt-1">Strategic business insights for this period.</p>
                    </div>
                    {chartData.length > 0 && (
                        <div className="h-[140px] w-full bg-card rounded-2xl border border-border p-4 shadow-sm">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" fontSize={11} fontWeight="600" axisLine={false} tickLine={false} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? "var(--primary)" : "rgba(var(--primary), 0.7)"} />
                                        ))}
                                    </Bar>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600' }}
                                        formatter={(val) => `PHP ${val}`}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {parsedSections.map((section, idx) => (
                    <div key={idx} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">
                                    {section.title}
                                </h3>
                            </div>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                            <div className="space-y-1">
                                {section.content.split('\n').map((line, lIdx) => {
                                    const trimmed = line.trim()
                                    if (!trimmed) return null

                                    // Check if it's financial key-value
                                    if (trimmed.startsWith('- **') || trimmed.startsWith('**')) {
                                        const cleanLine = trimmed.replace(/^- /, '').replace(/\*\*/g, '')
                                        const parts = cleanLine.split(':')
                                        const label = parts[0]
                                        const value = parts.slice(1).join(':')

                                        return (
                                            <div key={lIdx} className="flex justify-between items-center py-3 border-b border-muted last:border-0 px-2 transition-colors">
                                                <span className="text-sm font-semibold text-muted-foreground">{label}</span>
                                                <span className="text-sm font-bold text-foreground font-mono">{value || '---'}</span>
                                            </div>
                                        )
                                    }

                                    // Bullets
                                    if (trimmed.startsWith('-') || trimmed.match(/^\d\./)) {
                                        return (
                                            <div key={lIdx} className="flex gap-4 py-3 items-start">
                                                <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                                <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                                                    {trimmed.replace(/^- /, '').replace(/^\d\./, '').replace(/\*\*/g, '')}
                                                </p>
                                            </div>
                                        )
                                    }

                                    return (
                                        <p key={lIdx} className="text-sm py-2 font-medium text-muted-foreground italic leading-relaxed">
                                            {trimmed.replace(/\*\*/g, '')}
                                        </p>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="pt-10 flex flex-col items-center gap-4">
                    <div className="h-px w-20 bg-border" />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                        Autoworx Intelligence Report
                    </p>
                </div>
            </div>
        </ScrollArea>
    )
}
