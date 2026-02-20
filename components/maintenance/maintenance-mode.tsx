"use client"

import React from "react"
import { Cog } from "lucide-react"

export default function MaintenancePage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden font-sans">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse duration-[4000ms]" />

            {/* Floating Gear Icons for Visual Interest */}
            <div className="absolute top-[20%] right-[15%] text-primary/10 animate-spin transition-all duration-[10000ms]">
                <Cog size={120} />
            </div>
            <div className="absolute bottom-[15%] left-[10%] text-blue-500/10 animate-spin-reverse transition-all duration-[15000ms]">
                <Cog size={80} />
            </div>

            <div className="max-w-xl w-full px-6 py-12 relative z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2rem] shadow-2xl text-center space-y-8">

                    {/* Brand Logo / Identity Area */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-24 h-24 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
                            <img
                                src="/autoworxlogo.png"
                                alt="Autoworx Logo"
                                className="w-20 h-20 object-contain animate-bounce"
                            />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
                            Autoworx Repairs
                        </h1>
                        <div className="h-[2px] w-12 bg-primary/50 rounded-full" />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-tight">
                            Maintenance Mode
                        </h2>
                        <p className="text-lg text-gray-400 leading-relaxed font-medium">
                            The Autoworx Repairs and Gen. Merchandise site is currently under maintenance. We are working to provide you with a better service.
                        </p>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-center gap-2 text-white/50 text-sm italic">
                            &mdash; The Developer
                        </div>
                    </div>

                    {/* Micro-animation status bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-8">
                        <div className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 w-[60%] rounded-full animate-loader shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                    </div>
                </div>

                {/* Support Info */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Need urgent assistance? Call us at <span className="text-primary">0936-354-9603</span>
                    </p>
                </div>
            </div>

            <style jsx global>{`
        @keyframes loader {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-loader {
          animation: loader 3s infinite ease-in-out;
        }
        @keyframes spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
      `}</style>
        </main>
    )
}
