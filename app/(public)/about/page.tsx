"use client"

import Link from "next/link"
import Image from "next/image"
import React from "react"
import { ArrowRight, ShieldCheck, Heart } from "lucide-react"
import { MechanicIcon, WrenchPistonIcon, CarFrontIcon, TireIcon, DiagnosticsIcon, ChassisIcon } from "@/components/icons/automotive-icons"
import { Button } from "@/components/ui/button"
import { DeveloperForm } from "@/components/developer/developer-form"
import { DonationQR } from "@/components/developer/donation-qr"
import { motion } from "framer-motion"

const values = [
  {
    icon: MechanicIcon,
    title: "Integrity",
    description: "We believe in honest assessments and fair pricing. No hidden fees, no unnecessary repairs.",
  },
  {
    icon: WrenchPistonIcon,
    title: "Excellence",
    description: "We hold ourselves to the highest standards in every repair and service we perform.",
  },
  {
    icon: CarFrontIcon,
    title: "Community",
    description: "We're more than a business - we're neighbors committed to serving our community.",
  },
  {
    icon: ChassisIcon,
    title: "Care",
    description: "We treat every vehicle as if it were our own, with attention to detail and genuine care.",
  },
]

const milestones = [
  { year: "2015", event: "Autoworx Repairs founded with a small team of 3 technicians" },
  { year: "2017", event: "Expanded facility to include dedicated body shop and paint booth" },
  { year: "2019", event: "Achieved ASE Blue Seal certification for excellence" },
  { year: "2021", event: "Launched 24/7 towing and roadside assistance service" },
  { year: "2024", event: "Modernized with advanced diagnostic equipment" },
  { year: "2025", event: "Celebrating 10 years of service and 5,000+ satisfied customers" },
]

