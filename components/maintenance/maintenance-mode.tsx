"use client"

import React, { useState, useEffect } from "react"
import { Activity, Cpu, Database, Server, ShieldAlert, Zap, Globe, Lock } from "lucide-react"

export default function MaintenancePage() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) return 0
                return prev + 1
            })
        }, 100)
        return () => clearInterval(interval)
    }, [])

    return (
        <main className="min-h-screen bg-[#050A14] text-cyan-500 font-mono relative overflow-hidden flex flex-col">
            {/* Grid Background Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-transparent to-[#050A14]/90" />

            {/* Header / Top Bar */}
            <header className="relative z-10 w-full p-6 flex justify-between items-start border-b border-cyan-900/30 bg-[#050A14]/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <img
                        src="/autoworxlogo.png"
                        alt="Autoworx Logo"
                        className="w-16 h-16 object-contain opacity-90"
                    />
                    <div>
                        <h1 className="text-xl font-bold tracking-widest text-white uppercase">Autoworx Repairs</h1>
                        <p className="text-xs text-cyan-600 tracking-[0.2em] uppercase">Engineering Excellence</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="flex items-center justify-end gap-2 text-xs text-cyan-600 mb-1">
                        <span className="animate-pulse w-2 h-2 rounded-full bg-amber-500"></span>
                        SERVER STATUS
                    </div>
                    <p className="text-sm font-bold text-cyan-400 tracking-wider">MAINTENANCE_MODE_ACTIVE</p>
                </div>
            </header>

            {/* Main Schematic Content */}
            <div className="flex-1 relative z-10 flex items-center justify-center p-6 md:p-12">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                    {/* Left: Schematic Visual / Wireframe Area */}
                    <div className="relative group">
                        {/* Decorative Corners */}
                        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-cyan-500" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-cyan-500" />
                        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-cyan-500" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-cyan-500" />

                        {/* Schematic Window */}
                        <div className="aspect-square bg-[#0a1120]/80 border border-cyan-900/50 backdrop-blur-md rounded-sm overflow-hidden relative shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                            {/* Grid overlay inside */}
                            <div className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: `linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)`,
                                    backgroundSize: '20px 20px'
                                }}
                            />

                            {/* Central Visual - Wireframe Representation */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Rotating Rings simulating 3D wireframe */}
                                <div className="absolute w-48 h-48 border border-cyan-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                                <div className="absolute w-40 h-40 border border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse] border-dashed" />
                                <div className="absolute w-64 h-64 border border-cyan-500/10 rounded-full animate-[pulse_3s_ease-in-out_infinite]" />

                                {/* Core Icon */}
                                <div className="relative z-10 p-6 bg-cyan-950/30 rounded-full border border-cyan-500/50">
                                    <Cpu size={64} className="text-cyan-400 animate-pulse" />
                                </div>

                                {/* Data floating labels */}
                                <div className="absolute top-[20%] right-[20%] text-[10px] text-cyan-600 bg-[#050A14] px-1 border border-cyan-900">
                                    TORQUE_LIMIT: [OK]
                                </div>
                                <div className="absolute bottom-[20%] left-[20%] text-[10px] text-cyan-600 bg-[#050A14] px-1 border border-cyan-900">
                                    PSI: 42.0
                                </div>
                            </div>

                            {/* Scanning Line */}
                            <div className="absolute inset-x-0 h-[2px] bg-cyan-500/50 shadow-[0_0_10px_#06b6d4] animate-[scan_3s_ease-in-out_infinite]" />
                        </div>
                    </div>

                    {/* Right: Status & Info */}
                    <div className="space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-800/50 text-xs font-medium text-cyan-300 mb-4">
                                <Activity size={14} />
                                <span>TECHNICAL OVERHAUL</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                                UNDER <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">MAINTENANCE</span>
                            </h2>
                            <p className="text-cyan-400/70 leading-relaxed max-w-md">
                                The Autoworx Repairs and Gen. Merchandise site is currently under maintenance. We are working to provide you with a better service.
                            </p>
                            <div className="mt-4 text-cyan-500/50 text-sm italic">
                                &mdash; The Developer
                            </div>
                        </div>

                        {/* System Diagnostics Panel */}
                        <div className="bg-[#0B1526]/50 border border-cyan-900/50 rounded-lg p-6 space-y-4">
                            <div className="flex justify-between items-center border-b border-cyan-900/30 pb-2 mb-2">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Diagnostics</h3>
                                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">LIVE_FEED</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2 text-cyan-300/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                        Engine Core:
                                    </div>
                                    <span className="text-cyan-400 font-bold">UPGRADING</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2 text-cyan-300/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse delay-75" />
                                        Transmission Modules:
                                    </div>
                                    <span className="text-blue-400 font-bold">OPTIMIZING</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2 text-cyan-300/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse delay-150" />
                                        System Integrity:
                                    </div>
                                    <span className="text-emerald-400 font-bold">92%</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4 pt-4 border-t border-cyan-900/30">
                                <div className="flex justify-between text-xs mb-1 text-cyan-500">
                                    <span>OVERALL PROGRESS</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-cyan-950 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all duration-100 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] uppercase tracking-wider text-xs">
                                Notify Me
                            </button>
                            <span className="text-cyan-600">
                                Expected downtime: <span className="text-white font-bold">~45 minutes</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Status Bar */}
            <footer className="relative z-10 w-full p-4 border-t border-cyan-900/30 bg-[#050A14] text-[10px] text-cyan-700 uppercase tracking-widest flex justify-between items-center">
                <div className="flex gap-6">
                    <div>
                        <span className="text-cyan-900 block mb-0.5">STATUS</span>
                        <span className="text-cyan-400">AUTOWORX_V2.4.0</span>
                    </div>
                    <div>
                        <span className="text-cyan-900 block mb-0.5">ENCRYPTED</span>
                        <span className="text-cyan-400">AES-256_ACTIVE</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:inline">2024 AUTOWORX REPAIRS</span>
                    <Globe size={14} className="text-cyan-800" />
                </div>
            </footer>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </main>
    )
}
