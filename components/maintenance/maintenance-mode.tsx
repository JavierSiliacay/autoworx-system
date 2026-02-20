"use client"

import React from "react"
import { Settings, Wrench } from "lucide-react"

export default function MaintenancePage() {
    return (
        <main className="min-h-screen bg-[#0a101d] flex flex-col md:flex-row overflow-hidden font-sans text-white">

            {/* Left Side: Visual / Image Area */}
            <div className="relative w-full md:w-1/2 lg:w-[45%] h-[40vh] md:h-screen flex-shrink-0 bg-black overflow-hidden group">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105"
                    style={{ backgroundImage: 'url("/servicebackground.jpg")' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-[#0a101d]/90 md:to-[#0a101d]" />
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay" />

                {/* Status Badge (Bottom Left on Desktop, Bottom on Mobile) */}
                <div className="absolute bottom-6 left-6 right-6 md:right-auto z-10">
                    <div className="inline-flex items-center gap-3 bg-[#0f172a]/90 backdrop-blur-md border border-white/10 p-3 pr-6 rounded-lg shadow-lg">
                        <div className="p-2 bg-blue-600 rounded-md">
                            <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">SYSTEM STATUS</p>
                            <p className="text-sm font-medium text-white">Fine-tuning the internals</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Content Area */}
            <div className="relative w-full md:w-1/2 lg:w-[55%] flex flex-col justify-center px-6 py-12 md:p-16 lg:p-24 bg-[#0a101d]">

                {/* Top Right Logo Area (Absolute on Desktop) */}
                <div className="absolute top-6 right-6 md:top-10 md:right-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <img
                            src="/autoworxlogo.png"
                            alt="Autoworx Logo"
                            className="w-8 h-8 object-contain"
                        />
                    </div>
                    <span className="font-bold text-lg tracking-tight hidden sm:block">Autoworx Repairs and Gen. Merchandise</span>
                </div>

                <div className="max-w-xl">
                    {/* Maintenance Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-700/50 text-xs font-semibold text-blue-400 mb-8 w-fit">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        MAINTENANCE MODE
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-2 leading-[1.1]">
                        Optimizing Our <br />
                        <span className="text-blue-500">Performance</span>
                    </h1>

                    {/* Description Text */}
                    <p className="mt-6 text-lg text-slate-400 leading-relaxed">
                        The Autoworx Repairs and Gen. Merchandise site is currently under maintenance. We are working to provide you with a better service.
                    </p>

                    {/* Signature */}
                    <div className="mt-8 flex items-center gap-3 text-slate-500 italic">
                        <div className="w-8 h-[1px] bg-blue-600/50"></div>
                        <span>The Developer</span>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="mt-16 md:absolute md:bottom-10 md:right-10 flex items-center gap-4 text-xs font-bold tracking-widest text-slate-500">
                    <div className="text-right">
                        <p className="text-[10px] text-slate-600 uppercase mb-0.5">STATUS</p>
                        <p className="text-slate-300">UNDER CONSTRUCTION</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center border border-white/5 text-blue-500 hover:text-white hover:border-blue-500/50 transition-colors cursor-default">
                        <Settings className="w-5 h-5 animate-spin-slow" />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    form { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
            `}</style>
        </main>
    )
}