const team = [
  {
    name: "Carel Lacapag (SOL)",
    role: "Chief Mechanic 1",
    experience: "20+ years",
    specialty: "Engine & Transmission",
  },
  {
    name: "Junrick Magallanes (JunMags)",
    role: "Senior Mechanic",
    experience: "15+ years",
    specialty: "Transmission & Engine",
  },
  {
    name: "James Bantasan",
    role: "Junior Mechanic",
    experience: "8+ years",
    specialty: "General Repairs",
  },
  {
    name: "Jay Paderanga",
    role: "Junior Mechanic",
    experience: "7+ years",
    specialty: "General Repairs",
  },
  {
    name: "Candelario Galamiton (JunGals)",
    role: "Electronic Technician",
    experience: "10+ years",
    specialty: "Electrical Systems",
  },
  {
    name: "Ryan Christopher Quitos",
    role: "Service Advisor",
    experience: "12+ years",
    specialty: "Customer Service",
  },
  {
    name: "Sincer Hycer Cabaneles",
    role: "Checklister & Parts In-Charge",
    experience: "6+ years",
    specialty: "Parts Management",
  },
  {
    name: "Sir Primo",
    role: "Mechanical Supervisor",
    experience: "22+ years",
    specialty: "Mechanical Department",
  },
  {
    name: "Jarry Ruelo",
    role: "Aircon Technician",
    experience: "9+ years",
    specialty: "AC Systems",
  },
  {
    name: "Paul Suazo",
    role: "Service Manager",
    experience: "14+ years",
    specialty: "Service Management",
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <motion.section 
        className="relative pt-16 pb-24 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: "url('/aboutbackground.jpg')",
            backgroundPosition: "center 50%"
          }}
        />
        <div className="absolute inset-0 z-10 bg-black/60" />

        <div className="relative z-20 mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-[0.2em] text-white bg-primary/20 backdrop-blur-sm border border-white/10 rounded-full">
              About Us
            </span>
            <h1 className="mt-2 font-serif text-4xl sm:text-6xl font-black text-white text-balance tracking-tight leading-[1.1]">
              10 Years of Trusted <span className="text-primary italic">Automotive</span> Service
            </h1>
            <div className="w-24 h-1.5 bg-primary mx-auto mt-8 mb-8 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            <p className="mt-4 text-xl text-white/80 leading-relaxed font-light max-w-2xl mx-auto">
              Since 2015, Autoworx Repairs has been the go-to destination for vehicle owners
              who demand quality workmanship, honest service, and fair prices.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Story Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Our Story</span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground text-balance">
                Built on Trust, Driven by Passion
              </h2>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Autoworx Repairs was founded by Alfred Agbong, a lifelong automotive enthusiast
                  who believed that every vehicle owner deserves honest, high-quality service at
                  fair prices. What started as a small three-bay garage has grown into a
                  full-service automotive center serving thousands of customers.
                </p>
                <p>
                  Our growth has been built on a simple principle: treat every customer like
                  family and every vehicle like it&apos;s our own. This philosophy has earned us the
                  trust of our community and countless repeat customers who rely on us for all
                  their automotive needs.
                </p>
                <p>
                  Today, our team of Services & Repairs-certified technicians combines decades of experience
                  with the latest diagnostic technology to handle everything from routine
                  maintenance to complex repairs. We&apos;re proud to be a cornerstone of our
                  community and look forward to serving you for years to come.
                </p>
              </div>
            </motion.div>

            {/* Visual Stats */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="p-6 bg-card rounded-xl border border-border text-center">
                <div className="text-4xl font-serif font-bold text-primary">10+</div>
                <div className="mt-1 text-sm text-muted-foreground">Years in Business</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="p-6 bg-card rounded-xl border border-border text-center">
                <div className="text-4xl font-serif font-bold text-primary">5,000+</div>
                <div className="mt-1 text-sm text-muted-foreground">Happy Customers</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="p-6 bg-card rounded-xl border border-border text-center">
                <div className="text-4xl font-serif font-bold text-primary">15+</div>
                <div className="mt-1 text-sm text-muted-foreground">Expert Technicians</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="p-6 bg-card rounded-xl border border-border text-center">
                <div className="text-4xl font-serif font-bold text-primary">24/7</div>
                <div className="mt-1 text-sm text-muted-foreground">Towing Service</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div 
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Our Values</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground">
              What We Stand For
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="p-6 bg-card rounded-xl border border-border text-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-xl bg-primary/10 text-primary">
                  <value.icon className="w-7 h-7" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div 
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Our Journey</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Milestones Along the Way
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <motion.div 
                className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2 origin-top" 
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1, ease: "easeOut" }}
              />

              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className={`relative flex items-start gap-6 mb-8 last:mb-0 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"} hidden md:block`}>
                    <div className="inline-block p-4 bg-card rounded-lg border border-border">
                      <div className="font-serif font-bold text-primary">{milestone.year}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{milestone.event}</div>
                    </div>
                  </div>

                  {/* Dot */}
                  <motion.div 
                    className="absolute left-4 md:left-1/2 w-3 h-3 bg-primary rounded-full -translate-x-1/2 mt-5" 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.15 + 0.2 }}
                  />

                  {/* Mobile view */}
                  <div className="flex-1 ml-8 md:hidden">
                    <div className="p-4 bg-card rounded-lg border border-border">
                      <div className="font-serif font-bold text-primary">{milestone.year}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{milestone.event}</div>
                    </div>
                  </div>

                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div 
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Our Team</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Meet the Experts
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our certified technicians bring decades of combined experience to every job.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                className="p-6 bg-card rounded-xl border border-border"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-secondary text-primary">
                  <MechanicIcon className="w-8 h-8" />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <div className="text-sm text-primary">{member.role}</div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <TireIcon className="w-4 h-4" />
                      <span>{member.experience}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{member.specialty}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="mt-12 p-6 bg-card rounded-xl border border-border text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-muted-foreground">
              For more concerns or inquiries, kindly look for <span className="font-semibold text-foreground">Paul Suazo</span> (Service Manager).
            </p>
          </motion.div>
        </div>
      </section>

      {/* Developer Support Section */}
      <section className="py-24 bg-primary/5 border-t border-primary/10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Recommendation Form */}
            <motion.div 
              className="bg-card p-8 rounded-2xl border border-border shadow-sm"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DiagnosticsIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground font-serif">Support the Developer</h2>
                  <p className="text-sm text-muted-foreground">Help us build the future of Autoworx Digital</p>
                </div>
              </div>

              <DeveloperForm />
            </motion.div>

            {/* Donation QR Section */}
            <div className="space-y-6">
              <motion.div 
                className="p-8 bg-blue-600 rounded-2xl text-white shadow-lg overflow-hidden relative"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Heart className="w-32 h-32 rotate-12" />
                </div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">Buy the Dev a Coffee ☕</h3>
                  <p className="text-blue-100 mb-8 leading-relaxed">
                    Autoworx Digital is built with passion to modernize automotive services.
                    If you love what we&apos;re building, feel free to show some appreciation!
                    Your support helps us keep improving the platform for everyone.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-8 items-center bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
                    <DonationQR />
                    <div className="flex-1 space-y-4 text-center sm:text-left">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-blue-200 font-bold">Primary Method</p>
                        <p className="text-xl font-bold">GCash (Philippines)</p>
                      </div>
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-sm italic text-blue-100">
                          &quot;Every small contribution fuels our late-night coding sessions!&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="p-6 border border-dashed border-primary/30 rounded-xl bg-primary/5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <p className="text-sm text-center text-muted-foreground italic">
                  Looking for business inquiries or partnerships? <Link href="/contact" className="text-primary font-bold hover:underline">Contact us here</Link>.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

