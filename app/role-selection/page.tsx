import { Package, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Step indicator */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500">Step 1 of 3</p>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl font-bold text-center mb-16 text-gray-900">Join GlobalLink: Choose Your Role</h1>

          {/* Role selection cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Buyer card */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <Package className="w-16 h-16 text-[#0088cc] stroke-[1.5]" />
              </div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">I want to send a package</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed px-4">
                Efficiently send items across the globe. Find reliable travelers heading your way and get your
                deliveries on time.
              </p>
              <Link href="/signup?role=buyer" className="w-full max-w-xs">
                <Button className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium" size="lg">
                  Sign up as a Buyer
                </Button>
              </Link>
            </div>

            {/* Traveler card */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <Plane className="w-16 h-16 text-[#0088cc] stroke-[1.5]" />
              </div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">I can deliver packages</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed px-4">
                Monetize your travels! Offer to deliver items on your existing trips and earn extra income effortlessly.
              </p>
              <Link href="/signup?role=traveler" className="w-full max-w-xs">
                <Button className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium" size="lg">
                  Sign up as a Traveler
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
