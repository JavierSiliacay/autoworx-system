"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, ArrowRight, CheckCircle2 } from "lucide-react"
import { BatteryIcon, CarFrontIcon, DetailingIcon, GearsIcon, TowingIcon, WrenchPistonIcon, OilIcon, SuspensionIcon, ChassisIcon, EngineBlockIcon } from "@/components/icons/automotive-icons"
import { Button } from "@/components/ui/button"

const services = [
  {
    icon: WrenchPistonIcon,
    title: "Mechanical Services",
    description: "Comprehensive mechanical repairs and diagnostics to keep your vehicle running smoothly and safely.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/mechanical.jpg",
    features: ["Complete engine repair", "Transmission service", "Brake system repair", "Clutch replacement", "Differential service", "Drivetrain repairs"],
  },
  {
    icon: OilIcon,
    title: "Preventive Maintenance",
    description: "Regular maintenance services to prevent costly repairs and extend the life of your vehicle.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/maintenance.jpg",
    features: ["Scheduled maintenance", "Fluid checks & changes", "Belt & hose inspection", "Filter replacements", "Tire rotation & balance", "Multi-point inspection"],
  },
  {
    icon: GearsIcon,
    title: "Engine & Transmission",
    description: "Complete engine diagnostics, tune-ups, and transmission services to ensure optimal performance.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/engine.jpg",
    features: ["Engine diagnostics", "Transmission rebuild", "Timing belt replacement", "Oil change & filter", "Fuel system cleaning", "Engine overhaul"],
  },
  {
    icon: SuspensionIcon,
    title: "Under Chassis",
    description: "Comprehensive suspension, steering, and brake services for superior handling and safety.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/chassis.jpg",
    features: ["Brake pad & rotor", "Suspension repair", "Shock & strut", "Wheel alignment", "CV joint & axle", "Steering service"],
  },
  {
    icon: BatteryIcon,
    title: "AC & Electrical",
    description: "Keep cool and powered with our expert AC and electrical system diagnostics and repairs.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/electrical.jpg",
    features: ["AC recharge & repair", "Compressor replacement", "Electrical diagnostics", "Battery service", "Alternator repair", "Wiring repairs"],
  },
  {
    icon: CarFrontIcon,
    title: "Body Repairs & Painting",
    description: "Restore your vehicle's appearance with our professional body work and painting services.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/painting.jpg",
    features: ["Collision repair", "Dent removal", "Scratch repair", "Rust treatment", "Full body painting", "Custom paint jobs"],
  },
  {
    icon: ChassisIcon,
    title: "General Body Repairs & Fabrication",
    description: "Custom fabrication and general body repairs to keep your vehicle structurally sound.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/fabrication.jpg",
    features: ["Welding services", "Custom fabrication", "Frame straightening", "Panel replacement", "Door & hinge repair", "Bumper repair"],
  },
  {
    icon: EngineBlockIcon,
    title: "General Overhauling",
    description: "Complete vehicle overhaul services to restore your car to like-new condition.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/overhaul.jpg",
    features: ["Engine overhaul", "Transmission rebuild", "Complete restoration", "Performance upgrades", "Preventive maintenance", "Multi-point inspection"],
  },
  {
    icon: DetailingIcon,
    title: "Wash Over & Car Detailing",
    description: "Professional cleaning and detailing services to make your vehicle look showroom-ready.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/detailing.jpg",
    features: ["Exterior hand wash", "Interior deep cleaning", "Paint correction", "Ceramic coating", "Leather conditioning", "Engine bay cleaning"],
  },
  {
    icon: TowingIcon,
    title: "24/7 Towing Service",
    description: "Round-the-clock emergency towing and roadside assistance whenever you need help.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/towing.jpg",
    features: ["Emergency towing", "Flatbed service", "Jump start service", "Tire change", "Fuel delivery", "Lockout assistance"],
  },
]

import { motion } from "framer-motion"

export default function ServicesPage() {
  const [feedback, setFeedback] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFeedback() {
      try {
        const res = await fetch("/api/feedback")
        if (res.ok) {
          const data = await res.json()
          setFeedback(data)
        }
      } catch (error) {
        console.error("Error fetching feedback:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFeedback()
  }, [])

  const getServiceRating = (serviceTitle: string) => {
    // Group related mechanical services to share the same rating pool
    const mechanicalGroup = [
      "General Overhauling",
      "Engine & Transmission",
      "Under Chassis",
      "Mechanical Services",
      "Preventive Maintenance"
    ];

    const isMechanical = mechanicalGroup.includes(serviceTitle);

    const serviceFeedback = feedback.filter(f => {
      if (isMechanical) {
        // If it's a mechanical service, pool all feedback from any mechanical category
        return mechanicalGroup.some(mechService => 
          f.service === mechService || 
          mechService.includes(f.service) || 
          f.service.includes(mechService)
        );
      }
      
      // Otherwise, just get feedback specifically for this service
      return f.service === serviceTitle ||
        serviceTitle.includes(f.service) ||
        f.service.includes(serviceTitle);
    });

    if (serviceFeedback.length === 0) return null
    const avg = serviceFeedback.reduce((acc, f) => acc + f.rating, 0) / serviceFeedback.length
    return { average: avg.toFixed(1), count: serviceFeedback.length }
  }

  return (
    <>
      {/* Hero Section */}
      <motion.section 
        className="relative pt-16 pb-24 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div
          className="absolute inset-0 z-0 bg-cover bg-no-repeat transition-transform duration-700"
          style={{ backgroundImage: "url('/servicebackground.jpg')", backgroundPosition: "center 60%" }}
        />
        <div className="absolute inset-0 z-10 bg-black/60" />

        <div className="relative z-20 mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-[0.2em] text-white bg-blue-500/20 backdrop-blur-sm border border-white/10 rounded-full">
              Our Services
            </span>
            <h1 className="mt-2 font-serif text-4xl sm:text-6xl font-black text-white text-balance tracking-tight leading-[1.1]">
              Complete <span className="text-blue-500 italic">Automotive</span> Care Solutions
            </h1>
            <div className="w-24 h-1.5 bg-blue-500 mx-auto mt-8 mb-8 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <p className="mt-4 text-xl text-white/80 leading-relaxed font-light max-w-2xl mx-auto">
              From routine maintenance to major repairs, our certified technicians provide
              comprehensive services to keep your vehicle running at its best.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Services Grid */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const rating = getServiceRating(service.title)
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="group relative p-6 lg:p-8 bg-card rounded-xl border border-border hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
                >
                  {/* Background Image Placeholder - High visibility */}
                  <div 
                    className="absolute inset-0 z-0 opacity-40 transition-all duration-700 bg-cover bg-center group-hover:scale-105 group-hover:opacity-60"
                    style={{ backgroundImage: `url(${service.image})` }}
                  />
                  <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${service.bgColor} ${service.color} shrink-0 shadow-lg shadow-black/20`}>
                        <service.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h2 className={`font-serif text-xl font-bold text-foreground group-hover:text-blue-500 transition-colors`}>
                            {service.title}
                          </h2>
                          {rating && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-lg">
                              <Star className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                              <span className="text-xs font-bold text-blue-500">{rating.average} <span className="opacity-70 font-normal">({rating.count})</span></span>
                            </div>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {service.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all group/btn" asChild>
                      <Link href="/contact" className="flex items-center justify-center gap-2">
                        <span>Inquire Now</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
