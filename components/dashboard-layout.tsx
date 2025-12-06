"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Package,
  Users,
  MessageSquare,
  CreditCard,
  Bell,
  User,
  Search,
  LogOut,
  Plane,
  PackageOpen,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
  userRole?: "buyer" | "traveler"
}

const buyerSidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "My Requests", href: "/dashboard/requests" },
  { icon: Users, label: "Find Travelers", href: "/dashboard/find-travelers" },
  { icon: MessageSquare, label: "Chat", href: "/dashboard/chat" },
  { icon: CreditCard, label: "Payment", href: "/dashboard/payment" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
]

const travelerSidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard/traveler" },
  { icon: Plane, label: "My Trips", href: "/dashboard/traveler/trips" },
  { icon: PackageOpen, label: "Available Requests", href: "/dashboard/traveler/available-requests" },
  { icon: DollarSign, label: "Offers", href: "/dashboard/traveler/offers" },
  { icon: MessageSquare, label: "Chat", href: "/dashboard/chat" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
]

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  console.log("[v0] DashboardLayout userRole prop:", userRole)
  console.log("[v0] Current pathname:", pathname)
  // </CHANGE>

  const sidebarItems = userRole === "traveler" ? travelerSidebarItems : buyerSidebarItems

  console.log("[v0] Using sidebar items:", userRole === "traveler" ? "traveler" : "buyer")
  // </CHANGE>

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link href={userRole === "traveler" ? "/dashboard/traveler" : "/dashboard"}>
            <Image
              src="/images/globallink-logo.png"
              alt="GlobalLink"
              width={160}
              height={80}
              className="w-full h-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Log Out Button */}
        <div className="p-4 border-t border-gray-200">
          <Button onClick={handleLogout} variant="destructive" className="w-full justify-start gap-2" size="sm">
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-end gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input type="search" placeholder="Search for requests or travelers" className="pl-9 w-64 h-9 text-sm" />
            </div>
            <Avatar className="w-9 h-9">
              <AvatarImage src="/placeholder.svg?height=36&width=36" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/company" className="hover:text-gray-900">
                Company
              </Link>
              <Link href="/support" className="hover:text-gray-900">
                Support
              </Link>
              <Link href="/legal" className="hover:text-gray-900">
                Legal
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="https://facebook.com" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Link>
              <Link href="https://twitter.com" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </Link>
              <Link href="https://linkedin.com" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DashboardLayout
