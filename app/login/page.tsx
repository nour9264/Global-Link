"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { ThemeLogo } from "@/components/theme-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, user, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.activeMode === "Buyer") {
        router.push("/buyer")
      } else if (user.activeMode === "Traveler") {
        router.push("/traveler")
      }
    }
  }, [isAuthenticated, user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setIsSubmitting(true)

    try {
      await login({ email, password })
      toast.success("Login successful!")

      // Get updated user from context after login
      // The redirect will happen via useEffect above
      // But we need to wait a moment for state to update
      setTimeout(() => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}")
        if (authUser.activeMode === "Buyer") {
          router.push("/buyer")
        } else if (authUser.activeMode === "Traveler") {
          router.push("/traveler")
        } else {
          // Default to role selection if no active mode
          router.push("/role-selection")
        }
      }, 100)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please check your credentials."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#0088cc]/10 to-[#0077b3]/10 dark:from-gray-900 dark:to-gray-950">
      {/* Theme Toggle - Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-2xl dark:shadow-cyan-500/10 p-8 border border-transparent dark:border-gray-800">
          {/* Logo and Welcome Section - Integrated */}
          <div className="mb-8">
            <div className="flex justify-center mb-3">
              <ThemeLogo width={180} height={60} className="w-auto h-auto" />
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Welcome back! Please enter your credentials to access your account.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">{error}</div>
            )}

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#0088cc] dark:text-cyan-400 hover:underline">
                Forgot Password?
              </Link>
            </div>

            {/* Login button */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-[#0088cc] hover:bg-[#0077b3] dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white font-medium"
                size="lg"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "Logging in..." : "Log In"}
              </Button>
            </div>

            {/* Sign up link */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link href="/role-selection" className="text-[#0088cc] dark:text-cyan-400 hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
