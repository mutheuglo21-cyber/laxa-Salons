"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { Calendar, ShoppingBag, Sparkles, ArrowRight, Crown, Heart } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: Calendar,
      title: "Effortless Booking",
      description: "Reserve your spot with our expert stylists in seconds",
    },
    {
      icon: ShoppingBag,
      title: "Curated Products",
      description: "Shop premium beauty essentials handpicked for you",
    },
    {
      icon: Crown,
      title: "VIP Rewards",
      description: "Earn exclusive perks and rewards with every visit",
    },
    {
      icon: Sparkles,
      title: "Master Stylists",
      description: "Certified professionals dedicated to your glow-up",
    },
  ]

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/elegant-black-woman-with-beautiful-natural-hair-an.jpg" alt="Luxury beauty" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>

        {/* Hero content */}
        <div
          className={`container relative z-10 px-4 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-secondary text-secondary-foreground border-0 px-4 py-2 text-sm font-semibold">
              ✨ Where Beauty Meets Excellence
            </Badge>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-none">
              Your Glow,
              <br />
              <span className="gradient-text">Our Passion</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
              Experience luxury beauty services crafted for melanin-rich skin. Expert care, premium products, and a
              celebration of your natural beauty.
            </p>
            <div className="flex flex-wrap gap-4">
              {user ? (
                <>
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 transition-luxury hover:scale-105"
                    onClick={() => router.push("/appointments/book")}
                  >
                    Book Your Glow-Up
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 transition-luxury hover:scale-105 bg-transparent"
                    onClick={() => router.push("/shop")}
                  >
                    Shop Beauty
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 transition-luxury hover:scale-105"
                    onClick={() => router.push("/auth/signup")}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 transition-luxury hover:scale-105 bg-transparent"
                    onClick={() => router.push("/auth/login")}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose LuxeSalon</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Elevate your beauty routine with services designed for you
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 transition-luxury hover:scale-105 hover:shadow-2xl hover:border-primary/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <Badge className="bg-accent text-accent-foreground border-0">Our Expertise</Badge>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Celebrating Black Beauty in Every Service
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                From protective styles to skincare treatments designed for melanin-rich skin, our expert team
                understands the unique needs of Black hair and beauty. We use premium products that nourish, protect,
                and enhance your natural glow.
              </p>
              <div className="flex gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => router.push("/appointments/book")}
                  className="transition-luxury hover:scale-105"
                >
                  Book Appointment
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/services")}
                  className="transition-luxury hover:scale-105"
                >
                  View Services
                </Button>
              </div>
            </div>
            <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
              <img src="/beautiful-black-woman-getting-professional-hair-st.jpg" alt="Professional styling" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="animate-fade-in-up">
              <div className="text-5xl md:text-6xl font-bold mb-2">10K+</div>
              <div className="text-lg opacity-90">Happy Clients</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="text-5xl md:text-6xl font-bold mb-2">50+</div>
              <div className="text-lg opacity-90">Expert Stylists</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="text-5xl md:text-6xl font-bold mb-2">15+</div>
              <div className="text-lg opacity-90">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto">
          <Card className="relative overflow-hidden border-0 shadow-2xl">
            <div className="absolute inset-0 z-0">
              <img
                src="/luxury-beauty-products-and-cosmetics-with-gold-acc.jpg"
                alt="Beauty products"
                className="w-full h-full object-cover opacity-20"
              />
            </div>
            <CardContent className="relative z-10 py-20 text-center space-y-6">
              <Heart className="h-16 w-16 mx-auto text-primary animate-float" />
              <h2 className="text-4xl md:text-5xl font-bold">Ready for Your Transformation?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Join thousands of satisfied clients who trust us with their beauty journey
              </p>
              <Button
                size="lg"
                className="text-lg px-8 py-6 transition-luxury hover:scale-105"
                onClick={() => router.push(user ? "/appointments/book" : "/auth/signup")}
              >
                {user ? "Book Your Appointment" : "Start Your Journey"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <h3 className="text-2xl font-bold mb-4 gradient-text">LuxeSalon</h3>
              <p className="text-muted-foreground leading-relaxed">
                Celebrating Black beauty with expert care, premium products, and unmatched service.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/appointments/book"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Book Appointment
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                    Shop Products
                  </Link>
                </li>
                <li>
                  <Link href="/loyalty" className="text-muted-foreground hover:text-primary transition-colors">
                    Loyalty Program
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Connect</h3>
              <p className="text-muted-foreground">Follow us for beauty tips, inspiration, and exclusive offers</p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-muted-foreground">
            <p>&copy; 2025 LuxeSalon. Celebrating your beauty, every day.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
