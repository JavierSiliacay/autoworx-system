import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    content: "Autoworx has been maintaining my family's cars for years. Their honesty and quality of work is unmatched. I wouldn't trust anyone else with our vehicles.",
    author: "Arlyn Bitos",
    role: "Local Business Owner",
    rating: 5,
  },
  {
    content: "Had a transmission issue that other shops couldn't diagnose. Autoworx found the problem quickly and fixed it at a fair price. Highly recommend!",
    author: "Johanna Carmela Labusan",
    role: "Professional Reklamador",
    rating: 5,
  },
  {
    content: "The team here goes above and beyond. They explained everything clearly and didn't try to upsell me on unnecessary services. Rare to find these days.",
    author: "Angel Eduria",
    role: "Owner of Toyota Cagayan De Oro",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Testimonials</span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-foreground text-balance">
            What Our Customers Say
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Don&apos;t just take our word for it. Here&apos;s what our satisfied customers have to say about their experience.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-6 bg-card rounded-lg border border-border"
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />
              
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed">{testimonial.content}</p>

              {/* Author */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="font-semibold text-foreground">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
