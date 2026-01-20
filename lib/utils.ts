import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_BASE_URL } from './config'

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Constructs a valid avatar URL from backend API
 * Handles relative URLs, absolute URLs, and data URLs
 */
export function getAvatarUrl(avatarUrl?: string | null): string | undefined {
  if (!avatarUrl || !avatarUrl.trim()) {
    console.log('[getAvatarUrl] No URL provided')
    return undefined
  }

  const absoluteUrl = ensureAbsoluteUrl(avatarUrl)
  if (!absoluteUrl) return undefined

  // PROXY LOGIC: If it's an ngrok URL, route through our local proxy
  if (absoluteUrl.includes("ngrok-free.dev")) {
    // Use the relative path to our proxy API
    // We encode the target URL to safely pass it as a query param
    return `/api/image-proxy?url=${encodeURIComponent(absoluteUrl)}`
  }

  // Add cache buster if it's our API (non-ngrok)
  if (absoluteUrl.includes('api/')) {
    const separator = absoluteUrl.includes('?') ? '&' : '?'
    return `${absoluteUrl}${separator}t=${new Date().getTime()}`
  }

  return absoluteUrl
}

/**
 * Helper to get a proxied image URL for general images (not just avatars)
 * enabling ngrok warning bypass.
 */
export function getProxiedImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  const absoluteUrl = ensureAbsoluteUrl(url)
  if (!absoluteUrl) return undefined

  if (absoluteUrl.includes("ngrok-free.dev")) {
    return `/api/image-proxy?url=${encodeURIComponent(absoluteUrl)}`
  }

  return absoluteUrl
}

/**
 * Ensure a URL is absolute (prefixed with API_BASE_URL) unless it's already
 * an absolute URL or a data URL. Returns undefined for empty/invalid input.
 */
export function ensureAbsoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  const trimmedUrl = String(url).trim()
  if (!trimmedUrl) return undefined

  // Already absolute or data URL
  if (
    trimmedUrl.startsWith("data:") ||
    trimmedUrl.startsWith("http://") ||
    trimmedUrl.startsWith("https://") ||
    trimmedUrl.startsWith("//")
  ) {
    return trimmedUrl
  }

  // Relative path -> prefix with API base url
  // Handle backslashes from Windows paths
  const normalizedUrl = trimmedUrl.replace(/\\/g, "/")
  const cleanUrl = normalizedUrl.startsWith("/") ? normalizedUrl.slice(1) : normalizedUrl

  return `${API_BASE_URL.replace(/\/$/, "")}/${cleanUrl}`
}
