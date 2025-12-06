"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Upload, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { CountrySelector } from "@/components/country-selector"
import { PhoneInput } from "@/components/phone-input"
import Image from "next/image"

type SignupStep = "email" | "otp" | "details"

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const role = searchParams.get("role") || "buyer"
  const { sendOTP, registerBuyer, registerTraveler, isLoading } = useAuth()

  const [step, setStep] = useState<SignupStep>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null)

  // Form data
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  
  // Traveler-specific image fields
  const [identityCardImage, setIdentityCardImage] = useState<File | null>(null)
  const [identityCardImagePreview, setIdentityCardImagePreview] = useState<string | null>(null)
  const [passportImage, setPassportImage] = useState<File | null>(null)
  const [passportImagePreview, setPassportImagePreview] = useState<string | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Send OTP
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

    try {
      const response = await sendOTP({ email })
      setOtpSent(true)
      setOtpExpiresAt(response.expiresAt)
      setStep("otp")
      toast.success("OTP sent to your email!")
      if (response.otp) {
        // For development/testing - show OTP in console
        console.log("OTP (for testing):", response.otp)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send OTP"
      setErrors({ email: errorMessage })
      toast.error(errorMessage)
    }
  }

  // Step 2: Verify OTP and proceed
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

    setStep("details")
    toast.success("OTP verified!")
  }

  // Step 3: Complete registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}

    if (!firstName.trim()) newErrors.firstName = "First name is required"
    if (!lastName.trim()) newErrors.lastName = "Last name is required"
    if (!password) newErrors.password = "Password is required"
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters"
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    if (!country.trim()) newErrors.country = "Country is required"
    if (!city.trim()) newErrors.city = "City is required"
    
    // Address is optional for traveler but required for buyer
    if (role === "buyer" && !address.trim()) {
      newErrors.address = "Address is required"
    }
    
    // Image validation
    if (profileImage && profileImage.size > 5 * 1024 * 1024) {
      newErrors.profileImage = "Image size must be less than 5MB"
    }
    
    // Traveler-specific required fields
    if (role === "traveler") {
      if (!identityCardImage) {
        newErrors.identityCardImage = "Identity card image is required"
      } else if (identityCardImage.size > 5 * 1024 * 1024) {
        newErrors.identityCardImage = "Identity card image must be less than 5MB"
      }
      
      if (!profileImage) {
        newErrors.userPhoto = "User photo is required"
      } else if (profileImage.size > 5 * 1024 * 1024) {
        newErrors.userPhoto = "User photo must be less than 5MB"
      }
      
      if (passportImage && passportImage.size > 5 * 1024 * 1024) {
        newErrors.passportImage = "Passport image must be less than 5MB"
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      if (role === "buyer") {
        const registrationData = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email,
          password,
          confirmPassword,
          phoneNumber: phoneNumber.trim() || undefined,
          address: address.trim(),
          city: city.trim(),
          country: country.trim(),
          profileImage: profileImage || undefined,
          otp,
        }
        
        await registerBuyer(registrationData)
        
        // If profile image was uploaded, store it temporarily until we can upload it separately
        if (profileImage && typeof window !== "undefined") {
          const reader = new FileReader()
          reader.onloadend = () => {
            // Store the image data URL in localStorage temporarily
            localStorage.setItem("userProfileImage", reader.result as string)
          }
          reader.readAsDataURL(profileImage)
        }
        
        toast.success("Buyer account created successfully!")
        router.push("/buyer")
      } else {
        // Traveler registration with all required fields
        const registrationData = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email,
          password,
          confirmPassword,
          phoneNumber: phoneNumber.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim(),
          country: country.trim(),
          userPhoto: profileImage || undefined, // Maps to UserPhoto in API
          identityCardImage: identityCardImage || undefined, // Required for traveler
          passportImage: passportImage || undefined, // Optional for traveler
          otp,
        }
        
        await registerTraveler(registrationData)
        
        // If profile image was uploaded, store it temporarily
        if (profileImage && typeof window !== "undefined") {
          const reader = new FileReader()
          reader.onloadend = () => {
            localStorage.setItem("userProfileImage", reader.result as string)
          }
          reader.readAsDataURL(profileImage)
        }
        
        toast.success("Traveler account created successfully!")
        router.push("/traveler")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed"
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ profileImage: "Image size must be less than 5MB" })
        return
      }

      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setErrors({ ...errors, profileImage: "" })
    }
  }

  const handleIdentityCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ identityCardImage: "Image size must be less than 5MB" })
        return
      }

      setIdentityCardImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIdentityCardImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setErrors({ ...errors, identityCardImage: "" })
    }
  }

  const handlePassportImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ passportImage: "Image size must be less than 5MB" })
        return
      }

      setPassportImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPassportImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setErrors({ ...errors, passportImage: "" })
    }
  }

  const getProgressValue = () => {
    if (step === "email") return 33
    if (step === "otp") return 66
    return 100
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
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Progress indicator */}
          <div className="mb-6">
            <Progress value={getProgressValue()} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span className={step === "email" ? "font-semibold text-[#0088cc]" : ""}>Email</span>
              <span className={step === "otp" ? "font-semibold text-[#0088cc]" : ""}>OTP</span>
              <span className={step === "details" ? "font-semibold text-[#0088cc]" : ""}>Details</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            {/* World Map Image */}
            <div className="flex justify-center mb-4">
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <Image
                  src="/images/world-map.png"
                  alt="GlobalLink - Connecting the World"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your GlobalLink Account</h1>
            <p className="text-sm text-gray-600">
              {step === "email" && "Start by verifying your email address"}
              {step === "otp" && "Enter the OTP sent to your email"}
              {step === "details" && "Complete your profile information"}
            </p>
            {role && (
              <p className="text-xs text-gray-500 mt-1">
                Registering as: <span className="font-semibold capitalize">{role}</span>
              </p>
            )}
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
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
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-[#0088cc] hover:underline font-medium">
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
                <p className="text-xs text-gray-500">
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

          {/* Step 3: Profile Details */}
          {step === "details" && (
            <form onSubmit={handleRegister} className="space-y-6">
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

              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isSubmitting || isLoading}
                      required
                    />
                    {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isSubmitting || isLoading}
                      required
                    />
                    {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <CountrySelector
                    value={country}
                    onValueChange={setCountry}
                    disabled={isSubmitting || isLoading}
                  />
                  {errors.country && <p className="text-sm text-red-600">{errors.country}</p>}
                </div>

                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  country={country}
                  disabled={isSubmitting || isLoading}
                  required={false}
                  id="phoneNumber"
                  label="Phone Number (Optional)"
                />

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g., New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isSubmitting || isLoading}
                    required
                  />
                  {errors.city && <p className="text-sm text-red-600">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address {role === "buyer" && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="address"
                    placeholder="e.g., 123 Main Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isSubmitting || isLoading}
                    required={role === "buyer"}
                  />
                  {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
                </div>
              </div>

              {/* Security Credentials */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Security Credentials</h2>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isLoading}
                    required
                  />
                  {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting || isLoading}
                    required
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Profile Picture / User Photo */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900">
                  {role === "traveler" ? "User Photo" : "Profile Picture"} {role === "traveler" ? <span className="text-red-500">*</span> : "(Optional)"}
                </h2>

                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profileImagePreview || undefined} />
                      <AvatarFallback className="bg-gray-100">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <label
                        htmlFor="profilePicture"
                        className="text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                      >
                        Upload JPG, PNG, or GIF (Max 5MB)
                      </label>
                      <input
                        id="profilePicture"
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isSubmitting || isLoading}
                      />
                    </div>
                  </div>
                  {errors.profileImage && <p className="text-sm text-red-600">{errors.profileImage}</p>}
                  {errors.userPhoto && <p className="text-sm text-red-600">{errors.userPhoto}</p>}
                </div>
              </div>

              {/* Traveler-specific documents */}
              {role === "traveler" && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-gray-900">Identity Documents</h2>

                  {/* Identity Card Image */}
                  <div className="space-y-2">
                    <Label htmlFor="identityCardImage">
                      Identity Card Image <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-4">
                      {identityCardImagePreview ? (
                        <div className="relative w-24 h-24 border border-gray-300 rounded-lg overflow-hidden">
                          <img
                            src={identityCardImagePreview}
                            alt="Identity card preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label
                          htmlFor="identityCardImage"
                          className="text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                        >
                          Upload Identity Card (JPG, PNG, or GIF - Max 5MB)
                        </label>
                        <input
                          id="identityCardImage"
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          className="hidden"
                          onChange={handleIdentityCardImageUpload}
                          disabled={isSubmitting || isLoading}
                        />
                      </div>
                    </div>
                    {errors.identityCardImage && <p className="text-sm text-red-600">{errors.identityCardImage}</p>}
                  </div>

                  {/* Passport Image (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="passportImage">
                      Passport Image (Optional)
                    </Label>
                    <div className="flex items-center gap-4">
                      {passportImagePreview ? (
                        <div className="relative w-24 h-24 border border-gray-300 rounded-lg overflow-hidden">
                          <img
                            src={passportImagePreview}
                            alt="Passport preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label
                          htmlFor="passportImage"
                          className="text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                        >
                          Upload Passport (JPG, PNG, or GIF - Max 5MB)
                        </label>
                        <input
                          id="passportImage"
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          className="hidden"
                          onChange={handlePassportImageUpload}
                          disabled={isSubmitting || isLoading}
                        />
                      </div>
                    </div>
                    {errors.passportImage && <p className="text-sm text-red-600">{errors.passportImage}</p>}
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium"
                size="lg"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
