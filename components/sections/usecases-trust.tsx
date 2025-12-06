"use client";
import React from "react";
import { Users, Rocket, MessageSquare, Lock, Shield, Workflow } from "lucide-react";
import LaserFlow from "@/components/ui/laser-flow";
import { Meteors } from "@/components/ui/meteors";

export default function UseCasesTrustSection() {
  return (
    <section className="relative">
      {/* LaserFlow overlay: shifted down via top offset */}
      <div className="absolute inset-x-0 top-8 md:top-12 bottom-0 pointer-events-none z-0">
        <LaserFlow
          verticalBeamOffset={0.4}
          horizontalBeamOffset={0}
          verticalSizing={1.2}
          horizontalSizing={1.0}
          color="#0088cc"
          flowSpeed={0.8}
          wispDensity={5}
          mouseTiltStrength={0.3}
          fogIntensity={0.4}
        />
      </div>

      {/* Use Cases Section */}
      <div className="relative z-10">
        <h3 className="text-xl md:text-2xl font-semibold text-foreground text-center mb-3">Perfect For Every Need</h3>
        <p className="text-center text-muted-foreground mb-8">From personal items to business essentials, GlobalLink delivers</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              title: "International Students",
              desc:
                "Send care packages, documents, or specialty items from home. Perfect for students studying abroad who need a taste of home or important paperwork delivered quickly.",
              Icon: Users,
            },
            {
              title: "Small Business Owners",
              desc:
                "Source unique products or samples from international markets without expensive shipping. Ideal for entrepreneurs testing new product lines or importing specialty goods.",
              Icon: Rocket,
            },
            {
              title: "Expatriates & Immigrants",
              desc:
                "Receive items from your home country that aren't available locally. Stay connected to your culture with authentic products and family heirlooms.",
              Icon: MessageSquare,
            },
            {
              title: "Frequent Travelers",
              desc:
                "Earn extra income by utilizing empty luggage space on trips you're already taking. Turn your travel plans into a side hustle while helping others.",
              Icon: Lock,
            },
          ].map(({ title, desc, Icon }) => (
            <div key={title} className="bg-card rounded-xl border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">{title}</h4>
              </div>
              <p className="text-muted-foreground leading-relaxed">{desc}</p>
              {/* optional meteors for subtle motion */}
              <Meteors number={12} className="opacity-30" />
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Safety Section */}
      <div className="relative z-10 mt-16">
        <h3 className="text-xl md:text-2xl font-semibold text-foreground text-center mb-3">Built on Trust & Safety</h3>
        <p className="text-center text-muted-foreground mb-8">Your security is our top priority at every step</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Verified Identities",
              desc:
                "All users undergo identity verification to ensure a trusted community of buyers and travelers.",
              Icon: Shield,
            },
            {
              title: "Secure Payments",
              desc:
                "Funds held in escrow until successful delivery confirmation from both parties.",
              Icon: Lock,
            },
            {
              title: "Rating System",
              desc:
                "Transparent reviews and ratings help you choose reliable partners for every transaction.",
              Icon: Users,
            },
            {
              title: "24/7 Support",
              desc:
                "Our dedicated team is always available to assist with any questions or concerns.",
              Icon: MessageSquare,
            },
            {
              title: "Insurance Options",
              desc:
                "Optional insurance coverage for high-value items gives you extra peace of mind.",
              Icon: Shield,
            },
            {
              title: "Dispute Resolution",
              desc:
                "Fair and efficient process to resolve any issues that may arise during delivery.",
              Icon: Workflow,
            },
          ].map(({ title, desc, Icon }) => (
            <div key={title} className="bg-card rounded-xl border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-foreground">{title}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
