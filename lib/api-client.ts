import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios"
import type { ApiError } from "@/types/auth"
import { API_BASE_URL } from "./config"
import { ensureAbsoluteUrl } from "@/lib/utils"

// Verify and log the base URL on module load
if (typeof window !== "undefined") {
  console.log("📡 API Base URL:", API_BASE_URL)
  console.log("📡 Expected Full URL for send-otp:", `${API_BASE_URL}/api/Auth/send-otp-registration`)
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL.trim(), // Remove any whitespace
  timeout: 30000,
  // Note: Headers are set in the interceptor to ensure they're always included
})

// Expose and verify the created instance defaults at runtime (diagnostic only)
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("🧪 [api-client] axios instance created with baseURL:", apiClient.defaults.baseURL)
  // Optional: expose on window for quick checks in DevTools
  ;(window as any).__API_CLIENT_BASE__ = apiClient.defaults.baseURL
}

// Request interceptor to add JWT token and ensure ngrok header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log what baseURL we have at the start of the request
    console.log("🔍 [Interceptor] Request starting with baseURL:", config.baseURL)
    console.log("🔍 [Interceptor] API_BASE_URL constant value:", API_BASE_URL)
    
    if (!config.headers) {
      config.headers = {} as any
    }

    // Set Content-Type only for non-FormData requests and if not already set
    if (!(config.data instanceof FormData) && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json"
    }
    
    // Ensure ngrok bypass header is always present (required for ngrok free tier)
    config.headers["ngrok-skip-browser-warning"] = "true"
    
    // Get token from localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Normalize URL to absolute to avoid reliance on axios baseURL merging
    if (config.url) {
      const normalized = ensureAbsoluteUrl(config.url)
      if (normalized && normalized !== config.url) {
        config.url = normalized
      }
    }

    // Debug logging
    const fullUrl = config.url?.startsWith("http") ? config.url : `${config.baseURL || ""}${config.url || ""}`
    console.log("🚀 API Request:", {
      method: config.method?.toUpperCase(),
      url: fullUrl,
      baseURL: config.baseURL,
      endpoint: config.url,
      headers: { ...config.headers },
      data: config.data,
    })

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Handle network errors
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      const apiError: ApiError = {
        message: "Request timeout. Please check if the API server is running and try again.",
        statusCode: 0,
      }
      return Promise.reject(apiError)
    }

    // Handle connection errors
    if (error.code === "ERR_NETWORK" || !error.response) {
      let errorMessage = "Network Error. Unable to connect to the API server."
      
      // Log detailed error for debugging - log the entire error object first
      console.error("🔴 Full Error Object:", error)
      console.error("🔴 Error Code:", error.code)
      console.error("🔴 Error Message:", error.message)
      console.error("🔴 Error Request:", error.request)
      console.error("🔴 Error Config:", error.config)
      
      const fullUrl = error.config ? `${error.config.baseURL}${error.config.url}` : 
                     (error.request?.responseURL || "Unknown")
      
      // More detailed logging
      console.error("🔴 API Connection Error Details:", {
        code: error.code,
        message: error.message,
        fullUrl: fullUrl,
        baseURL: error.config?.baseURL || API_BASE_URL,
        endpoint: error.config?.url || "/api/Auth/send-otp-registration",
        method: error.config?.method || "POST",
        headers: error.config?.headers,
        requestUrl: error.request?.responseURL,
        requestStatus: error.request?.status,
      })
      
      // Check for specific error types
      const errorMsg = error.message?.toLowerCase() || ""
      
      // Provide more specific error messages
      if (errorMsg.includes("cert") || errorMsg.includes("certificate") || errorMsg.includes("unable to verify")) {
        errorMessage = `SSL Certificate Error. Cannot connect to ${fullUrl}. The API server may be using a self-signed certificate.`
      } else if (errorMsg.includes("cors") || error.code === "ERR_BLOCKED_BY_CLIENT" || error.request?.status === 0) {
        errorMessage = `CORS Error or blocked by browser. The request to ${fullUrl} was blocked. Please ensure: 1) CORS is enabled on the backend for origin ${typeof window !== "undefined" ? window.location.origin : "your frontend URL"}, 2) The ngrok header is being sent, 3) Your browser allows the request. Check browser console Network tab for details.`
      } else if (error.code === "ERR_NETWORK" || !error.response) {
        errorMessage = `Cannot connect to API server at ${fullUrl}. Please check: 1) Backend API is running, 2) URL is correct: ${API_BASE_URL}/api/Auth/send-otp-registration, 3) CORS is enabled, 4) No firewall/ad-blocker blocking the request.`
      }

      const apiError: ApiError = {
        message: errorMessage,
        statusCode: 0,
      }
      return Promise.reject(apiError)
    }

    // Handle 400 Bad Request - validation errors
    if (error.response?.status === 400) {
      const responseData = error.response?.data as any
      console.error("🔴 400 Bad Request Error:", {
        message: responseData?.message,
        errors: responseData?.errors,
        data: responseData,
      })
      
      // Format validation errors if they exist
      let errorMessage = responseData?.message || "Invalid request. Please check your input."
      if (responseData?.errors && typeof responseData.errors === 'object') {
        const errorMessages = Object.entries(responseData.errors)
          .map(([key, value]: [string, any]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`
            }
            return `${key}: ${value}`
          })
          .join('; ')
        if (errorMessages) {
          errorMessage = errorMessages
        }
      }

      const apiError: ApiError = {
        message: errorMessage,
        errors: responseData?.errors,
        statusCode: 400,
      }
      return Promise.reject(apiError)
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear auth data
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken")
        localStorage.removeItem("authUser")
        localStorage.removeItem("authExpiresAt")
        // Redirect to login page
        window.location.href = "/login"
      }
    }

    // Transform error to our ApiError format
    const responseData = error.response?.data as any
    const apiError: ApiError = {
      message: responseData?.message || error.message || "An error occurred",
      errors: responseData?.errors,
      statusCode: error.response?.status,
    }

    return Promise.reject(apiError)
  }
)

export default apiClient

