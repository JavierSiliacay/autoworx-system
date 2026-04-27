"use client"

import { ShieldCheck } from "lucide-react"
import { MechanicIcon, GearsIcon, TireIcon, CarFrontIcon } from "@/components/icons/automotive-icons"
import { motion } from "framer-motion"

const features = [
  {
    icon: MechanicIcon,
    title: "Certified Technicians",
    description: "Our team consists of ASE-certified mechanics with years of hands-on experience.",
  },
  {
    icon: GearsIcon,
    title: "Quality Parts",
    description: "We use only OEM and high-quality aftermarket parts backed by warranty.",
  },
  {
    icon: TireIcon,
    title: "Fast Turnaround",
    description: "We respect your time with efficient service and transparent timelines.",
  },
  {
    icon: ShieldCheck,
    title: "Satisfaction Guaranteed",
    description: "Your satisfaction is our priority. We stand behind every repair we make.",
  },
]

export function TrustSection() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Why Choose Us</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground text-balance">
              Quality Service You Can Depend On
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              For over 10 years, Autoworx Repairs has been the trusted choice for vehicle
              owners who demand quality workmanship and honest service. We treat every
              vehicle like it's our own.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div 
                  key={feature.title} 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary shrink-0">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual element */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.95, x: 40 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="aspect-square rounded-2xl bg-secondary border border-border overflow-hidden group relative">
              {/* Background Image with Overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: "url('/10yrsbg.jpg')" }}
              />
              <div className="absolute inset-0 bg-black/60" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative z-10 text-center p-8">
                  <div className="text-7xl font-serif font-bold text-primary drop-shadow-lg">10+</div>
                  <div className="mt-2 text-xl text-white font-medium">Years of Excellence</div>
                  <p className="mt-4 text-white/80 max-w-xs mx-auto text-balance">
                    Serving our community with dedication and expertise since 2015
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-2xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
