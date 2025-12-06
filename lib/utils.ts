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
 * Constructs a valid avatar URL from various sources
 * Handles relative URLs, absolute URLs, and data URLs
 */
export function getAvatarUrl(avatarUrl?: string | null): string | undefined {
  if (!avatarUrl || !avatarUrl.trim()) {
    // Check localStorage for user profile image (data URL)
    if (typeof window !== "undefined") {
      const localImage = localStorage.getItem("userProfileImage")
      if (localImage && localImage.trim()) {
        return localImage.trim()
      }
    }
    return undefined
  }

  // Delegate to the generic URL normalizer so avatars and media use the same rules
  return ensureAbsoluteUrl(avatarUrl)
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
  const cleanUrl = trimmedUrl.startsWith("/") ? trimmedUrl.slice(1) : trimmedUrl
  return `${API_BASE_URL.replace(/\/$/, "")}/${cleanUrl}`
}
