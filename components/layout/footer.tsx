"use client"

import Link from "next/link"
import { Phone, Mail, MapPin, Clock, Wrench } from "lucide-react"
import { playORCRReminder } from "@/lib/notifications"

const services = [
  "Engine & Transmission",
  "Under Chassis",
  "AC & Electrical",
  "Body Repairs",
  "Car Detailing",
  "24/7 Towing",
]

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
]

export function Footer() {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden">
                <img src="/autoworxlogo.png" alt="Autoworx Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight text-foreground">AUTOWORX</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-1">Repairs AND GEN. MERCHANDISE  </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your trusted partner for professional automotive repair and diagnostics. Quality service you can rely on.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Our Services</h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    href="/services"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={() => link.href === "/contact" && playORCRReminder()}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:09363549603"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>0936-354-9603</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:autoworxcagayan2025@gmail.com"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>autoworxcagayan2025@gmail.com</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Zone 7 Sepulvida Street<br />Kauswagan Highway,Cagayan De Oro City</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Mon-Sat: 8AM-5PM<br /></span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Autoworx Repairs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
