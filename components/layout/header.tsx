"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Track", href: "/track" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [clickedLink, setClickedLink] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    // Get pending appointments count from localStorage
    const appointments = JSON.parse(localStorage.getItem("appointments") || "[]")
    const pending = appointments.filter((apt: any) => apt.status === "pending").length
    setPendingCount(pending)
  }, [])

  useEffect(() => {
    // Add scroll animation effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (href: string) => {

    setClickedLink(href)
    setTimeout(() => setClickedLink(null), 500)
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border transition-all duration-300 ${isScrolled ? 'bg-background/95 shadow-lg' : 'bg-transparent'
      }`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-lg overflow-hidden">
              <img src="/autoworxlogo.png?v=1" alt="Autoworx Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-primary">AUTOWORX</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-1">Repairs and Gen. Merchandise</span>
            </div>
          </Link>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={`relative text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 group ${clickedLink === item.href ? "scale-90 text-primary" : ""
                }`}
            >
              <span className={`inline-block transition-transform duration-200 ${clickedLink === item.href ? "animate-bounce-once" : "group-hover:-translate-y-0.5"
                }`}>
                {item.name}
              </span>
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${clickedLink === item.href ? "w-full" : "w-0 group-hover:w-full"
                }`} />
              {item.name === "Track" && pendingCount > 0 && (
                <span className="absolute -top-2 -right-3 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-primary rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <a
            href="tel:+1234567890"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>0936-354-9603</span>
          </a>
          <Button asChild className="hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-primary/20">
            <Link href="/contact">Book Appointment</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1 px-4 py-4">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative block py-3 text-base font-medium text-foreground hover:text-primary transition-all duration-200 overflow-hidden ${clickedLink === item.href ? "scale-95" : ""
                  }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  handleNavClick(item.href)
                  setMobileMenuOpen(false)
                }}
              >
                <div className={`flex items-center justify-between transition-all duration-200 ${clickedLink === item.href ? "translate-x-2 text-primary" : ""
                  }`}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-0 h-0.5 bg-primary transition-all duration-300 ${clickedLink === item.href ? "w-4" : ""
                      }`} />
                    {item.name}
                  </span>
                  {item.name === "Track" && pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-primary rounded-full animate-pulse ml-2">
                      {pendingCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            <div className="pt-4 border-t border-border mt-4">
              <a
                href="tel:0936-354-9603"
                className="flex items-center gap-2 py-3 text-base font-medium text-muted-foreground"
              >
                <Phone className="w-5 h-5" />
                <span>0936-354-9603</span>
              </a>
              <Button asChild className="w-full mt-2">
                <Link href="/contact">Book Appointment</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
