"use client"
/* eslint-disable @next/next/no-img-element */

import React, { useRef, useState, useCallback } from "react"
import { Phone, Printer, Download, ImageDown, Loader2, CalendarDays, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

const BOOKING_URL = "https://autoworxcagayan.com"
const QR_API = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(BOOKING_URL)}&bgcolor=ffffff&color=111827&format=png`

export default function PosterPage() {
    const posterRef = useRef<HTMLDivElement>(null)
    const [isExporting, setIsExporting] = useState(false)

    const handlePrint = useCallback(() => {
        window.print()
    }, [])

    const handleDownloadPDF = useCallback(async () => {
        if (!posterRef.current) return
        setIsExporting(true)
        try {
            const html2canvas = (await import("html2canvas")).default
            const jsPDF = (await import("jspdf")).default
            const canvas = await html2canvas(posterRef.current, {
                scale: 3, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", logging: false,
            })
            const imgData = canvas.toDataURL("image/png")
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
            pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight())
            pdf.save("Autoworx-Appointment-Poster.pdf")
        } catch (err) {
            console.error("PDF Export Error:", err)
            alert("Failed to generate PDF. Please try the Print option instead.")
        } finally {
            setIsExporting(false)
        }
    }, [])

    const handleDownloadImage = useCallback(async () => {
        if (!posterRef.current) return
        setIsExporting(true)
        try {
            const html2canvas = (await import("html2canvas")).default
            const canvas = await html2canvas(posterRef.current, {
                scale: 3, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", logging: false,
            })
            const link = document.createElement("a")
            link.download = "Autoworx-Appointment-Poster.png"
            link.href = canvas.toDataURL("image/png")
            link.click()
        } catch (err) {
            console.error("Image Export Error:", err)
            alert("Failed to generate image. Please try the Print option instead.")
        } finally {
            setIsExporting(false)
        }
    }, [])

    return (
        <div className="min-h-screen bg-neutral-100 flex flex-col items-center py-8 px-4 print:p-0 print:bg-white">

            {/* ─── Admin Toolbar (hidden on print) ─── */}
            <div className="w-full max-w-[820px] mb-6 print:hidden">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-blue-500" />
                            Poster / Signage Generator
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1">
                            Preview then download or print the appointment booking poster.
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 rounded-lg font-semibold">
                            <Printer className="w-4 h-4" /> Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadImage} disabled={isExporting} className="gap-2 rounded-lg font-semibold">
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />} Save PNG
                        </Button>
                        <Button size="sm" onClick={handleDownloadPDF} disabled={isExporting} className="gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-semibold">
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* ─── POSTER CANVAS ─── */}
            <div
                ref={posterRef}
                className="poster-canvas w-full max-w-[794px] bg-white overflow-hidden flex flex-col relative shadow-[0_25px_80px_-12px_rgba(0,0,0,0.25)] print:shadow-none print:max-w-none print:w-full"
                style={{ aspectRatio: "210 / 297" }}
            >

                {/* ══════════ LOGO HEADER ══════════ */}
                <div className="flex items-center justify-between px-10 py-8" style={{ background: "linear-gradient(135deg, #0a1628 0%, #162240 100%)" }}>
                    {/* Left: Autoworx */}
                    <div className="flex items-center gap-4">
                        <img src="/autoworxlogo.png" alt="Autoworx Logo" className="w-14 h-14 object-contain" />
                        <div className="h-10 w-px bg-white/20" />
                        <div className="flex flex-col">
                            <span className="text-white font-black text-xl tracking-tight uppercase leading-none" style={{ fontFamily: "'Oswald', sans-serif" }}>
                                Autoworx
                            </span>
                            <span className="text-cyan-400 text-[9px] font-bold tracking-[0.2em] uppercase mt-1">
                                Repairs &amp; Gen. Merchandise
                            </span>
                        </div>
                    </div>
                    {/* Right: Caltex Delo */}
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.15em]">Official Partner</span>
                            <span className="text-white font-black text-base tracking-tight uppercase leading-none" style={{ fontFamily: "'Oswald', sans-serif" }}>
                                CALTEX Delo
                            </span>
                        </div>
                        <img src="/caltex.png" alt="Caltex Delo" className="w-12 h-12 object-contain" />
                    </div>
                </div>

                {/* thin accent line */}


                {/* ══════════ HEADLINE ══════════ */}
                <div className="flex flex-col items-center pt-10 pb-4 px-8">
                    <h1 className="text-center leading-[0.90]">
                        <span className="block text-[54px] font-black text-[#0a1628] uppercase tracking-[-0.02em]" style={{ fontFamily: "'Oswald', sans-serif" }}>
                            Book Your
                        </span>
                        <span className="block text-[70px] font-black text-blue-500 uppercase tracking-[-0.02em]" style={{ fontFamily: "'Oswald', sans-serif" }}>
                            Appointment
                        </span>
                        <span className="block text-[54px] font-black text-[#0a1628] uppercase tracking-[-0.02em]" style={{ fontFamily: "'Oswald', sans-serif" }}>
                            Here
                        </span>
                    </h1>
                    <div className="w-20 h-1 bg-blue-500 rounded-full mt-4" />
                </div>

                {/* ══════════ STEPS (inline) ══════════ */}
                <div className="px-12 pb-5">
                    <div className="flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-wider">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">1</span>
                        <span className="text-[#0a1628]">Scan QR Code</span>
                        <span className="text-blue-500/50 mx-1">—</span>
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">2</span>
                        <span className="text-[#0a1628]">Visit Website</span>
                        <span className="text-blue-500/50 mx-1">—</span>
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">3</span>
                        <span className="text-[#0a1628]">Book Appointment</span>
                    </div>
                </div>

                {/* ══════════ QR CODE ══════════ */}
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                    <div className="relative">
                        {/* QR frame */}
                        <div className="relative p-3 bg-white rounded-3xl border-[6px] border-blue-600 shadow-xl">
                            <img
                                src={QR_API}
                                alt="Scan to book appointment at autoworxcagayan.com"
                                className="w-52 h-52 rounded-xl"
                                crossOrigin="anonymous"
                            />
                        </div>
                        {/* Badge */}
                        <div className="absolute -top-3 -right-3 bg-blue-600 text-white font-black text-[10px] px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                            Scan Me
                        </div>
                    </div>

                    <div className="mt-5 text-center">
                        <p className="text-neutral-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">
                            Or you can visit
                        </p>
                        <p className="text-[24px] font-black text-blue-600 tracking-tight">
                            autoworxcagayan.com
                        </p>
                    </div>
                </div>

                {/* ══════════ REPAIR ESTIMATE NOTICE ══════════ */}
                <div className="mx-10 mb-5 px-5 py-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-extrabold text-blue-600 uppercase tracking-[0.15em] mb-0.5">
                            Repair Estimate
                        </p>
                        <p className="text-[12px] font-medium text-neutral-600 leading-snug">
                            Book an appointment first for a faster process. A Service Advisor will then provide a detailed repair estimate after inspecting your vehicle.
                        </p>
                    </div>
                </div>

                {/* ══════════ FOOTER ══════════ */}
                <div className="mt-auto px-10 py-6" style={{ background: "linear-gradient(135deg, #0a1628 0%, #162240 100%)" }}>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.15em] mb-0.5">
                                    Service Manager
                                </span>
                                <span className="text-white font-black text-sm leading-tight">
                                    0936-354-9603
                                </span>
                                <span className="text-cyan-400/80 font-semibold text-[10px]">
                                    Paul Suazo
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <div className="flex flex-col min-w-0 text-right">
                                <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.15em] mb-0.5">
                                    Service Advisor
                                </span>
                                <span className="text-white font-black text-sm leading-tight">
                                    0965-918-3394
                                </span>
                                <span className="text-cyan-400/80 font-semibold text-[10px]">
                                    Ryan Christopher Quitos
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-cyan-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Print CSS ─── */}
            <style jsx global>{`
                @media print {
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .poster-canvas {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        max-width: none !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        aspect-ratio: auto !important;
                    }
                    @page {
                        margin: 0;
                        size: A4 portrait;
                    }
                }
            `}</style>
        </div>
    )
}
