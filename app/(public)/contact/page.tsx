import type { Metadata } from "next"
import { Phone, Mail, MapPin, Clock, Calculator } from "lucide-react"
import { BookingForm } from "@/components/booking/booking-form"
import { COSTING_CONTACT } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Book Appointment | Autoworx Repairs",
  description: "Schedule your automotive repair appointment at Autoworx Repairs. Contact us for engine, transmission, AC, body repairs, and more.",
}

const contactInfo = [
  {
    icon: Phone,
    label: "Phone",
    value: "0936-354-9603",
    href: "tel:0936-354-9603",
  },
  {
    icon: Mail,
    label: "Email",
    value: "autoworxcagayan2025@gmail.com",
    href: "mailto:autoworxcagayan2025@gmail.com",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "BACK OF CETRAMINA BUILDING, ZONE 7 SEPULVIDA DRIVE KAUSWAGAN HIGH WAY ZONE 7 SEPULVIDA DRIVE, Rodolfo N. Pelaez Blvd, Cagayan De Oro City, 9000 Misamis Oriental",
    href: "https://www.google.com/maps/place/Autoworx+Repair+%26+General+Merchandise+Co.+ltd./@8.4925727,124.6294772,17z/data=!3m1!4b1!4m6!3m5!1s0x32fff34fb1b32ba5:0x6a8fdfec5942404f!8m2!3d8.4925674!4d124.6320521!16s%2Fg%2F11q_m2z00_?hl=en&entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon-Sat: 8AM-5PM",
    href: null,
  },
]

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-16 pb-24 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Contact Us</span>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-bold text-foreground text-balance">
              Book Your Appointment
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Ready to get your vehicle serviced? Fill out the form below and we&apos;ll 
              contact you within 24 hours to confirm your appointment.
            </p>
          </div>
        </div>
      </section>

      {/* Form & Contact Info Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <BookingForm />
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {contactInfo.map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{item.label}</div>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                            target={item.label === "Address" ? "_blank" : undefined}
                            rel={item.label === "Address" ? "noopener noreferrer" : undefined}
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span className="font-medium text-foreground">{item.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Costing & Estimation Contact */}
              <div className="p-6 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-foreground">Cost Estimation</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Need a quote or estimate for your repair? Contact our specialist directly.
                </p>
                <div className="p-3 bg-background rounded-lg border border-border">
                  <p className="font-medium text-foreground">{COSTING_CONTACT.name}</p>
                  <a
                    href={`tel:${COSTING_CONTACT.phone.replace(/-/g, "")}`}
                    className="text-primary hover:underline font-mono text-sm"
                  >
                    {COSTING_CONTACT.phone}
                  </a>
                </div>
              </div>

              {/* Emergency Towing */}
              <div className="p-6 bg-primary/10 rounded-xl border border-primary/20">
                <h3 className="font-semibold text-foreground mb-2">24/7 Emergency Towing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Stuck on the road? Our towing service is available around the clock.
                </p>
                <a
                  href="tel:09363549603"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              </div>

              {/* Map */}
              <div className="aspect-[4/3] rounded-xl border border-border overflow-hidden bg-card">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3945.7890487627567!2d124.62945712345!3d8.492567223456789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32fff34fb1b32ba5%3A0x6a8fdfec5942404f!2sAutoworx%20Repair%20%26%20General%20Merchandise%20Co.%20ltd.!5e0!3m2!1sen!2sph!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Autoworx Repairs Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
