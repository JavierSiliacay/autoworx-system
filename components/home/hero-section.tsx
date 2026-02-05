"use client"

import Link from "next/link"
import { Phone, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Accent glow - Enhanced blue visibility */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px]" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Trusted by 5,000+ Customers</span>
          </div>

          {/* Main heading */}
          <h1 className={`font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Reliable Auto Repairs
            <span className="block text-primary">You Can Trust</span>
          </h1>

          {/* Subheading */}
          <p className={`mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            Expert diagnostics and quality repairs for all makes and models. 
            Your vehicle deserves the best care from certified professionals.
          </p>

          {/* CTA buttons */}
          <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <Button size="lg" asChild className="w-full sm:w-auto text-base font-semibold group">
              <Link href="/contact">
                Book Appointment
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base bg-primary/10 border-primary/50 hover:bg-primary/20 text-primary font-semibold group">
              <a href="tel:0936-354-9603">
                <Phone className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                Call Now
              </a>
            </Button>
          </div>

          {/* Trust indicators row */}
          <div className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 transition-all duration-1000 delay-800 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {[
              { value: "10+", label: "Years Experience" },
              { value: "5,000+", label: "Happy Customers" },
              { value: "24/7", label: "Towing Service" },
              { value: "100%", label: "Satisfaction" },
            ].map((stat, index) => (
              <div key={stat.label} className="text-center group">
                <div className={`text-3xl sm:text-4xl font-serif font-bold text-primary transition-all duration-500 delay-${index * 100} group-hover:scale-110 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} style={{ animationDelay: `${800 + index * 100}ms` }}>
                  {stat.value}
                </div>
                <div className={`mt-1 text-sm text-muted-foreground transition-all duration-500 delay-${index * 100} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} style={{ animationDelay: `${800 + index * 100}ms` }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
