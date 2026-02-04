import Link from "next/link"

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Logo Section - Left Side */}
          <div className="flex justify-center md:justify-start">
            <Link
              href="https://www.facebook.com/groups/2137901033113594"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            ><center>
              <img
                src="/at_logo.png?v=1"
                alt="Autotronics Logo"
                className="h-70 w-auto object-contain"
              /></center>
            </Link>
          </div>

          {/* Special Thanks Text - Right Side */}
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Special Thanks
              </h2>
              <p className="text-foreground leading-relaxed">
                We would like to extend our sincere gratitude to Autotronics for their invaluable partnership and support in the development of this system. Their expertise, collaboration, and unwavering commitment were instrumental in the successful completion of this project.
              </p>
            </div>

            <p className="text-foreground leading-relaxed">
              We would also like to express a special and heartfelt thanks to <b>Javier Siliacay</b>, whose dedication, technical expertise, and innovative approach led to the successful design and development of this system.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
