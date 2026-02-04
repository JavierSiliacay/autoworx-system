import Link from "next/link"
import { ArrowRight, Cog, Car, Thermometer, Paintbrush, Sparkles, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"

const services = [
  {
    icon: Cog,
    title: "Engine & Transmission",
    description: "Complete engine diagnostics, repairs, and transmission services to keep your vehicle running smoothly.",
  },
  {
    icon: Car,
    title: "Under Chassis",
    description: "Suspension, steering, brakes, and drivetrain repairs for optimal handling and safety.",
  },
  {
    icon: Thermometer,
    title: "AC & Electrical",
    description: "Air conditioning repairs, electrical diagnostics, battery service, and wiring repairs.",
  },
  {
    icon: Paintbrush,
    title: "Body Repairs & Painting",
    description: "Collision repair, dent removal, rust treatment, and professional automotive painting.",
  },
  {
    icon: Sparkles,
    title: "Car Detailing",
    description: "Interior and exterior detailing, wash services, and paint protection treatments.",
  },
  {
    icon: Truck,
    title: "24/7 Towing",
    description: "Round-the-clock emergency towing and roadside assistance when you need it most.",
  },
]

export function ServicesOverview() {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">What We Do</span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Complete Automotive Care
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            From routine maintenance to major repairs, we provide comprehensive services 
            to keep your vehicle in peak condition.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group relative p-6 bg-card rounded-lg border border-border hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 text-primary shrink-0 group-hover:bg-primary/30">
                  <service.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button variant="outline" size="lg" asChild className="border-primary/50 hover:bg-primary/10 bg-transparent">
            <Link href="/services" className="text-primary font-semibold">
              View All Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
