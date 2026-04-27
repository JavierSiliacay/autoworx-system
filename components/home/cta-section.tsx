"use client"

import Link from "next/link"
import { ArrowRight, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { playORCRReminder } from "@/lib/notifications"

import { motion } from "framer-motion"

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div 
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          {/* Authentic Service Center Background with Robust Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-[center_top] bg-no-repeat transition-transform duration-1000 group-hover:scale-105" 
            style={{ 
              backgroundImage: 'url("/lowerbackground.jpg")',
              filter: 'brightness(0.6)' // <-- ADJUST BRIGHTNESS HERE: 1.0 is original, 0.5 is half brightness, etc.
            }} 
          />
          
          <div className="relative px-6 py-16 sm:px-12 sm:py-20 lg:py-24 text-center z-10">
            {/* Official Partnership Badge */}
            <motion.div 
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/50 border border-white/20 mb-8 backdrop-blur-xl relative overflow-hidden group/badge transition-all hover:bg-black/60 cursor-default"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Caltex Logo Mark */}
              <div className="relative h-5 w-5 flex items-center justify-center">
                <img src="/caltex.png" alt="Caltex" className="h-full w-full object-contain filter drop-shadow-sm" />
              </div>
              
              {/* Vertical Branding Divider */}
              <div className="w-px h-3 bg-white/20" />
              
              {/* Official Status Text */}
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/95">
                Official Service Partner
              </span>

              {/* High-End Metallic Sheen Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/badge:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            </motion.div>

            <motion.h2 
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-balance tracking-tight leading-[1.1] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Ready to Get Your Vehicle Serviced?
            </motion.h2>
            <motion.p 
              className="mt-5 text-lg text-white max-w-2xl mx-auto leading-relaxed font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Schedule your appointment today and experience the Autoworx difference.
              Quality repairs using world-class Caltex Havoline and Delo lubricants.
            </motion.p>

            <motion.div 
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button size="lg" variant="secondary" asChild onClick={playORCRReminder} className="w-full sm:w-auto text-base font-bold bg-white text-[#0047BA] hover:bg-white/95 transition-all hover:scale-105 active:scale-95 px-10 shadow-xl">
                <Link href="/contact">
                  Book Appointment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base border-white/40 text-white hover:bg-white/10 hover:border-white/60 bg-transparent transition-all backdrop-blur-sm px-10">
                <a href="tel:0936-354-9603">
                  <Phone className="mr-2 h-5 w-5" />
                  0936-354-9603
                </a>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
