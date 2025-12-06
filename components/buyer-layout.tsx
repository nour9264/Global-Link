"use client"

import { useState, useEffect, type ReactNode } from "react"
import { ThemeLogo } from "@/components/theme-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn, getAvatarUrl } from "@/lib/utils"
import { Bell, CreditCard, DollarSign, Home, LogOut, MessageSquare, Package, User, Users, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

interface BuyerLayoutProps {
  children: ReactNode
}

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/buyer" },
  { icon: Package, label: "My Requests", href: "/buyer/requests" },
  { icon: Users, label: "Find Travelers", href: "/buyer/find-travelers" },
  { icon: DollarSign, label: "Offers", href: "/buyer/offers" },
  { icon: MessageSquare, label: "Chat", href: "/buyer/chat" },
  { icon: CreditCard, label: "Payment", href: "/buyer/payment" },
  { icon: Bell, label: "Notifications", href: "/buyer/notifications" },
  { icon: User, label: "Profile", href: "/buyer/profile" },
]

export function BuyerLayout({ children }: BuyerLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logged out successfully")
      router.push("/login")
    } catch (error) {
      toast.error("Failed to log out")
    }
  }

  const closeSidebar = () => setSidebarOpen(false)

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U"
    const first = user.firstName?.[0] || ""
    const last = user.lastName?.[0] || ""
    return (first + last).toUpperCase() || "U"
  }

  // Get user display name
  const getUserName = () => {
    if (!user) return "User"
    return `${user.firstName} ${user.lastName}`.trim() || user.email || "User"
  }

  return (
    <div className="h-dvh bg-gray-50 dark:bg-black flex overflow-x-hidden">
      {/* Backdrop Overlay - Mobile/Tablet Only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop (always visible) */}
      <aside className="hidden lg:flex lg:w-52 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <Link href="/buyer">
            <ThemeLogo width={160} height={80} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Log Out Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start gap-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Sidebar - Mobile/Tablet (slide-in drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-label="Mobile navigation"
      >
        {/* Mobile Header with Close Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <Link href="/buyer" onClick={closeSidebar}>
            <ThemeLogo width={140} height={70} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Log Out Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start gap-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4">
            {/* Burger Menu - Mobile/Tablet Only */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Right Side */}
            <div className="flex items-center gap-4 ml-auto">
              <ThemeToggle />
              <Avatar className="w-9 h-9">
                <AvatarImage
                  src={getAvatarUrl(user?.avatarUrl)}
                  alt={`${getUserName()}'s profile picture`}
                />
                <AvatarFallback className="text-xs font-semibold">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{getUserName()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black">{children}</main>

        {/* Footer */}
        <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/company" className="hover:text-gray-900 dark:hover:text-gray-100">
                Company
              </Link>
              <Link href="/support" className="hover:text-gray-900 dark:hover:text-gray-100">
                Support
              </Link>
              <Link href="/legal" className="hover:text-gray-900 dark:hover:text-gray-100">
                Legal
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="https://facebook.com" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Link>
              <Link href="https://twitter.com" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </Link>
              <Link href="https://linkedin.com" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
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
