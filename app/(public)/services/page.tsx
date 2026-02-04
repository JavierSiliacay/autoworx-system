import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Cog, Car, Thermometer, Paintbrush, Sparkles, Truck, Wrench, Settings, CheckCircle2, Shield, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Services | Autoworx Repairs",
  description: "Complete automotive repair and maintenance services including engine, transmission, AC, electrical, body repairs, detailing, and 24/7 towing.",
}

const services = [
  {
    icon: Shield,
    title: "Mechanical Services",
    description: "Comprehensive mechanical repairs and diagnostics to keep your vehicle running smoothly and safely.",
    features: [
      "Complete engine repair",
      "Transmission service",
      "Brake system repair",
      "Clutch replacement",
      "Differential service",
      "Drivetrain repairs",
    ],
  },
  {
    icon: CalendarCheck,
    title: "Preventive Maintenance",
    description: "Regular maintenance services to prevent costly repairs and extend the life of your vehicle.",
    features: [
      "Scheduled maintenance",
      "Fluid checks & changes",
      "Belt & hose inspection",
      "Filter replacements",
      "Tire rotation & balance",
      "Multi-point inspection",
    ],
  },
  {
    icon: Cog,
    title: "Engine & Transmission",
    description: "Complete engine diagnostics, tune-ups, and transmission services to ensure optimal performance and reliability.",
    features: [
      "Engine diagnostics & repair",
      "Transmission service & rebuild",
      "Timing belt replacement",
      "Oil change & filter service",
      "Fuel system cleaning",
      "Engine overhaul",
    ],
  },
  {
    icon: Car,
    title: "Under Chassis",
    description: "Comprehensive suspension, steering, and brake services for superior handling and safety on the road.",
    features: [
      "Brake pad & rotor replacement",
      "Suspension repair",
      "Shock & strut replacement",
      "Wheel alignment",
      "CV joint & axle repair",
      "Steering system service",
    ],
  },
  {
    icon: Thermometer,
    title: "Air-conditioning & Electrical",
    description: "Keep cool and powered with our expert AC and electrical system diagnostics and repairs.",
    features: [
      "AC recharge & repair",
      "Compressor replacement",
      "Electrical diagnostics",
      "Battery service",
      "Alternator repair",
      "Wiring repairs",
    ],
  },
  {
    icon: Paintbrush,
    title: "Body Repairs & Painting",
    description: "Restore your vehicle's appearance with our professional body work and automotive painting services.",
    features: [
      "Collision repair",
      "Dent removal",
      "Scratch repair",
      "Rust treatment",
      "Full body painting",
      "Custom paint jobs",
    ],
  },
  {
    icon: Wrench,
    title: "General Body Repairs & Fabrication",
    description: "Custom fabrication and general body repairs to keep your vehicle structurally sound and looking great.",
    features: [
      "Welding services",
      "Custom fabrication",
      "Frame straightening",
      "Panel replacement",
      "Door & hinge repair",
      "Bumper repair",
    ],
  },
  {
    icon: Settings,
    title: "General Overhauling",
    description: "Complete vehicle overhaul services to restore your car to like-new condition and performance.",
    features: [
      "Engine overhaul",
      "Transmission rebuild",
      "Complete restoration",
      "Performance upgrades",
      "Preventive maintenance",
      "Multi-point inspection",
    ],
  },
  {
    icon: Sparkles,
    title: "Wash Over & Car Detailing",
    description: "Professional cleaning and detailing services to make your vehicle look showroom-ready.",
    features: [
      "Exterior hand wash",
      "Interior deep cleaning",
      "Paint correction",
      "Ceramic coating",
      "Leather conditioning",
      "Engine bay cleaning",
    ],
  },
  {
    icon: Truck,
    title: "24/7 Car Towing Services",
    description: "Round-the-clock emergency towing and roadside assistance whenever and wherever you need help.",
    features: [
      "Emergency towing",
      "Flatbed service",
      "Jump start service",
      "Tire change",
      "Fuel delivery",
      "Lockout assistance",
    ],
  },
]

export default function ServicesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-16 pb-24 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Our Services</span>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-bold text-foreground text-balance">
              Complete Automotive Care Solutions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              From routine maintenance to major repairs, our certified technicians provide 
              comprehensive services to keep your vehicle running at its best.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="group p-6 lg:p-8 bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
                    <service.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {service.title}
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {service.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Need a Service?
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Contact us today to schedule your appointment or get a quote. 
              Our team is ready to help with all your automotive needs.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Book Appointment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="tel:0936-354-9603">Call 0936-354-9603</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
