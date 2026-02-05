"use client"

import Link from "next/link"
import { Phone, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Realistic auto repair shop background with dark overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/placeholder.jpg')",
          filter: "brightness(0.6)"
        }}
        aria-hidden="true"
      />
      
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.02)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.02)_75%,transparent_75%,transparent)] bg-[size:4rem_4rem]" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main heading */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white text-balance leading-tight">
            Professional Auto Repair
            <span className="block mt-2">You Can Rely On</span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed text-balance">
            Accurate diagnostics, honest recommendations, and quality repairs for all makes and models.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto text-base font-semibold bg-white text-gray-900 hover:bg-gray-100 border border-white/20 shadow-lg">
              <Link href="/contact">
                Book Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base text-white border-white/30 hover:bg-white/10 hover:border-white/50 bg-transparent">
              <a href="tel:0936-354-9603">
                <Phone className="mr-2 h-5 w-5" />
                Call Now
              </a>
            </Button>
          </div>

          {/* Objective paragraph replacing stats */}
          <div className="mt-12 max-w-3xl mx-auto">
            <p className="text-white/80 text-base leading-relaxed">
              We focus on diagnosing problems accurately and performing quality repairs with clear communication and fair recommendations. Our goal is to fix vehicles correctly the first time.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
