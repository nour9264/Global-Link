"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPhoneNumberLengthRange, getAllCountries } from "@/lib/country-utils"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  country?: string // Country name from CountrySelector
  disabled?: boolean
  required?: boolean
  id?: string
  label?: string
  error?: string
}

export function PhoneInput({
  value,
  onChange,
  country,
  disabled = false,
  required = false,
  id = "phoneNumber",
  label = "Phone Number",
  error,
}: PhoneInputProps) {
  const [internalValue, setInternalValue] = React.useState(value)
  const [validationError, setValidationError] = React.useState<string>("")
  const [isFocused, setIsFocused] = React.useState(false)

  // Get all countries to find country code and phone code
  const [allCountries] = React.useState(() => getAllCountries())

  // Get country code and phone code from country name
  const countryData = React.useMemo(() => {
    if (!country) return null
    return allCountries.find((c) => c.name === country || c.code === country)
  }, [country, allCountries])

  const countryCode = countryData?.code
  const phoneCode = countryData?.phoneCode || ""

  // Get valid length range for the national number (after country code)
  // Uses libphonenumber-js metadata dynamically
  const lengthRange = React.useMemo(() => {
    if (!countryCode) return null
    return getPhoneNumberLengthRange(countryCode)
  }, [countryCode])

  // Initialize phone number with country code when country is selected
  React.useEffect(() => {
    if (country && phoneCode) {
      const currentValue = internalValue.trim()
      
      // If phone number is empty, set just the country code with a space
      if (!currentValue || (!currentValue.startsWith("+") && !currentValue.startsWith(phoneCode))) {
        setInternalValue(phoneCode + " ")
        onChange(phoneCode + " ")
        return
      }
      
      // If phone number starts with a different country code, replace it
      const existingCodeMatch = currentValue.match(/^(\+\d{1,4})\s?/)
      if (existingCodeMatch) {
        const existingCode = existingCodeMatch[1]
        if (existingCode !== phoneCode) {
          // Extract national number (digits only, without country code)
          const nationalNumber = currentValue.replace(/^\+\d{1,4}\s?/, "").replace(/\D/g, "")
          const newValue = nationalNumber ? `${phoneCode} ${nationalNumber}` : phoneCode + " "
          setInternalValue(newValue)
          onChange(newValue)
        }
      } else if (!currentValue.startsWith(phoneCode)) {
        // Phone number doesn't start with any country code, add it
        const nationalNumber = currentValue.replace(/\D/g, "")
        const newValue = nationalNumber ? `${phoneCode} ${nationalNumber}` : phoneCode + " "
        setInternalValue(newValue)
        onChange(newValue)
      }
    }
  }, [country, phoneCode]) // Only when country changes (not when internalValue changes)

  // Separate country code from national number
  const getNationalNumber = React.useCallback((phoneValue: string): string => {
    if (!phoneCode || !phoneValue.startsWith(phoneCode)) {
      // If no country code prefix, assume all digits are national number
      return phoneValue.replace(/\D/g, "")
    }
    
    // Remove country code and any non-digits
    const withoutCode = phoneValue.replace(new RegExp(`^${phoneCode.replace("+", "\\+")}\\s?`), "")
    return withoutCode.replace(/\D/g, "")
  }, [phoneCode])

  // Validate phone number
  const validatePhoneNumber = React.useCallback((phoneValue: string): string => {
    // Check for non-numeric characters (after country code)
    const nationalNumber = getNationalNumber(phoneValue)
    
    // Check if there are any non-digit characters in the entire input
    // (excluding the country code prefix which may have + and space)
    const fullInput = phoneValue.replace(/^\+\d{1,4}\s?/, "")
    if (fullInput && /\D/.test(fullInput)) {
      return "Only numbers are allowed."
    }
    
    // Check length if country is selected
    if (country && lengthRange) {
      const numLength = nationalNumber.length
      if (numLength > 0 && (numLength < lengthRange.min || numLength > lengthRange.max)) {
        return "Invalid phone number length for this country."
      }
    }
    
    return ""
  }, [country, lengthRange, getNationalNumber])

  // Handle input change
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
      // If country is selected, ensure country code is present
      if (country && phoneCode) {
        // Extract national number (digits only, after country code)
        let nationalNumber = inputValue
        
        // Remove country code if present
        if (inputValue.startsWith(phoneCode)) {
          nationalNumber = inputValue.replace(new RegExp(`^${phoneCode.replace("+", "\\+")}\\s?`), "")
        } else {
          // Try to remove any existing country code
          nationalNumber = inputValue.replace(/^\+\d{1,4}\s?/, "")
        }
        
        // Remove all non-digit characters from national number
        nationalNumber = nationalNumber.replace(/\D/g, "")
        
        // Apply max length limit if range is defined
        if (lengthRange && nationalNumber.length > lengthRange.max) {
          nationalNumber = nationalNumber.slice(0, lengthRange.max)
        }
        
        // Reconstruct with country code and space
        inputValue = nationalNumber ? `${phoneCode} ${nationalNumber}` : phoneCode + " "
      } else {
        // No country selected, allow free-form input but still validate for non-digits
        // Remove non-digit characters if user tries to paste invalid chars
        const hasNonDigits = /\D/.test(inputValue.replace(/^\+\d{1,4}\s?/, ""))
        if (hasNonDigits && inputValue.length > 0) {
          // Keep country code prefix if any, strip non-digits from rest
          const codeMatch = inputValue.match(/^(\+\d{1,4})\s?/)
          if (codeMatch) {
            const code = codeMatch[1]
            const digits = inputValue.replace(/^\+\d{1,4}\s?/, "").replace(/\D/g, "")
            inputValue = digits ? `${code} ${digits}` : code + " "
          } else {
            // No country code, just digits
            inputValue = inputValue.replace(/\D/g, "")
          }
        }
      }
    
    // Update internal state
    setInternalValue(inputValue)
    onChange(inputValue)
    
    // Validate
    const error = validatePhoneNumber(inputValue)
    setValidationError(error)
  }, [country, phoneCode, lengthRange, onChange, validatePhoneNumber])

  // Sync external value changes
  React.useEffect(() => {
    setInternalValue(value)
    const error = validatePhoneNumber(value)
    setValidationError(error)
  }, [value, validatePhoneNumber])

  // Display error (validation error or prop error)
  const displayError = validationError || error

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={phoneCode ? `${phoneCode} 1234567890` : "+1234567890"}
          value={internalValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          required={required}
          className={displayError ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
      </div>
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
    </div>
  )
}
