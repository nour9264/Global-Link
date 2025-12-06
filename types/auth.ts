// Authentication-related TypeScript types

export interface User {
  $id?: string
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  avatarUrl?: string | null
  isBuyerEnabled: boolean
  isTravelerEnabled: boolean
  isEmailConfirmed: boolean
  activeMode: "Buyer" | "Traveler"
  status: string
  createdAt: string
  lastLoginAt?: string
  addresses?: {
    $id?: string
    $values: any[]
  }
  languages?: {
    $id?: string
    $values: any[]
  }
  identityDocs?: {
    $id?: string
    $values: any[]
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  $id?: string
  isSuccess: boolean
  message: string
  token: string
  expiresAt: string
  user: User
  errors?: any
}

export interface SendOTPRequest {
  email: string
}

export interface SendOTPResponse {
  $id?: string
  isSuccess: boolean
  message: string
  otp?: string // Returned for testing purposes
  expiresAt: string
}

export interface RegisterBuyerRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword?: string
  phoneNumber?: string
  profileImage?: File
  otp: string
  address: string
  city: string
  country: string
}

export interface RegisterTravelerRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword?: string
  phoneNumber?: string
  userPhoto?: File // Required for traveler - maps to UserPhoto in API
  identityCardImage?: File // Required for traveler - maps to IdentityCardImage in API
  passportImage?: File // Optional for traveler - maps to PassportImage in API
  otp: string
  address?: string
  city: string
  country: string
  // Optional fields that API may expect
  identityCardValidated?: boolean
  faceMatchVerified?: boolean
  extractedData?: string
}

export interface RegisterResponse {
  $id?: string
  isSuccess: boolean
  message: string
  token?: string
  user?: User
  errors?: any
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  $id?: string
  isSuccess: boolean
  message: string
  otp?: string // Returned for testing purposes
  expiresAt?: string
}

export interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
  confirmPassword: string
}

export interface ResetPasswordResponse {
  $id?: string
  isSuccess: boolean
  message: string
}

export interface LogoutResponse {
  message: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  statusCode?: number
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}
