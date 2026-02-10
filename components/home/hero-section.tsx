"use client"

import Link from "next/link"
import { Phone, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden animate-fade-in">
      {/* Realistic auto repair shop background with dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1500 ease-out"
        style={{
          backgroundImage: "url('/background-picture.jpg')",
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
          {/* Main heading with entrance animation */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary text-balance leading-tight animate-slide-up">
            Professional Auto Repair
            <span className="block mt-2">You Can Rely On</span>
          </h1>

          {/* Subheading with entrance animation */}
          <p className="mt-6 text-lg sm:text-xl text-white/95 max-w-2xl mx-auto leading-relaxed text-balance animate-slide-up [animation-delay:200ms]">
            Accurate diagnostics, honest recommendations, and quality repairs for all makes and models.
          </p>

          {/* CTA buttons with entrance animation */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up [animation-delay:400ms]">
            <Button size="lg" asChild className="w-full sm:w-auto text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/20 shadow-lg transition-all duration-300 hover:scale-105">
              <Link href="/contact">
                Book Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50 bg-transparent transition-all duration-300 hover:scale-105">
              <a href="tel:0936-354-9603">
                <Phone className="mr-2 h-5 w-5" />
                Call Now
              </a>
            </Button>
          </div>

          {/* Objective paragraph with entrance animation */}
          <div className="mt-12 max-w-3xl mx-auto animate-slide-up [animation-delay:600ms]">
            <p className="text-white/90 text-base leading-relaxed">
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
