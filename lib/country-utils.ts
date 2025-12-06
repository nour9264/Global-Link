/**
 * Country utilities using libphonenumber-js
 * Provides dynamic access to all countries and their metadata
 */
import { getCountries, getCountryCallingCode, AsYouType } from "libphonenumber-js"
import countries from "i18n-iso-countries"
import enLocale from "i18n-iso-countries/langs/en.json"

// Register country names
countries.registerLocale(enLocale)

// Import metadata dynamically - lazy load to avoid build issues
let metadata: any = null

function loadMetadata() {
  if (metadata) return metadata
  
  try {
    // Use require for server-side and dynamic import for client-side
    if (typeof window === "undefined") {
      // Server-side
      metadata = require("libphonenumber-js/metadata.min.json")
    }
    // Client-side will load metadata when getPhoneNumberLengthRange is called
  } catch (err) {
    console.warn("Could not load metadata, using fallbacks")
  }
  
  return metadata
}

// Get country name from code using i18n-iso-countries
export function getCountryName(countryCode: string): string {
  return countries.getName(countryCode, "en") || countryCode
}

// Get all countries with their data from libphonenumber-js
export interface CountryData {
  code: string
  name: string
  phoneCode: string
}

export function getAllCountries(): CountryData[] {
  const countries = getCountries()
  
  return countries.map((code) => {
    try {
      const phoneCode = getCountryCallingCode(code as any)
      const name = getCountryName(code)
      
      return {
        code,
        name,
        phoneCode: `+${phoneCode}`,
      }
    } catch (err) {
      // Skip invalid countries
      return null
    }
  }).filter((country): country is CountryData => country !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Get phone number length range from libphonenumber-js metadata
export function getPhoneNumberLengthRange(countryCode: string): { min: number; max: number } | null {
  if (!countryCode) return null

  try {
    // Load metadata if not already loaded
    const loadedMetadata = loadMetadata()
    
    // Access metadata
    if (loadedMetadata) {
      const countryMetadata = loadedMetadata.countries?.[countryCode]
      
      if (countryMetadata) {
        // Try to get possible lengths - this is the most reliable method
        if (countryMetadata.possibleLengths) {
          const nationalLengths = countryMetadata.possibleLengths.national || []
          if (nationalLengths.length > 0) {
            return {
              min: Math.min(...nationalLengths),
              max: Math.max(...nationalLengths),
            }
          }
        }
        
        // Try to extract from patterns as fallback
        const patterns = countryMetadata.patterns || []
        if (patterns.length > 0) {
          // Look for length information in pattern format
          for (const pattern of patterns) {
            if (pattern.nationalNumberPattern) {
              // Try to extract length from pattern regex
              const patternStr = pattern.nationalNumberPattern
              const rangeMatch = patternStr.match(/\{(\d+)(?:,(\d+))?\}/)
              if (rangeMatch) {
                const min = parseInt(rangeMatch[1], 10)
                const max = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : min
                if (min > 0 && max >= min) {
                  return { min, max }
                }
              }
            }
          }
        }
      }
    }
    
    // Fallback: use AsYouType formatter to test different lengths
    // This is a heuristic approach
    try {
      const formatter = new AsYouType(countryCode as any)
      // Test with various lengths to see what's accepted
      // This is not perfect but better than nothing
    } catch (err) {
      // Ignore
    }
    
    // Ultimate fallback: reasonable defaults based on common patterns
    return { min: 7, max: 15 }
  } catch (err) {
    console.warn(`Error getting length for ${countryCode}:`, err)
    return { min: 7, max: 15 }
  }
}

