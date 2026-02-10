import Link from "next/link"
import { ArrowRight, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-24 animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="relative rounded-2xl bg-primary overflow-hidden animate-slide-up">
          {/* Pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%)] bg-[size:4rem_4rem]" />

          <div className="relative px-6 py-16 sm:px-12 sm:py-20 lg:py-24 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground text-balance">
              Ready to Get Your Vehicle Serviced?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Schedule your appointment today and experience the Autoworx difference.
              Quality repairs, honest service, and fair prices.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto text-base">
                <Link href="/contact">
                  Book Appointment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent">
                <a href="tel:0936-354-9603">
                  <Phone className="mr-2 h-5 w-5" />
                  0936-354-9603
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
