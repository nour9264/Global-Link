"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Lock, Workflow, Users, MessageSquare, Shield, Rocket } from "lucide-react"
import { TracingBeam } from "@/components/ui/tracing-beam"
import { ThemeToggle } from "@/components/theme-toggle"
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"
import SpotlightCard from "@/components/ui/spotlight-card"
import { Meteors } from "@/components/ui/meteors"
import { GlobeDemo } from "@/components/globe-demo"
import LaserFlow from "@/components/ui/laser-flow"
import GlareHover from "@/components/ui/glare-hover"
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import SplitText from "@/components/ui/split-text"
import BlurText from "@/components/ui/blur-text"
import TextType from "@/components/ui/text-type"

// Global animation configuration
const ANIMATION_CONFIG = {
  heading: {
    delay: 150,
    duration: 1.2,
  },
  subheading: {
    delay: 80,
    duration: 1.0,
  },
  paragraph: {
    delay: 60,
    duration: 0.8,
  },
}

export default function LandingPage() {
  const [verticalBeamOffset, setVerticalBeamOffset] = useState(0.1)

  useEffect(() => {
    const updateBeamOffset = () => {
      // Only run on client side
      if (typeof window === 'undefined') return

      // Mobile: < 768px (md breakpoint)
      setVerticalBeamOffset(window.innerWidth < 768 ? 0.2 : 0.1)
    }

    // Set initial value
    updateBeamOffset()

    // Update on resize
    window.addEventListener('resize', updateBeamOffset)
    return () => window.removeEventListener('resize', updateBeamOffset)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <main className="flex-1">
        <TracingBeam>
          {/* Hero image - full width */}
          <div className="w-full mb-6 sm:mb-8 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg h-[300px] sm:h-[400px] md:h-[500px] lg:h-[43.75rem]">
            <Image
              src="/images/world-map.png"
              alt="GlobalLink - Connecting the World"
              width={5000}
              height={700}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
            {/* Existing main heading */}
            <div className="text-center">
              <SplitText
                text="Your World, Delivered. Anywhere."
                tag="h1"
                className="mb-6 text-foreground text-balance font-bold leading-tight text-4xl sm:text-5xl md:text-6xl inline-block"
                delay={ANIMATION_CONFIG.heading.delay}
                duration={ANIMATION_CONFIG.heading.duration}
                ease="power3.out"
                splitType="words"
                from={{ opacity: 0, y: 60 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.2}
                rootMargin="-50px"
                textAlign="center"
              />
            </div>

            {/* Existing description */}
            <div className="text-center">
              <SplitText
                text="GlobalLink connects you with a trusted network of travelers for secure, peer-to-peer international delivery. Send or receive items across borders with ease and confidence."
                tag="p"
                className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed inline-block"
                delay={ANIMATION_CONFIG.paragraph.delay}
                duration={ANIMATION_CONFIG.paragraph.duration}
                ease="power3.out"
                splitType="words"
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.2}
                rootMargin="-50px"
                textAlign="center"
              />
            </div>

            {/* Existing CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="/role-selection">
                <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium px-6 sm:px-8 shadow-sm w-full sm:w-auto" size="lg">
                  Sign Up
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="font-medium px-6 sm:px-8 bg-transparent w-full sm:w-auto"
                  size="lg">
                  Log In
                </Button>
              </Link>
            </div>

            {/* New: design-inspired section */}
            <section className="mt-16 sm:mt-20 md:mt-24">
              <div className="space-y-16">
                {/* Globe Demo */}
                <GlobeDemo />

                {/* How It Works Section */}
                <div>
                  <div className="text-center">
                    <SplitText
                      text="How GlobalLink Works"
                      tag="h3"
                      className="text-xl md:text-2xl font-semibold text-foreground mb-3 inline-block"
                      delay={ANIMATION_CONFIG.subheading.delay}
                      duration={ANIMATION_CONFIG.subheading.duration}
                      ease="power3.out"
                      splitType="chars"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      threshold={0.1}
                      rootMargin="-100px"
                      textAlign="center"
                    />
                  </div>
                  <div className="text-center">
                    <SplitText
                      text="Simple steps to connect buyers and travelers worldwide"
                      tag="p"
                      className="text-muted-foreground mb-8 inline-block"
                      delay={ANIMATION_CONFIG.paragraph.delay}
                      duration={ANIMATION_CONFIG.paragraph.duration}
                      ease="power3.out"
                      splitType="words"
                      from={{ opacity: 0, y: 20 }}
                      to={{ opacity: 1, y: 0 }}
                      threshold={0.1}
                      rootMargin="-100px"
                      textAlign="center"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {[
                      {
                        step: "1",
                        title: "Post Your Request",
                        desc: "Buyers create detailed requests for items they need delivered from abroad, specifying origin, destination, and timeline.",
                        Icon: Users
                      },
                      {
                        step: "2",
                        title: "Match with Travelers",
                        desc: "Our intelligent system matches requests with travelers heading to the same destination, ensuring safe and timely delivery.",
                        Icon: Rocket
                      },
                      {
                        step: "3",
                        title: "Track & Complete",
                        desc: "Monitor every step of the journey in real-time, from pickup to final handoff, with secure payment held in escrow.",
                        Icon: Shield
                      },
                    ].map(({ step, title, desc, Icon }) => (
                      <div key={step} className="relative">
                        <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-bold text-lg shadow-lg z-10">
                          {step}
                        </div>
                        <div className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm relative overflow-hidden">
                          <Meteors number={50} className="!opacity-100" />
                          <div className="flex items-center gap-3 mb-3 mt-2 relative z-10">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <SplitText
                              text={title}
                              tag="h4"
                              className="font-semibold text-foreground inline-block"
                              delay={ANIMATION_CONFIG.subheading.delay}
                              duration={ANIMATION_CONFIG.subheading.duration}
                              ease="power3.out"
                              splitType="chars"
                              from={{ opacity: 0, y: 20 }}
                              to={{ opacity: 1, y: 0 }}
                              threshold={0.1}
                              rootMargin="-100px"
                              textAlign="left"
                            />
                          </div>
                          <SplitText
                            text={desc}
                            tag="p"
                            className="text-sm text-muted-foreground leading-relaxed relative z-10 inline-block"
                            delay={ANIMATION_CONFIG.paragraph.delay}
                            duration={ANIMATION_CONFIG.paragraph.duration}
                            ease="power3.out"
                            splitType="words"
                            from={{ opacity: 0, y: 15 }}
                            to={{ opacity: 1, y: 0 }}
                            threshold={0.1}
                            rootMargin="-100px"
                            textAlign="left"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use Cases and Trust & Safety Sections with LaserFlow */}
                <div>
                  {/* LaserFlow Effect */}
                  <div className="absolute inset-x-0 top-403 bottom-10 pointer-events-none z-0">
                    <LaserFlow
                      horizontalBeamOffset={0}
                      verticalBeamOffset={verticalBeamOffset}
                      horizontalSizing={2.5}
                      verticalSizing={20}
                      wispDensity={5}
                      wispSpeed={5.0}
                      wispIntensity={6.0}
                      flowSpeed={0.6}
                      flowStrength={0.25}
                      fogIntensity={0.8}
                      fogScale={0.3}
                      fogFallSpeed={0.6}
                      mouseTiltStrength={0.5}
                      mouseSmoothTime={0.15}
                      decay={1.5}
                      falloffStart={1.5}
                      dpr={undefined}
                      color="#0303ffff"
                    />
                  </div>

                  {/* Use Cases Section */}
                  <div className="relative z-10">
                    <div className="text-center mb-3">
                      <TextType
                        text={["Perfect For Every Need", "Built For Everyone", "Your Needs, Our Priority"]}
                        typingSpeed={75}
                        pauseDuration={2000}
                        deletingSpeed={50}
                        showCursor={true}
                        cursorCharacter="|"
                        className="text-xl md:text-2xl font-semibold text-foreground inline-block"
                        loop={true}
                        startOnVisible={true}
                      />
                    </div>
                    <p className="text-center text-muted-foreground mb-8">From personal items to business essentials, GlobalLink delivers</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {[
                        {
                          title: "International Students",
                          desc: "Send care packages, documents, or specialty items from home. Perfect for students studying abroad who need a taste of home or important paperwork delivered quickly.",
                          Icon: Users
                        },
                        {
                          title: "Small Business Owners",
                          desc: "Source unique products or samples from international markets without expensive shipping. Ideal for entrepreneurs testing new product lines or importing specialty goods.",
                          Icon: Rocket
                        },
                        {
                          title: "Expatriates & Immigrants",
                          desc: "Receive items from your home country that aren't available locally. Stay connected to your culture with authentic products and family heirlooms.",
                          Icon: MessageSquare
                        },
                        {
                          title: "Frequent Travelers",
                          desc: "Earn extra income by utilizing empty luggage space on trips you're already taking. Turn your travel plans into a side hustle while helping others.",
                          Icon: Lock
                        },
                      ].map(({ title, desc, Icon }) => (
                        <GlareHover
                          key={title}
                          width="100%"
                          height="auto"
                          background="transparent"
                          borderRadius="0.75rem"
                          borderColor="hsl(var(--border))"
                          glareColor="#0088cc"
                          glareOpacity={0.2}
                          glareAngle={-30}
                          glareSize={300}
                          transitionDuration={800}
                          playOnce={false}
                          className="bg-card border shadow-sm hover:shadow-md transition-shadow"
                          style={{ padding: '1rem 1.5rem' }}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground">
                              {title}
                            </h4>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {desc}
                          </p>
                        </GlareHover>
                      ))}
                    </div>
                  </div>

                  {/* Trust & Safety Section */}
                  <div className="relative z-10 mt-12 sm:mt-16">
                    <div className="text-center mb-3">
                      <TextType
                        text={["Built on Trust & Safety", "Security First", "Your Protection Matters"]}
                        typingSpeed={75}
                        pauseDuration={2000}
                        deletingSpeed={50}
                        showCursor={true}
                        cursorCharacter="|"
                        className="text-xl md:text-2xl font-semibold text-foreground inline-block"
                        loop={true}
                        startOnVisible={true}
                      />
                    </div>
                    <p className="text-center text-muted-foreground mb-8">Your security is our top priority at every step</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {[
                        {
                          title: "Verified Identities",
                          desc: "All users undergo identity verification to ensure a trusted community of buyers and travelers.",
                          Icon: Shield
                        },
                        {
                          title: "Secure Payments",
                          desc: "Funds held in escrow until successful delivery confirmation from both parties.",
                          Icon: Lock
                        },
                        {
                          title: "Rating System",
                          desc: "Transparent reviews and ratings help you choose reliable partners for every transaction.",
                          Icon: Users
                        },
                        {
                          title: "24/7 Support",
                          desc: "Our dedicated team is always available to assist with any questions or concerns.",
                          Icon: MessageSquare
                        },
                        {
                          title: "Insurance Options",
                          desc: "Optional insurance coverage for high-value items gives you extra peace of mind.",
                          Icon: Shield
                        },
                        {
                          title: "Dispute Resolution",
                          desc: "Fair and efficient process to resolve any issues that may arise during delivery.",
                          Icon: Workflow
                        },
                      ].map(({ title, desc, Icon }) => (
                        <div key={title} className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <h4 className="font-semibold text-foreground">
                              {title}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* End of LaserFlow wrapper */}
                </div>

                {/* Benefits Comparison */}
                <div>
                  <div className="text-center">
                    <BlurText
                      text="Why Choose GlobalLink Over Traditional Shipping?"
                      delay={150}
                      animateBy="words"
                      direction="top"
                      className="text-xl md:text-2xl font-semibold text-foreground mb-3 inline-block"
                    />
                  </div>
                  <div className="text-center">
                    <BlurText
                      text="Compare and see the difference"
                      delay={100}
                      animateBy="words"
                      direction="top"
                      className="text-muted-foreground mb-8 inline-block"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {[
                      {
                        title: "Cost Savings Up To 70%",
                        desc: "Skip expensive international courier fees. Pay only a fraction of traditional shipping costs by connecting directly with travelers who have space available.",
                        Icon: Lock,
                        gradient: "bg-[linear-gradient(110deg,#1e40af,45%,#3b82f6,55%,#1e40af)]"
                      },
                      {
                        title: "Faster Delivery Times",
                        desc: "No customs delays or warehouse stops. Items travel as personal luggage, often arriving days or weeks earlier than standard shipping.",
                        Icon: Rocket,
                        gradient: "bg-[linear-gradient(110deg,#7c3aed,45%,#a78bfa,55%,#7c3aed)]"
                      },
                      {
                        title: "Personal Touch & Care",
                        desc: "Unlike packages tossed in cargo holds, your items are hand-carried by real people who understand their value and importance.",
                        Icon: Users,
                        gradient: "bg-[linear-gradient(110deg,#0891b2,45%,#06b6d4,55%,#0891b2)]"
                      },
                      {
                        title: "Eco-Friendly Solution",
                        desc: "Reduce carbon footprint by utilizing existing travel routes. No additional flights or trucks needed—truly sustainable delivery.",
                        Icon: Shield,
                        gradient: "bg-[linear-gradient(110deg,#059669,45%,#10b981,55%,#059669)]"
                      },
                    ].map(({ title, desc, Icon, gradient }) => (
                      <BackgroundGradient
                        key={title}
                        className="rounded-[22px] p-4 sm:p-6 bg-card dark:bg-card"
                        gradientColors={gradient}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-[#0088cc]/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-[#0088cc]" />
                          </div>
                          <BlurText
                            text={title}
                            delay={100}
                            animateBy="words"
                            direction="top"
                            className="text-lg font-semibold text-foreground inline-block"
                          />
                        </div>
                        <BlurText
                          text={desc}
                          delay={80}
                          animateBy="words"
                          direction="top"
                          className="text-muted-foreground leading-relaxed inline-block"
                        />
                      </BackgroundGradient>
                    ))}
                  </div>
                </div>

                {/* Platform Features */}
                <div className="relative -mx-0">
                  <div className="absolute inset-0 left-[calc(-50vw+50%)] right-[calc(-50vw+50%)] w-screen pointer-events-none">
                    <BackgroundBeamsWithCollision
                      className="!bg-transparent"
                      beamCount={13}
                      initialX={0}
                      translateX={0}
                      initialY="-200px"
                      translateY="1800px"
                      rotate={0}
                      duration={5}
                      delay={0}
                      repeatDelay={0}
                    />
                  </div>

                  <div className="relative z-10 px-4 sm:px-6 md:px-0">
                    <div className="text-center">
                      <BlurText
                        text="Powerful Platform Features"
                        delay={150}
                        animateBy="words"
                        direction="top"
                        className="text-xl md:text-2xl font-semibold text-foreground mb-3 inline-block"
                      />
                    </div>
                    <div className="text-center">
                      <BlurText
                        text="Everything you need in one place"
                        delay={100}
                        animateBy="words"
                        direction="top"
                        className="text-muted-foreground mb-8 inline-block"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      {[
                        {
                          title: "Smart Matching",
                          desc: "AI-powered algorithm pairs requests with the best-fit travelers based on routes, dates, and ratings.",
                          Icon: Workflow,
                          color: "rgba(239, 68, 68, 0.6)" as const // Red
                        },
                        {
                          title: "Live Chat",
                          desc: "Communicate directly with your match in real-time. Coordinate pickup, discuss details, and build trust.",
                          Icon: MessageSquare,
                          color: "rgba(59, 130, 246, 0.6)" as const // Blue
                        },
                        {
                          title: "GPS Tracking",
                          desc: "Track your item's journey in real-time. Know exactly where it is from pickup to final delivery.",
                          Icon: Rocket,
                          color: "rgba(234, 179, 8, 0.6)" as const // Yellow
                        },
                        {
                          title: "Photo Verification",
                          desc: "Upload and verify photos at each step. Visual proof of item condition before, during, and after transit.",
                          Icon: Shield,
                          color: "rgba(34, 197, 94, 0.6)" as const // Green
                        },
                        {
                          title: "Flexible Pricing",
                          desc: "Set your own price or accept offers. Negotiate directly to find a rate that works for both parties.",
                          Icon: Lock,
                          color: "rgba(249, 115, 22, 0.6)" as const // Orange
                        },
                        {
                          title: "Multi-Currency",
                          desc: "Transact in your preferred currency with automatic conversion and competitive exchange rates.",
                          Icon: Workflow,
                          color: "rgba(168, 85, 247, 0.6)" as const // Purple
                        },
                        {
                          title: "Trip Planning",
                          desc: "Travelers can plan routes, manage multiple deliveries, and maximize earnings from a single trip.",
                          Icon: Rocket,
                          color: "rgba(6, 182, 212, 0.6)" as const // Cyan
                        },
                        {
                          title: "Review System",
                          desc: "Build your reputation with verified reviews. See ratings and feedback from past transactions.",
                          Icon: Users,
                          color: "rgba(236, 72, 153, 0.6)" as const // Pink
                        },
                      ].map(({ title, desc, Icon, color }) => (
                        <SpotlightCard key={title} className="!p-4 sm:!p-6" spotlightColor={color}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <BlurText
                              text={title}
                              delay={100}
                              animateBy="words"
                              direction="top"
                              className="font-semibold text-foreground text-sm inline-block"
                            />
                          </div>
                          <BlurText
                            text={desc}
                            delay={80}
                            animateBy="words"
                            direction="top"
                            className="text-xs text-muted-foreground leading-relaxed inline-block"
                          />
                        </SpotlightCard>
                      ))}
                    </div>
                  </div>

                  {/* Testimonials */}
                  <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground text-center mb-3">What Our Community Says</h3>
                    <p className="text-center text-muted-foreground mb-8">Real stories from real users</p>
                    <InfiniteMovingCards
                      items={[
                        {
                          quote: "I was able to get my favorite snacks from home delivered in just 3 days! So much faster and cheaper than traditional shipping. The traveler even sent me photos during the journey.",
                          name: "Sarah M.",
                          title: "International Student"
                        },
                        {
                          quote: "I've made over $500 just by carrying items during my regular business trips. It's effortless extra income and I meet interesting people along the way.",
                          name: "David L.",
                          title: "Frequent Traveler"
                        },
                        {
                          quote: "GlobalLink helped me source unique handmade products from artisans overseas. The cost savings compared to freight shipping means I can offer better prices to my customers.",
                          name: "Priya K.",
                          title: "Small Business Owner"
                        },
                        {
                          quote: "As a parent sending care packages to my daughter studying abroad, GlobalLink has been a lifesaver. Personal items arrive quickly and safely, and the cost is a fraction of traditional shipping.",
                          name: "Michael R.",
                          title: "Parent of International Student"
                        },
                        {
                          quote: "I love the eco-friendly aspect of GlobalLink. Instead of creating new shipping routes, we're using existing travel plans. It's sustainable delivery that actually makes sense.",
                          name: "Emma T.",
                          title: "Environmental Advocate"
                        },
                        {
                          quote: "The platform is incredibly user-friendly. I posted my request and had three travelers offer to help within hours. The chat feature made coordination seamless and the escrow payment gave me peace of mind.",
                          name: "James W.",
                          title: "Tech Professional"
                        },
                      ]}
                      direction="left"
                      speed="slow"
                    />
                  </div>

                  {/* FAQ Section */}
                  <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground text-center mb-3">Frequently Asked Questions</h3>
                    <p className="text-center text-muted-foreground mb-8">Everything you need to know</p>
                    <InfiniteMovingCards
                      items={[
                        {
                          quote: "Absolutely. We verify all user identities, hold payments in escrow until delivery confirmation, and offer optional insurance for high-value items. Our rating system ensures transparency.",
                          name: "Is GlobalLink safe and secure?",
                          title: "Security & Trust"
                        },
                        {
                          quote: "Most personal items are allowed, including clothing, electronics, documents, and food items. Prohibited items include weapons, illegal substances, and hazardous materials.",
                          name: "What items can I send?",
                          title: "Allowed Items"
                        },
                        {
                          quote: "Earnings vary based on route, item size, and negotiation. Travelers typically earn $20-$100+ per delivery. Many travelers make $200-$500 per trip by accepting multiple deliveries.",
                          name: "How much can I earn as a traveler?",
                          title: "Traveler Earnings"
                        },
                        {
                          quote: "Our escrow system protects both parties. If an item is lost or damaged, we have a dispute resolution process. Optional insurance is available for extra protection on valuable items.",
                          name: "What if my item gets lost or damaged?",
                          title: "Protection & Insurance"
                        },
                        {
                          quote: "Items traveling as personal luggage typically face fewer customs issues. However, users are responsible for understanding and complying with customs regulations for their specific items and destinations.",
                          name: "How do customs and duties work?",
                          title: "Customs & Regulations"
                        },
                        {
                          quote: "Yes! Our platform includes real-time GPS tracking, photo verification at each step, and direct chat communication with your traveler for complete visibility throughout the journey.",
                          name: "Can I track my delivery?",
                          title: "Tracking & Visibility"
                        },
                      ]}
                      direction="right"
                      speed="slow"
                    />
                  </div>

                  {/* CTA */}
                  <div className="bg-card rounded-xl sm:rounded-2xl border p-6 sm:p-8 text-center shadow-sm relative z-10">
                    <h4 className="text-2xl md:text-3xl font-bold text-foreground">Ready to Connect Your Global Operations?</h4>
                    <p className="text-muted-foreground mt-3">Join teams using GlobalLink for unified efficiency and growth.</p>
                    <div className="mt-6">
                      <Link href="/role-selection">
                        <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white px-6 shadow-sm w-full sm:w-auto">Get Started Free</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </TracingBeam>
      </main>
    </div>
  )
}
