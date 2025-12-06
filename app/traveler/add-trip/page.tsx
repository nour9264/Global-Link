"use client"

import type React from "react"
import { TravelerLayout } from "@/components/traveler-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar, Info } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { CountrySelector } from "@/components/country-selector"
import { createTrip, getTravelerAddresses } from "@/lib/trip-service"
import type { TravelerAddress } from "@/types/trip"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

// Tooltip descriptions
const tooltips = {
  fromCountry: "The country of the trip in which its gonna start and take off",
  fromCity: "The city of the trip in which its gonna start and take off",
  toCountry: "The country of the trip in which its gonna end and land in",
  toCity: "The city of the trip in which its gonna end and land in",
  departureDate: "The date and time in which the plane is taking off",
  returnDate: "The date and time in which the plane is landing",
  capacityKg: "The available capacity that the traveller can carry",
  notes: "Additional info here",
  maxPackageWeightKg: "The maximum weight of a package that the traveller can carry",
  receiveAddressId: "A list of all the available adresses of the traveller",
  receiveWindowStartUtc: "The date in which the buyer can meet the traveller to collect the item",
  receiveByDeadlineUtc: "The last date and chance in which the buyer can meet the traveller to collect the item",
}

// Helper component for labeled input with tooltip
function LabeledInput({
  id,
  label,
  tooltip,
  required = false,
  children,
  error,
}: {
  id: string
  label: string
  tooltip: string
  required?: boolean
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600" />
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default function AddTripPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Origin fields
  const [fromCountry, setFromCountry] = useState("")
  const [fromCity, setFromCity] = useState("")
  
  // Destination fields
  const [toCountry, setToCountry] = useState("")
  const [toCity, setToCity] = useState("")
  
  // Date fields (using datetime-local format)
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  
  // Capacity and weight fields
  const [capacityKg, setCapacityKg] = useState("")
  const [maxPackageWeightKg, setMaxPackageWeightKg] = useState("")
  
  // Notes
  const [notes, setNotes] = useState("")
  
  // Address and receiving window
  const [receiveAddressId, setReceiveAddressId] = useState("")
  const [receiveWindowStartUtc, setReceiveWindowStartUtc] = useState("")
  const [receiveByDeadlineUtc, setReceiveByDeadlineUtc] = useState("")
  
  // Addresses list
  const [addresses, setAddresses] = useState<TravelerAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  
  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if form is valid (for button disable state)
  const isFormValid = useMemo(() => {
    return (
      fromCountry.trim() !== "" &&
      fromCity.trim() !== "" &&
      toCountry.trim() !== "" &&
      toCity.trim() !== "" &&
      departureDate !== "" &&
      returnDate !== "" &&
      capacityKg !== "" &&
      !isNaN(Number(capacityKg)) &&
      Number(capacityKg) > 0 &&
      maxPackageWeightKg !== "" &&
      !isNaN(Number(maxPackageWeightKg)) &&
      Number(maxPackageWeightKg) > 0 &&
      notes.trim() !== "" &&
      receiveAddressId !== "" &&
      receiveWindowStartUtc !== "" &&
      receiveByDeadlineUtc !== "" &&
      addresses.length > 0
    )
  }, [
    fromCountry,
    fromCity,
    toCountry,
    toCity,
    departureDate,
    returnDate,
    capacityKg,
    maxPackageWeightKg,
    notes,
    receiveAddressId,
    receiveWindowStartUtc,
    receiveByDeadlineUtc,
    addresses.length,
  ])

  // Fetch addresses on mount - these should include the address from registration
  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true)
      try {
        console.log("🔄 [AddTripPage] Fetching addresses...")
        console.log("🔄 [AddTripPage] Current user:", user)
        
        // First, try to get addresses from the user object (might be in addresses.$values)
        let fetchedAddresses: TravelerAddress[] = []
        
        if (user?.addresses?.$values && Array.isArray(user.addresses.$values)) {
          console.log("✅ [AddTripPage] Found addresses in user object:", user.addresses.$values)
          fetchedAddresses = user.addresses.$values.map((addr: any, index: number) => ({
            id: addr.id || addr.$id || addr.addressId || `user-addr-${index}`,
            address: addr.address || addr.street || addr.addressLine || "",
            city: addr.city || "",
            country: addr.country || "",
            postalCode: addr.postalCode || addr.zipCode || "",
            isDefault: addr.isDefault || index === 0,
          }))
        }
        
        // If no addresses from user object, try API endpoint
        if (fetchedAddresses.length === 0) {
          console.log("🔄 [AddTripPage] No addresses in user object, trying API endpoint...")
          fetchedAddresses = await getTravelerAddresses()
        }
        
        console.log("📋 [AddTripPage] Final fetched addresses:", fetchedAddresses)
        console.log("📋 [AddTripPage] Number of addresses:", fetchedAddresses.length)
        
        setAddresses(fetchedAddresses)
        
        // Auto-select the address if there's only one (likely the registration address)
        if (fetchedAddresses.length === 1) {
          console.log("✅ [AddTripPage] Auto-selecting single address:", fetchedAddresses[0])
          setReceiveAddressId(fetchedAddresses[0].id)
        } else if (fetchedAddresses.length > 1) {
          // If multiple addresses, prefer the default one or the first one
          const defaultAddress = fetchedAddresses.find(addr => addr.isDefault) || fetchedAddresses[0]
          if (defaultAddress) {
            console.log("✅ [AddTripPage] Auto-selecting default/first address:", defaultAddress)
            setReceiveAddressId(defaultAddress.id)
          }
        } else {
          console.warn("⚠️ [AddTripPage] No addresses found. Check console logs above for API response details.")
        }
      } catch (error) {
        // Log error for debugging
        console.error("❌ [AddTripPage] Error in fetchAddresses:", error)
        setAddresses([])
      } finally {
        setLoadingAddresses(false)
      }
    }
    
    if (user) {
      fetchAddresses()
    }
  }, [user])

  // Convert datetime-local to ISO 8601
  const convertToISO = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return ""
    // datetime-local format: "YYYY-MM-DDTHH:mm"
    // ISO 8601 format: "YYYY-MM-DDTHH:mm:ss.sssZ"
    return new Date(dateTimeLocal).toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}

    if (!fromCountry.trim()) newErrors.fromCountry = "Origin country is required"
    if (!fromCity.trim()) newErrors.fromCity = "Origin city is required"
    if (!toCountry.trim()) newErrors.toCountry = "Destination country is required"
    if (!toCity.trim()) newErrors.toCity = "Destination city is required"
    if (!departureDate) newErrors.departureDate = "Departure date is required"
    if (!returnDate) newErrors.returnDate = "Return date is required"
    if (!capacityKg || isNaN(Number(capacityKg)) || Number(capacityKg) <= 0) {
      newErrors.capacityKg = "Available capacity must be a positive number"
    }
    if (!maxPackageWeightKg || isNaN(Number(maxPackageWeightKg)) || Number(maxPackageWeightKg) <= 0) {
      newErrors.maxPackageWeightKg = "Maximum package weight must be a positive number"
    }
    if (!notes.trim()) newErrors.notes = "Additional notes are required"
    if (addresses.length > 0 && !receiveAddressId) {
      newErrors.receiveAddressId = "Receiving address is required"
    } else if (addresses.length === 0) {
      newErrors.receiveAddressId = "Please add at least one address in your profile before creating a trip"
    }
    if (!receiveWindowStartUtc) newErrors.receiveWindowStartUtc = "Receiving window start date is required"
    if (!receiveByDeadlineUtc) newErrors.receiveByDeadlineUtc = "Receiving deadline is required"

    // Validate dates
    if (departureDate && returnDate) {
      const depDate = new Date(departureDate)
      const retDate = new Date(returnDate)
      if (retDate <= depDate) {
        newErrors.returnDate = "Return date must be after departure date"
      }
    }

    if (receiveWindowStartUtc && receiveByDeadlineUtc) {
      const windowStart = new Date(receiveWindowStartUtc)
      const deadline = new Date(receiveByDeadlineUtc)
      if (deadline <= windowStart) {
        newErrors.receiveByDeadlineUtc = "Deadline must be after window start"
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const tripData = {
        fromCountry: fromCountry.trim(),
        fromCity: fromCity.trim(),
        toCountry: toCountry.trim(),
        toCity: toCity.trim(),
        departureDate: convertToISO(departureDate),
        returnDate: convertToISO(returnDate),
        capacityKg: Number(capacityKg),
        maxPackageWeightKg: Number(maxPackageWeightKg),
        receiveAddressId: receiveAddressId,
        receiveWindowStartUtc: convertToISO(receiveWindowStartUtc),
        receiveByDeadlineUtc: convertToISO(receiveByDeadlineUtc),
        notes: notes.trim(),
      }

      const response = await createTrip(tripData)

      if (response.isSuccess) {
        toast.success("Trip created successfully!")
        router.push("/traveler/trips")
      } else {
        throw new Error(response.message || "Failed to create trip")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create trip"
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TravelerLayout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Add New Trip</h1>
            <p className="text-muted-foreground mt-1">Fill in the details for your upcoming trip to help buyers find you.</p>
          </div>

          {/* Form */}
          <Card className="p-8 bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Origin Location */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Origin Location</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <LabeledInput
                    id="fromCountry"
                    label="Origin Country"
                    tooltip={tooltips.fromCountry}
                    required
                    error={errors.fromCountry}
                  >
                    <CountrySelector
                      value={fromCountry}
                      onValueChange={setFromCountry}
                      disabled={isSubmitting}
                    />
                  </LabeledInput>

                  <LabeledInput
                    id="fromCity"
                    label="Origin City"
                    tooltip={tooltips.fromCity}
                    required
                    error={errors.fromCity}
                  >
                    <Input
                      id="fromCity"
                      placeholder="e.g., New York"
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                      className="bg-gray-50"
                      disabled={isSubmitting}
                      required
                    />
                  </LabeledInput>
                </div>
              </div>

              {/* Destination Location */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Destination Location</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <LabeledInput
                    id="toCountry"
                    label="Destination Country"
                    tooltip={tooltips.toCountry}
                    required
                    error={errors.toCountry}
                  >
                    <CountrySelector
                      value={toCountry}
                      onValueChange={setToCountry}
                      disabled={isSubmitting}
                    />
                  </LabeledInput>

                  <LabeledInput
                    id="toCity"
                    label="Destination City"
                    tooltip={tooltips.toCity}
                    required
                    error={errors.toCity}
                  >
                    <Input
                      id="toCity"
                      placeholder="e.g., London"
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                      className="bg-gray-50"
                      disabled={isSubmitting}
                      required
                    />
                  </LabeledInput>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Trip Dates</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <LabeledInput
                    id="departureDate"
                    label="Departure Date & Time"
                    tooltip={tooltips.departureDate}
                    required
                    error={errors.departureDate}
                  >
                    <div className="relative">
                      <Input
                        id="departureDate"
                        type="datetime-local"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="bg-gray-50"
                        disabled={isSubmitting}
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </LabeledInput>

                  <LabeledInput
                    id="returnDate"
                    label="Return Date & Time"
                    tooltip={tooltips.returnDate}
                    required
                    error={errors.returnDate}
                  >
                    <div className="relative">
                      <Input
                        id="returnDate"
                        type="datetime-local"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="bg-gray-50"
                        disabled={isSubmitting}
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </LabeledInput>
                </div>
              </div>

              {/* Capacity and Weight */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Carrying Capacity</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <LabeledInput
                    id="capacityKg"
                    label="Available Capacity (kg)"
                    tooltip={tooltips.capacityKg}
                    required
                    error={errors.capacityKg}
                  >
                    <Input
                      id="capacityKg"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 20"
                      value={capacityKg}
                      onChange={(e) => setCapacityKg(e.target.value)}
                      className="bg-gray-50"
                      disabled={isSubmitting}
                      required
                    />
                  </LabeledInput>

                  <LabeledInput
                    id="maxPackageWeightKg"
                    label="Max Package Weight (kg)"
                    tooltip={tooltips.maxPackageWeightKg}
                    required
                    error={errors.maxPackageWeightKg}
                  >
                    <Input
                      id="maxPackageWeightKg"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 10"
                      value={maxPackageWeightKg}
                      onChange={(e) => setMaxPackageWeightKg(e.target.value)}
                      className="bg-gray-50"
                      disabled={isSubmitting}
                      required
                    />
                  </LabeledInput>
                </div>
              </div>

              {/* Receiving Address and Window */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Item Receiving Details</h2>
                
                <LabeledInput
                  id="receiveAddressId"
                  label="Receiving Address"
                  tooltip={tooltips.receiveAddressId}
                  required
                  error={errors.receiveAddressId}
                >
                  {addresses.length === 0 && !loadingAddresses ? (
                    <div className="space-y-2">
                      <Input
                        value=""
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                        placeholder="No addresses available"
                      />
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        <strong>No addresses found.</strong> The address from your registration should appear here automatically. 
                        If you don't see it, the system is trying to fetch it from multiple sources. Please refresh the page or contact support if the issue persists.
                      </p>
                    </div>
                  ) : loadingAddresses ? (
                    <div className="space-y-2">
                      <Input
                        value=""
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                        placeholder="Loading addresses..."
                      />
                      <p className="text-xs text-gray-500">
                        Loading your addresses...
                      </p>
                    </div>
                  ) : (
                    <Select value={receiveAddressId} onValueChange={setReceiveAddressId} disabled={isSubmitting || loadingAddresses}>
                      <SelectTrigger className="bg-gray-50">
                        <SelectValue placeholder={loadingAddresses ? "Loading addresses..." : addresses.length === 1 ? "Your registration address" : "Select receiving address"} />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.address || "Address"}, {address.city}, {address.country}
                            {address.isDefault && " (Default)"}
                            {addresses.length === 1 && " (Registration Address)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </LabeledInput>

                <div className="grid md:grid-cols-2 gap-4">
                  <LabeledInput
                    id="receiveWindowStartUtc"
                    label="Receiving Window Start"
                    tooltip={tooltips.receiveWindowStartUtc}
                    required
                    error={errors.receiveWindowStartUtc}
                  >
                    <div className="relative">
                      <Input
                        id="receiveWindowStartUtc"
                        type="datetime-local"
                        value={receiveWindowStartUtc}
                        onChange={(e) => setReceiveWindowStartUtc(e.target.value)}
                        className="bg-gray-50"
                        disabled={isSubmitting}
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </LabeledInput>

                  <LabeledInput
                    id="receiveByDeadlineUtc"
                    label="Receiving Deadline"
                    tooltip={tooltips.receiveByDeadlineUtc}
                    required
                    error={errors.receiveByDeadlineUtc}
                  >
                    <div className="relative">
                      <Input
                        id="receiveByDeadlineUtc"
                        type="datetime-local"
                        value={receiveByDeadlineUtc}
                        onChange={(e) => setReceiveByDeadlineUtc(e.target.value)}
                        className="bg-gray-50"
                        disabled={isSubmitting}
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </LabeledInput>
                </div>
              </div>

              {/* Additional Notes */}
              <LabeledInput
                id="notes"
                label="Additional Notes"
                tooltip={tooltips.notes}
                required
                error={errors.notes}
              >
                <Textarea
                  id="notes"
                  placeholder="Any specific items you prefer to carry, or restrictions."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-gray-50 min-h-32"
                  disabled={isSubmitting}
                  required
                />
              </LabeledInput>

              {/* Error Message */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-[#0088cc] hover:bg-[#0077b3] h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || loadingAddresses || !isFormValid}
              >
                {isSubmitting ? "Creating Trip..." : "Add Trip"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </TravelerLayout>
  )
}
