import { Shield, Award, Clock, ThumbsUp } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Certified Technicians",
    description: "Our team consists of ASE-certified mechanics with years of hands-on experience.",
  },
  {
    icon: Award,
    title: "Quality Parts",
    description: "We use only OEM and high-quality aftermarket parts backed by warranty.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description: "We respect your time with efficient service and transparent timelines.",
  },
  {
    icon: ThumbsUp,
    title: "Satisfaction Guaranteed",
    description: "Your satisfaction is our priority. We stand behind every repair we make.",
  },
]

export function TrustSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div>
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
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary shrink-0">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual element */}
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-secondary border border-border overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%)] bg-[size:4rem_4rem]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-7xl font-serif font-bold text-primary">10+</div>
                  <div className="mt-2 text-xl text-foreground font-medium">Years of Excellence</div>
                  <p className="mt-4 text-muted-foreground max-w-xs">
                    Serving our community with dedication and expertise since 2015
                  </p>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}
