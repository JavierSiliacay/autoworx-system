"use client"

import React from "react"
import { QrCode, Phone, MapPin, CheckCircle2, CalendarDays } from "lucide-react"
import { PRODUCTION_URL } from "@/lib/constants"

export default function PosterPage() {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : PRODUCTION_URL

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-10 font-sans">
            {/* Standard Corporate Style Ad Container */}
            <div className="w-full max-w-[700px] bg-white shadow-2xl overflow-hidden rounded-xl border border-gray-200">

                {/* Header - Brand Identity */}
                <div className="bg-[#1a1a1a] p-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img src="/autoworxlogo.png" alt="Autoworx Logo" className="h-14 w-auto" />
                        <div className="flex flex-col">
                            <span className="text-white font-black text-xl tracking-tight leading-none uppercase">Autoworx Repairs</span>
                            <span className="text-cyan-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">and Gen. Merchandise</span>
                        </div>
                    </div>
                    <div className="text-right text-white hidden sm:block">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase mb-1">Professional Service</p>
                        <p className="text-sm font-semibold opacity-80">Digital Appointment System</p>
                    </div>
                </div>

                {/* Main Body - The Message */}
                <div className="p-10 grid md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-6">
                        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                            Fast, Easy & <br />
                            <span className="text-blue-600">Digital Booking.</span>
                        </h1>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Skip the queue! Book your vehicle service in seconds using our new online system. Track your unit's progress in real-time.
                        </p>

                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                Real-time Status Updates
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                Priority Scheduling
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                Digital Service History
                            </li>
                        </ul>
                    </div>

                    {/* QR Code Segment */}
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="bg-white p-3 rounded-lg shadow-md mb-4">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseUrl)}&bgcolor=ffffff&color=000000`}
                                alt="Booking QR Code"
                                className="w-40 h-40"
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Scan QR Code</p>
                            <h2 className="text-lg font-black text-gray-900 uppercase italic">TO BOOK NOW</h2>
                        </div>
                    </div>
                </div>

                {/* Footer - Contact & Location */}
                <div className="bg-gray-50 border-t border-gray-100 p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-50 rounded-full">
                                <Phone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Contact Us</p>
                                <p className="text-sm font-bold text-gray-900">0965-918-3394 | 0936-354-9603</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-50 rounded-full">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Our Location</p>
                                <p className="text-sm font-bold text-gray-900">Zone 7 Sepulvida St. Kauswagan, CDO City</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-500" />
                        <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Open Mon - Sat | 8:00 AM - 5:00 PM</span>
                    </div>
                </div>
            </div>

            {/* Control Panel UI - Hidden on Print */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-full font-bold shadow-2xl transition-all transform active:scale-95 flex items-center gap-3"
                >
                    <QrCode className="w-5 h-5" />
                    Print / Save Image
                </button>
            </div>
        </div>
    )
}
