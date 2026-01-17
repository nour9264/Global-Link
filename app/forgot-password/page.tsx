"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { ThemeLogo } from "@/components/theme-logo"
import { ThemeToggle } from "@/components/theme-toggle"

type ForgotPasswordStep = "email" | "otp" | "reset"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { forgotPassword, resetPassword, isLoading } = useAuth()

  const [step, setStep] = useState<ForgotPasswordStep>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Request password reset OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!email) {
      setErrors({ email: "Email is required" })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Please enter a valid email address" })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await forgotPassword({ email })
      setOtpSent(true)
      if (response.expiresAt) {
        setOtpExpiresAt(response.expiresAt)
      }
      setStep("otp")
      toast.success("Password reset OTP sent to your email!")
      if (response.otp) {
        // For development/testing - show OTP in console
        console.log("OTP (for testing):", response.otp)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send password reset OTP"
      setErrors({ email: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!otp || otp.length < 6) {
      setErrors({ otp: "Please enter the 6-digit OTP" })
      return
    }

    // Check if OTP expired
    if (otpExpiresAt && new Date(otpExpiresAt) <= new Date()) {
      setErrors({ otp: "OTP has expired. Please request a new one." })
      return
    }

    setStep("reset")
    toast.success("OTP verified!")
  }

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}

    if (!newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await resetPassword({
        email,
        otp,
        newPassword,
        confirmPassword,
      })

      console.log("Reset password result:", result)

      // If we get here, password reset was successful (no error thrown)
      toast.success("Password reset successfully! Please login with your new password.")

      // Clear form state
      setNewPassword("")
      setConfirmPassword("")
      setIsSubmitting(false)

      // Immediately redirect to login (like registration does)
      // Use a small delay to ensure toast shows, then redirect
      setTimeout(() => {
        console.log("Redirecting to login page...")
        try {
          router.push("/login")
        } catch (redirectError) {
          console.error("Router push failed, using window.location:", redirectError)
          window.location.href = "/login"
        }
      }, 800) // 0.8 second delay to show success message
    } catch (err) {
      console.error("Reset password error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to reset password"
      setErrors({ submit: errorMessage })
      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

  const handleBackToEmail = () => {
    setStep("email")
    setOtp("")
    setOtpSent(false)
    setOtpExpiresAt(null)
  }

  const handleBackToOTP = () => {
    setStep("otp")
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#0088cc]/10 to-[#0077b3]/10 dark:from-gray-900 dark:to-gray-950">
      {/* Theme Toggle - Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      {/* Forgot Password card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-2xl dark:shadow-cyan-500/10 p-8 border border-transparent dark:border-gray-800">
          <div className="flex justify-center mb-6">
            <ThemeLogo width={180} height={80} className="h-20 w-auto" />
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {step === "email" && "Forgot Password"}
              {step === "otp" && "Verify OTP"}
              {step === "reset" && "Reset Password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === "email" && "Enter your email address to receive a password reset code"}
              {step === "otp" && "Enter the OTP sent to your email"}
              {step === "reset" && "Enter your new password"}
            </p>
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  required
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium"
                size="lg"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "Sending OTP..." : "Send Reset Code"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="text-[#0088cc] dark:text-cyan-400 hover:underline font-medium">
                  Log in
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToEmail}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Change Email
              </Button>

              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  disabled={isSubmitting || isLoading}
                  required
                  className="text-center text-2xl tracking-widest"
                />
                {errors.otp && <p className="text-sm text-red-600">{errors.otp}</p>}
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium"
                size="lg"
                disabled={isSubmitting || isLoading || otp.length !== 6}
              >
                Verify OTP
              </Button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToOTP}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to OTP
              </Button>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  required
                />
                {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  required
                />
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">
                  {errors.submit}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium"
                size="lg"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

