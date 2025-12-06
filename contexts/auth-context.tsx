"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import apiClient from "@/lib/api-client"
import type {
  User,
  LoginRequest,
  LoginResponse,
  SendOTPRequest,
  SendOTPResponse,
  RegisterBuyerRequest,
  RegisterTravelerRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  LogoutResponse,
  AuthState,
  ApiError,
} from "@/types/auth"

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  sendOTP: (request: SendOTPRequest) => Promise<SendOTPResponse>
  registerBuyer: (request: RegisterBuyerRequest) => Promise<void>
  registerTraveler: (request: RegisterTravelerRequest) => Promise<void>
  forgotPassword: (request: ForgotPasswordRequest) => Promise<ForgotPasswordResponse>
  resetPassword: (request: ResetPasswordRequest) => Promise<ResetPasswordResponse>
  checkTokenExpiration: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load auth data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("authToken")
      const savedUser = localStorage.getItem("authUser")
      const savedExpiresAt = localStorage.getItem("authExpiresAt")

      if (savedToken && savedUser && savedExpiresAt) {
        // Check if token is expired
        const expiresAt = new Date(savedExpiresAt)
        if (expiresAt > new Date()) {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
        } else {
          // Token expired, clear storage and cookies
          localStorage.removeItem("authToken")
          localStorage.removeItem("authUser")
          localStorage.removeItem("authExpiresAt")
          document.cookie = "authToken=; path=/; max-age=0"
          document.cookie = "authUser=; path=/; max-age=0"
          document.cookie = "authExpiresAt=; path=/; max-age=0"
        }
      }
      setIsLoading(false)
    }
  }, [])

  // Check token expiration
  const checkTokenExpiration = useCallback((): boolean => {
    if (typeof window === "undefined") return false

    const savedExpiresAt = localStorage.getItem("authExpiresAt")
    if (!savedExpiresAt) return false

    const expiresAt = new Date(savedExpiresAt)
    const isExpired = expiresAt <= new Date()

    if (isExpired) {
      // Clear expired token
      setToken(null)
      setUser(null)
      localStorage.removeItem("authToken")
      localStorage.removeItem("authUser")
      localStorage.removeItem("authExpiresAt")
      document.cookie = "authToken=; path=/; max-age=0"
      document.cookie = "authUser=; path=/; max-age=0"
      document.cookie = "authExpiresAt=; path=/; max-age=0"
    }

    return !isExpired
  }, [])

  // Login function
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true)
      const response = await apiClient.post<LoginResponse>("/api/Auth/login", credentials)

      if (response.data.isSuccess && response.data.token && response.data.user) {
        const { token: newToken, user: userData, expiresAt } = response.data

        setToken(newToken)
        setUser(userData)

        // Save to localStorage and cookies
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", newToken)
          localStorage.setItem("authUser", JSON.stringify(userData))
          localStorage.setItem("authExpiresAt", expiresAt)

          // Set cookies for middleware access
          document.cookie = `authToken=${newToken}; path=/; max-age=${Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)}`
          document.cookie = `authUser=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)}`
          document.cookie = `authExpiresAt=${expiresAt}; path=/; max-age=${Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)}`
        }
      } else {
        throw new Error(response.data.message || "Login failed")
      }
    } catch (error) {
      const apiError = error as ApiError
      throw new Error(apiError.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Call logout API if token exists
      if (token) {
        await apiClient.post<LogoutResponse>("/api/Auth/logout")
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout API error:", error)
    } finally {
      // Clear state, localStorage, and cookies
      setToken(null)
      setUser(null)

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken")
        localStorage.removeItem("authUser")
        localStorage.removeItem("authExpiresAt")

        // Clear cookies
        document.cookie = "authToken=; path=/; max-age=0"
        document.cookie = "authUser=; path=/; max-age=0"
        document.cookie = "authExpiresAt=; path=/; max-age=0"
      }
    }
  }, [token])

  // Send OTP for registration
  const sendOTP = useCallback(async (request: SendOTPRequest): Promise<SendOTPResponse> => {
    try {
      const response = await apiClient.post<SendOTPResponse>("/api/Auth/send-otp-registration", request)

      if (response.data.isSuccess) {
        return response.data
      } else {
        throw new Error(response.data.message || "Failed to send OTP")
      }
    } catch (error) {
      const apiError = error as ApiError
      throw new Error(apiError.message || "Failed to send OTP")
    }
  }, [])

  // Register Buyer
  const registerBuyer = useCallback(async (request: RegisterBuyerRequest): Promise<void> => {
    try {
      setIsLoading(true)

      // Create JSON request body matching API expectations
      // According to Swagger API docs, the endpoint expects application/json with these fields
      const requestBody = {
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        password: request.password,
        confirmPassword: request.confirmPassword || request.password,
        otpForEmailConfirmation: request.otp,
        address: request.address,
        city: request.city,
        country: request.country,
        ...(request.phoneNumber && { phoneNumber: request.phoneNumber }),
      }

      // Note: profileImage is not included as the API expects JSON (application/json), not multipart/form-data
      // Profile image can be uploaded separately after registration if needed

      const response = await apiClient.post<RegisterResponse>("/api/Auth/register-buyer", requestBody, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (response.data.isSuccess && response.data.token && response.data.user) {
        const { token: newToken, user: userData } = response.data

        setToken(newToken)
        setUser(userData)

        // Save to localStorage and cookies
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", newToken)
          localStorage.setItem("authUser", JSON.stringify(userData))
          // Set a default expiration (24 hours from now) if not provided
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          localStorage.setItem("authExpiresAt", expiresAt)
          // Set cookies for middleware access
          const maxAge = 24 * 60 * 60 // 24 hours in seconds
          document.cookie = `authToken=${newToken}; path=/; max-age=${maxAge}`
          document.cookie = `authUser=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${maxAge}`
          document.cookie = `authExpiresAt=${expiresAt}; path=/; max-age=${maxAge}`
        }
      } else {
        throw new Error(response.data.message || "Registration failed")
      }
    } catch (error) {
      const apiError = error as ApiError
      throw new Error(apiError.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Register Traveler
  const registerTraveler = useCallback(async (request: RegisterTravelerRequest): Promise<void> => {
    try {
      setIsLoading(true)

      // Create FormData for multipart/form-data request
      // According to Swagger API docs, the endpoint expects multipart/form-data
      const formData = new FormData()

      // Required text fields (PascalCase as expected by API)
      formData.append("FirstName", request.firstName)
      formData.append("LastName", request.lastName)
      formData.append("Email", request.email)
      formData.append("Password", request.password)
      formData.append("ConfirmPassword", request.confirmPassword || request.password)
      formData.append("OtpForEmailConfirmation", request.otp)
      formData.append("City", request.city)
      formData.append("Country", request.country)

      // Optional text fields
      if (request.phoneNumber) {
        formData.append("PhoneNumber", request.phoneNumber)
      }
      if (request.address) {
        formData.append("Address", request.address)
      }

      // Required file fields
      if (request.userPhoto) {
        formData.append("UserPhoto", request.userPhoto)
      }
      if (request.identityCardImage) {
        formData.append("IdentityCardImage", request.identityCardImage)
      }

      // Optional file fields
      if (request.passportImage) {
        formData.append("PassportImage", request.passportImage)
      }

      // Optional boolean fields (default to false if not provided)
      if (request.identityCardValidated !== undefined) {
        formData.append("IdentityCardValidated", request.identityCardValidated.toString())
      }
      if (request.faceMatchVerified !== undefined) {
        formData.append("FaceMatchVerified", request.faceMatchVerified.toString())
      }
      if (request.extractedData) {
        formData.append("ExtractedData", request.extractedData)
      }

      // Send as multipart/form-data (don't set Content-Type header, browser will set it with boundary)
      const response = await apiClient.post<RegisterResponse>("/api/Auth/register-traveler", formData, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          // Don't set Content-Type - let the browser set it with the correct boundary for FormData
        },
      })

      if (response.data.isSuccess && response.data.token && response.data.user) {
        const { token: newToken, user: userData } = response.data

        setToken(newToken)
        setUser(userData)

        // Save to localStorage and cookies
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", newToken)
          localStorage.setItem("authUser", JSON.stringify(userData))
          // Set a default expiration (24 hours from now) if not provided
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          localStorage.setItem("authExpiresAt", expiresAt)
          // Set cookies for middleware access
          const maxAge = 24 * 60 * 60 // 24 hours in seconds
          document.cookie = `authToken=${newToken}; path=/; max-age=${maxAge}`
          document.cookie = `authUser=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${maxAge}`
          document.cookie = `authExpiresAt=${expiresAt}; path=/; max-age=${maxAge}`
        }
      } else {
        throw new Error(response.data.message || "Registration failed")
      }
    } catch (error) {
      const apiError = error as ApiError
      throw new Error(apiError.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Forgot Password - Send OTP to email
  const forgotPassword = useCallback(async (request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    try {
      // Try common endpoint variations - update based on your Swagger docs
      // Possible endpoints: 
      // - /api/Auth/send-otp-password-reset
      // - /api/Auth/forgot-password
      // - /api/Auth/request-password-reset
      const response = await apiClient.post<ForgotPasswordResponse>("/api/Auth/send-otp-password-reset", request)

      if (response.data.isSuccess) {
        return response.data
      } else {
        throw new Error(response.data.message || "Failed to send password reset OTP")
      }
    } catch (error) {
      const apiError = error as ApiError
      console.error("Forgot Password Error:", {
        message: apiError.message,
        statusCode: apiError.statusCode,
        endpoint: "/api/Auth/send-otp-password-reset",
      })
      throw new Error(apiError.message || "Failed to send password reset OTP")
    }
  }, [])

  // Reset Password with OTP
  const resetPassword = useCallback(async (request: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    try {
      // Create request body matching API expectations
      // API expects: NewPassword, ConfirmNewPassword (capitalized camelCase)
      const requestBody = {
        email: request.email,
        otp: request.otp,
        NewPassword: request.newPassword, // API expects capitalized NewPassword
        ConfirmNewPassword: request.confirmPassword, // API expects capitalized ConfirmNewPassword
      }

      console.log("Reset Password Request Body:", requestBody)

      const response = await apiClient.post<ResetPasswordResponse>("/api/Auth/reset-password", requestBody, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      console.log("Reset Password API Response:", response.data)
      
      // Return the response even if isSuccess is false - let the UI handle it
      // Some APIs might return success without isSuccess flag
      if (response.data.isSuccess === false) {
        throw new Error(response.data.message || "Failed to reset password")
      }
      
      return response.data
    } catch (error) {
      const apiError = error as ApiError
      console.error("Reset Password Error:", {
        message: apiError.message,
        statusCode: apiError.statusCode,
        endpoint: "/api/Auth/reset-password",
        errors: apiError.errors,
      })
      throw new Error(apiError.message || "Failed to reset password")
    }
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user && checkTokenExpiration(),
    login,
    logout,
    sendOTP,
    registerBuyer,
    registerTraveler,
    forgotPassword,
    resetPassword,
    checkTokenExpiration,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

