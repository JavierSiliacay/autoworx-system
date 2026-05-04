"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GearsIcon, SuspensionIcon, BatteryIcon, CarFrontIcon, TowingIcon, DetailingIcon } from "@/components/icons/automotive-icons"
import { motion } from "framer-motion"

const services = [
  {
    icon: GearsIcon,
    title: "Engine & Transmission",
    description: "Complete engine diagnostics, repairs, and transmission services to keep your vehicle running smoothly.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/engine.jpg"
  },
  {
    icon: SuspensionIcon,
    title: "Under Chassis",
    description: "Suspension, steering, brakes, and drivetrain repairs for optimal handling and safety.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/chassis.jpg"
  },
  {
    icon: BatteryIcon,
    title: "AC & Electrical",
    description: "Air conditioning repairs, electrical diagnostics, battery service, and wiring repairs.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/electrical.jpg"
  },
  {
    icon: CarFrontIcon,
    title: "Body Repairs & Painting",
    description: "Collision repair, dent removal, rust treatment, and professional automotive painting.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/painting.jpg"
  },
  {
    icon: DetailingIcon,
    title: "Car Detailing",
    description: "Interior and exterior detailing, wash services, and paint protection treatments.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/detailing.jpg"
  },
  {
    icon: TowingIcon,
    title: "24/7 Towing",
    description: "Round-the-clock emergency towing and roadside assistance when you need it most.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    image: "/services/towing.jpg"
  },
]

// All 16 car brand logos from /public/carbrands/
const carBrands = [
  "chery", "chevrolet", "ford", "foton", "gac", "geely",
  "honda", "hyundai", "isuzu", "kia", "mazda", "mg",
  "mitsubishi", "nissan", "suzuki", "toyota",
]

export function ServicesOverview() {
  return (
    <section className="py-24 bg-[#0a0c10] overflow-hidden relative">

      {/* ── Car-brand logos marquee — absolute background behind header text ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[260px] flex items-center overflow-hidden pointer-events-none select-none"
      >
        {/* Left edge fade-out */}
        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#0a0c10] to-transparent z-10" />
        {/* Right edge fade-out */}
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#0a0c10] to-transparent z-10" />

        {/*
          Scrolling track:
          - Original set + exact duplicate = 32 logos total
          - Animation moves -50% (exactly one full set width) → seamless loop
        */}
        <div className="flex animate-marquee-left">
          {/* Primary set */}
          {carBrands.map((brand) => (
            <div
              key={`a-${brand}`}
              className="flex-shrink-0 w-[100px] h-[56px] mx-10 flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/carbrands/${brand}.png`}
                alt=""
                draggable={false}
                className="w-full h-full object-contain opacity-[0.18]"
              />
            </div>
          ))}
          {/* Duplicate set — keeps the loop gapless */}
          {carBrands.map((brand) => (
            <div
              key={`b-${brand}`}
              className="flex-shrink-0 w-[100px] h-[56px] mx-10 flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/carbrands/${brand}.png`}
                alt=""
                draggable={false}
                className="w-full h-full object-contain opacity-[0.18]"
              />
            </div>
          ))}
        </div>
      </div>
      {/* ── End car-brand marquee ── */}

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section header — sits on top of the marquee via z-10 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500 mb-4 block">WHAT WE DO</span>
          <h2 className="mt-2 text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Complete Automotive Care
          </h2>
          <p className="mt-6 text-zinc-400 leading-relaxed text-balance">
            From routine maintenance to major repairs, we provide comprehensive services to keep your
            vehicle in peak condition.
          </p>
        </motion.div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link
                href="/services"
                className="group relative p-6 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-blue-500/50 transition-all duration-500 overflow-hidden block h-full"
              >
                {/* Background Image Layer */}
                <div
                  className="absolute inset-0 z-0 opacity-35 transition-all duration-1000 bg-cover bg-center group-hover:scale-110 group-hover:opacity-50"
                  style={{ backgroundImage: `url(${service.image})` }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                <div className="relative z-10 flex items-start gap-4 h-full">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${service.bgColor} ${service.color} shrink-0 transition-transform duration-500 group-hover:scale-110`}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                      {service.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-blue-500 font-bold hover:text-white transition-all duration-300 group"
          >
            <span>View All Services</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
