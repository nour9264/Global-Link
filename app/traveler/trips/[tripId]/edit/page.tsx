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
import { Calendar, Info, Loader2, ArrowLeft } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { CountrySelector } from "@/components/country-selector"
import { updateTrip, getTripById, getTravelerAddresses } from "@/lib/trip-service"
import type { TravelerAddress, UpdateTripRequest } from "@/types/trip"
import { toast } from "sonner"
import { useRouter, useParams } from "next/navigation"
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

export default function EditTripPage() {
  const router = useRouter()
  const params = useParams()
  const tripId = params?.tripId as string
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
  const [loadingTrip, setLoadingTrip] = useState(true)
  
  // Convert ISO 8601 to datetime-local format
  const convertToDateTimeLocal = (isoString: string): string => {
    if (!isoString) return ""
    try {
      const date = new Date(isoString)
      // Format: YYYY-MM-DDTHH:mm
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch {
      return ""
    }
  }
  
  // Fetch trip data and addresses on mount
  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) {
        toast.error("Invalid trip ID")
        router.push("/traveler/trips")
        return
      }
      
      setLoadingTrip(true)
      setLoadingAddresses(true)
      
      try {
        // Fetch trip details
        console.log(`🔄 [EditTripPage] Fetching trip ${tripId}...`)
        const trip = await getTripById(tripId)
        
        if (!trip) {
          toast.error("Trip not found")
          router.push("/traveler/trips")
          return
        }
        
        // Populate form with trip data
        setFromCountry(trip.fromCountry || "")
        setFromCity(trip.fromCity || "")
        setToCountry(trip.toCountry || "")
        setToCity(trip.toCity || "")
        setDepartureDate(convertToDateTimeLocal(trip.departureDate))
        setReturnDate(convertToDateTimeLocal(trip.returnDate))
        setCapacityKg(trip.capacityKg?.toString() || "")
        setMaxPackageWeightKg(trip.maxPackageWeightKg?.toString() || "")
        setNotes(trip.notes || "")
        setReceiveAddressId(trip.receiveAddressId || "")
        setReceiveWindowStartUtc(convertToDateTimeLocal(trip.receiveWindowStartUtc || ""))
        setReceiveByDeadlineUtc(convertToDateTimeLocal(trip.receiveByDeadlineUtc || ""))
        
        // Fetch addresses
        console.log("🔄 [EditTripPage] Fetching addresses...")
        const fetchedAddresses = await getTravelerAddresses()
        setAddresses(fetchedAddresses)
        
        // Auto-select address if not set and addresses available
        if (!trip.receiveAddressId && fetchedAddresses.length > 0) {
          const defaultAddress = fetchedAddresses.find(addr => addr.isDefault) || fetchedAddresses[0]
          if (defaultAddress) {
            setReceiveAddressId(defaultAddress.id)
          }
        }
      } catch (error) {
        console.error("❌ [EditTripPage] Error fetching trip data:", error)
        toast.error("Failed to load trip data. Please try again.")
        router.push("/traveler/trips")
      } finally {
        setLoadingTrip(false)
        setLoadingAddresses(false)
      }
    }
    
    if (user && tripId) {
      fetchTripData()
    }
  }, [user, tripId, router])
  
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
    
    if (!tripId) {
      toast.error("Invalid trip ID")
      return
    }
    
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
      newErrors.receiveAddressId = "Please add at least one address in your profile before updating a trip"
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
      const tripData: UpdateTripRequest = {
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
      
      const response = await updateTrip(tripId, tripData)
      
      if (response.isSuccess) {
        toast.success("Trip updated successfully!")
        router.push(`/traveler/trips/${tripId}`)
      } else {
        throw new Error(response.message || "Failed to update trip")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update trip"
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Loading state
  if (loadingTrip) {
    return (
      <TravelerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0088cc] mx-auto mb-4" />
            <p className="text-gray-600">Loading trip data...</p>
          </div>
        </div>
      </TravelerLayout>
    )
  }
  
  return (
    <TravelerLayout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/traveler/trips/${tripId}`)}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Trip</h1>
                <p className="text-gray-600 mt-1">Update your trip details.</p>
              </div>
            </div>
          </div>
          
          {/* Form */}
          <Card className="p-8 bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Origin Location */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Origin Location</h2>
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
                <h2 className="text-base font-semibold text-gray-900">Destination Location</h2>
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
                <h2 className="text-base font-semibold text-gray-900">Trip Dates</h2>
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
                        <strong>No addresses found.</strong> Please add an address in your profile before updating the trip.
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
                        <SelectValue placeholder={addresses.length === 1 ? "Your registration address" : "Select receiving address"} />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.address || "Address"}, {address.city}, {address.country}
                            {address.isDefault && " (Default)"}
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
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/traveler/trips/${tripId}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#0088cc] hover:bg-[#0077b3] h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || loadingAddresses || !isFormValid}
                >
                  {isSubmitting ? "Updating Trip..." : "Update Trip"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </TravelerLayout>
  )
}

