"use client"

import { useState, useEffect, type ReactNode } from "react"
import { ThemeLogo } from "@/components/theme-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn, getAvatarUrl } from "@/lib/utils"
import { Bell, CreditCard, DollarSign, Home, LogOut, MessageSquare, Package, User, Users, Menu, X, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import "@/styles/dashboard-scroller.css"

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
  { icon: User, label: "Profile", href: "/buyer/profile" },
]

export function BuyerLayout({ children }: BuyerLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
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

            {/* Greeting - Hidden on mobile */}
            <div className="hidden sm:flex flex-1 justify-center">
              <p className="text-lg font-semibold text-foreground">
                Hi Buyer, <span className="text-[#0088cc]">{user?.firstName || "User"}</span>
              </p>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3 ml-auto mr-4 sm:mr-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-800 group">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={getAvatarUrl(user?.avatarUrl)}
                        alt={`${getUserName()}'s profile picture`}
                      />
                      <AvatarFallback className="text-xs font-semibold">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" alignOffset={-8} forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{getUserName()}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/buyer/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-main flex-1 overflow-y-auto bg-gray-50 dark:bg-black">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
