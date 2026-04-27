import Link from "next/link"

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-secondary/50 animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Logo Section - Left Side */}
          <div className="flex flex-row items-center justify-center md:justify-start gap-6 md:gap-10 animate-slide-up">
            <Link
              href="https://www.facebook.com/groups/2137901033113594"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity shrink-0"
            >
              <img
                src="/at_logo.png?v=1"
                alt="Autotronics Logo"
                className="w-32 sm:w-48 md:w-56 aspect-square object-contain"
              />
            </Link>
            
            <Link 
              href="https://www.ustp.edu.ph/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 hover:opacity-80 transition-opacity"
            >
              <img
                src="/ustp.png"
                alt="USTP Logo"
                className="w-32 sm:w-48 md:w-56 aspect-square object-cover rounded-full bg-white"
              />
            </Link>
          </div>

          {/* Special Thanks Text - Right Side */}
          <div className="space-y-6 animate-slide-up [animation-delay:200ms]">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Special Thanks
              </h2>
              <p className="text-foreground leading-relaxed">
                We would like to extend our sincere gratitude to <span className="font-bold"><span className="text-blue-500">USTP</span> - <span className="text-[#800000]">Autotronics</span></span> for their invaluable partnership and support in the development of this system. Their expertise, collaboration, and unwavering commitment were instrumental in the successful completion of this project.
              </p>
            </div>

            <p className="text-foreground leading-relaxed">
              We would also like to extend our deepest appreciation to <b>Javier Siliacay</b>, the software developer whose tireless coding, technical expertise, and dedication to seamless digital experiences brought this entire system to life.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
