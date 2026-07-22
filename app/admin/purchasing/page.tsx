"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ShoppingCart, ArrowLeft, Info, Package, Hammer, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AccountingRestrictionOverlay } from "@/components/admin/accounting-restriction-overlay"

export default function PurchasingPage() {
  return (
    <AccountingRestrictionOverlay moduleName="Purchasing">
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 selection:bg-blue-100 selection:text-blue-900">
      
      <main className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-sm border border-blue-100 p-8 md:p-12 text-center"
        >
          {/* Header Graphic Section */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-10">
            {/* Autoworx Logo */}
            <div className="flex justify-center">
              <Image 
                src="/autoworxlogo.png" 
                alt="Autoworx Logo" 
                width={200} 
                height={66} 
                className="object-contain drop-shadow-sm"
                priority
              />
            </div>

            {/* Divider (only on desktop) */}
            <div className="hidden md:block w-px h-16 bg-blue-100/50"></div>

            {/* Friendly Icon Graphic */}
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse opacity-50"></div>
              <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <ShoppingCart className="w-10 h-10 text-blue-500" />
              </div>
              
              <motion.div 
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 10, scale: 1 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                className="absolute -top-2 -right-2 bg-white rounded-full p-2.5 shadow-sm border border-slate-100"
              >
                <Hammer className="w-5 h-5 text-slate-400" />
              </motion.div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight mb-4">
            Purchasing Inventory
          </h1>
          
          <div className="bg-blue-50 text-blue-800 rounded-2xl p-6 mb-8 max-w-xl mx-auto shadow-inner border border-blue-100/50">
            <div className="flex flex-col items-center gap-3">
              <Clock className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-lg md:text-xl font-medium text-center">
                This inventory is under development phase
              </p>
              <p className="text-blue-600/80 text-sm md:text-base text-center">
                Contact the developer for the updates. We're isti i'm hahahah working hard to bring you a simple, intuitive purchasing experience!
              </p>
            </div>
          </div>

          {/* Simple informative cards (just for visual comfort) */}
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left opacity-70">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-700">Future Capability</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Soon you will be able to easily purchase and track supplies like engine oil, coolant, filters, and other everyday garage necessities directly from here.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <Info className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-700">Easy to Use</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                The purchasing dashboard will be designed specifically with non-techy users in mind. Blue and white, clean, and simple.
              </p>
            </div>
          </div>

        </motion.div>
      </main>

      </div>
    </AccountingRestrictionOverlay>
  )
}
