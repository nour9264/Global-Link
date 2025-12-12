"use client"

import { useEffect, useMemo, useState } from "react"
import { BuyerLayout } from "@/components/buyer-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Calendar, Loader2 } from "lucide-react"
import { getAvailableTrips, makeOffer } from "@/lib/trip-service"
import { getMyRequests } from "@/lib/buyer-request-service"
import { getAvatarUrl } from "@/lib/utils"
import type { AvailableTrip, TravelerSummary } from "@/types/trip"
import type { BuyerRequest } from "@/types/buyer-request"
import { useToast } from "@/hooks/use-toast"

interface TravelerWithTrips {
  traveler: TravelerSummary
  trips: AvailableTrip[]
}

export default function BuyerFindTravelersPage() {
  const { toast } = useToast()

  const [availableTrips, setAvailableTrips] = useState<AvailableTrip[]>([])
  const [myRequests, setMyRequests] = useState<BuyerRequest[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [requestsLoading, setRequestsLoading] = useState<boolean>(false)

  // Request selection dialog
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string>("")
  const [offerTripId, setOfferTripId] = useState<string | null>(null)

  // Offer details dialog
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)
  const [offerPrice, setOfferPrice] = useState<string>("")
  const [offerMessage, setOfferMessage] = useState<string>("")
  const [offerSubmitting, setOfferSubmitting] = useState(false)

  const [origin, setOrigin] = useState<string>("")
  const [destination, setDestination] = useState<string>("")
  const [departureDate, setDepartureDate] = useState<string>("")
  const [minRating, setMinRating] = useState<string>("0")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("any")

  // Fetch trips from API - can optionally send filters to API for server-side filtering
  const fetchTrips = async (useApiFilters = false, showToastOnError = true) => {
    try {
      setLoading(true)

      let params: { fromCountry?: string; toCountry?: string; departureDate?: string } | undefined

      // If using API filters, send origin/destination/departureDate to API
      // Note: API filters by country name, not city name
      if (useApiFilters) {
        params = {}
        if (origin.trim()) {
          params.fromCountry = origin.trim()
        }
        if (destination.trim()) {
          params.toCountry = destination.trim()
        }
        if (departureDate) {
          const date = new Date(departureDate)
          if (!isNaN(date.getTime())) {
            params.departureDate = date.toISOString()
          }
        }
        // Only send params if at least one filter is set
        if (Object.keys(params).length === 0) {
          params = undefined
        }
      }

      console.log("🔍 [BuyerFindTravelersPage] Fetching trips", params ? "with API filters:" : "without filters", params)
      const trips = await getAvailableTrips(params)
      console.log("✅ [BuyerFindTravelersPage] Fetched trips:", trips.length)
      setAvailableTrips(trips)
    } catch (error: any) {
      console.error("❌ [BuyerFindTravelersPage] Error fetching available trips:", error)
      if (showToastOnError) {
        toast({
          title: "Failed to load travelers",
          description: error?.message || "Please try again later.",
          variant: "destructive",
        })
      }
      setAvailableTrips([])
    } finally {
      setLoading(false)
    }
  }

  // Load all trips on initial mount (no filters)
  useEffect(() => {
    fetchTrips(false, false)
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load buyer's requests
  const loadRequests = async () => {
    try {
      setRequestsLoading(true)
      const requests = await getMyRequests()
      setMyRequests(requests)
    } catch (error) {
      console.error("Failed to load requests:", error)
      toast({
        title: "Failed to load requests",
        description: "Could not fetch your requests",
        variant: "destructive",
      })
    } finally {
      setRequestsLoading(false)
    }
  }

  // Apply all filters client-side for maximum flexibility
  // This allows searching by city names, partial matches, and filters the API doesn't support (rating, language)
  const filteredTrips = useMemo(() => {
    let filtered = [...availableTrips]

    // Filter by origin (search in both city and country)
    const originFilter = origin.trim().toLowerCase()
    if (originFilter) {
      filtered = filtered.filter((trip) => {
        const fromCity = (trip.fromCity || "").toLowerCase()
        const fromCountry = (trip.fromCountry || "").toLowerCase()
        return fromCity.includes(originFilter) || fromCountry.includes(originFilter)
      })
    }

    // Filter by destination (search in both city and country)
    const destinationFilter = destination.trim().toLowerCase()
    if (destinationFilter) {
      filtered = filtered.filter((trip) => {
        const toCity = (trip.toCity || "").toLowerCase()
        const toCountry = (trip.toCountry || "").toLowerCase()
        return toCity.includes(destinationFilter) || toCountry.includes(destinationFilter)
      })
    }

    // Filter by departure date (trips on or after the selected date)
    if (departureDate) {
      const filterDate = new Date(departureDate)
      filterDate.setHours(0, 0, 0, 0) // Start of day
      if (!isNaN(filterDate.getTime())) {
        filtered = filtered.filter((trip) => {
          if (!trip.departureDate) return false
          const tripDate = new Date(trip.departureDate)
          tripDate.setHours(0, 0, 0, 0)
          if (isNaN(tripDate.getTime())) return false
          return tripDate >= filterDate
        })
      }
    }

    // Filter by minimum rating (API doesn't support this - client-side only)
    const ratingFilter = parseFloat(minRating || "0")
    if (ratingFilter > 0) {
      filtered = filtered.filter((trip) => {
        const travelerRating = trip.traveler?.rating || 0
        return travelerRating >= ratingFilter
      })
    }

    // Filter by language (API doesn't support this - client-side only)
    const languageFilter = selectedLanguage === "any" ? "" : selectedLanguage.trim().toLowerCase()
    if (languageFilter) {
      filtered = filtered.filter((trip) => {
        const travelerLanguages = (trip.traveler?.languages || []).map((lang: string) =>
          lang.toLowerCase()
        )
        return travelerLanguages.some((lang: string) => lang.includes(languageFilter))
      })
    }

    return filtered
  }, [availableTrips, origin, destination, departureDate, minRating, selectedLanguage])

  const handleSearch = () => {
    // Option 1: Fetch all trips and filter client-side (current approach - most flexible)
    // This allows city-name searches and filters API doesn't support
    fetchTrips(false, true)

    // Option 2: Uncomment below to use API filters for origin/destination/departureDate
    // Then client-side filtering will only apply rating and language filters
    // fetchTrips(true, true)
  }

  const handleReset = () => {
    setOrigin("")
    setDestination("")
    setDepartureDate("")
    setMinRating("0")
    setSelectedLanguage("any")
    // Fetch all trips without any filters
    fetchTrips(false, false)
  }

  const travelers = useMemo<TravelerWithTrips[]>(() => {
    const groups = new Map<string, TravelerWithTrips>()

    filteredTrips.forEach((trip) => {
      const traveler = trip.traveler || {}
      const travelerId = traveler.id || `unknown-${trip.id}`

      if (!groups.has(travelerId)) {
        groups.set(travelerId, {
          traveler,
          trips: [],
        })
      }

      groups.get(travelerId)!.trips.push(trip)
    })

    return Array.from(groups.values()).sort((a, b) => {
      const ratingA = a.traveler.rating || 0
      const ratingB = b.traveler.rating || 0
      return ratingB - ratingA
    })
  }, [filteredTrips])

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return "Dates unavailable"
    const format = (value?: string) => {
      if (!value) return undefined
      try {
        return new Date(value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      } catch {
        return value
      }
    }
    const startFormatted = format(start)
    const endFormatted = format(end)
    if (startFormatted && endFormatted) {
      return `${startFormatted} – ${endFormatted}`
    }
    return startFormatted || endFormatted || "Dates unavailable"
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSearch()
    }
  }

  const openOfferDialog = (tripId: string) => {
    setOfferTripId(tripId)
    // First, show request selection dialog
    setRequestDialogOpen(true)
    setSelectedRequestId("")
  }

  const handleRequestSelected = () => {
    if (!selectedRequestId) {
      toast({
        title: "Please select a request",
        description: "You must choose which request this offer is for",
        variant: "destructive",
      })
      return
    }
    // Close request dialog and open offer details dialog
    setRequestDialogOpen(false)
    setOfferPrice("")
    setOfferMessage("")
    setOfferDialogOpen(true)
  }

  const submitOffer = async () => {
    if (!offerTripId) {
      toast({ title: 'Error', description: 'Trip ID is missing. Please try again.', variant: 'destructive' })
      return
    }
    if (!selectedRequestId) {
      toast({ title: 'Error', description: 'Please select a request first', variant: 'destructive' })
      return
    }
    const priceNum = parseFloat(offerPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: 'Invalid price', description: 'Please enter a valid positive price', variant: 'destructive' })
      return
    }
    setOfferSubmitting(true)
    try {
      const result = await makeOffer(offerTripId, { requestId: selectedRequestId, price: priceNum, message: offerMessage })
      console.log('📍 [submitOffer] Complete result:', result)
      console.log('📍 [submitOffer] Result success:', result.success)
      console.log('📍 [submitOffer] Result message:', result.message)
      console.log('📍 [submitOffer] Message type:', typeof result.message)
      console.log('📍 [submitOffer] Message length:', result.message?.length)

      if (result.success) {
        toast({ title: 'Success', description: 'Your offer was sent to the traveler.' })
        setOfferDialogOpen(false)
        setOfferPrice('')
        setOfferMessage('')
        setSelectedRequestId('')
      } else {
        const errorMsg = result.message && result.message.trim() ? result.message : 'An error occurred. Please try again.'
        console.log('📍 [submitOffer] Final error message to display:', errorMsg)

        toast({
          title: 'Failed to send offer',
          description: errorMsg,
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error('❌ [submitOffer] Exception:', err)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setOfferSubmitting(false)
    }
  }

  return (
    <BuyerLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Find Travelers</h1>
          <p className="text-muted-foreground">
            Search for reliable travelers based on their routes, dates, ratings, and languages.
          </p>
        </div>

        {/* Search Filters */}
        <Card className="p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Search Filters</h2>
          <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" onKeyDown={handleKeyDown}>
            <div className="space-y-1.5">
              <Label htmlFor="origin" className="text-sm">Origin</Label>
              <Input
                id="origin"
                placeholder="e.g., London"
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-sm">Destination</Label>
              <Input
                id="destination"
                placeholder="e.g., New York"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="travelDates" className="text-sm">Departure Date</Label>
              <Input
                id="travelDates"
                type="date"
                value={departureDate}
                onChange={(event) => setDepartureDate(event.target.value)}
                className="h-9 text-sm"
              />
            </div>

          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[#0088cc] hover:bg-[#0077b3] text-white h-9 text-sm"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search Travelers"
              )}
            </Button>
            {(origin || destination || departureDate || minRating !== "0" || selectedLanguage !== "any") && (
              <Button type="button" variant="outline" onClick={handleReset} disabled={loading} className="h-9 text-sm">
                Reset Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Available Trips ({loading ? "…" : filteredTrips.length})
            </h2>
            {!loading && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredTrips.length} trip{filteredTrips.length === 1 ? "" : "s"}.
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#0088cc] animate-spin" />
            </div>
          ) : filteredTrips.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              <p className="text-lg font-medium text-foreground mb-2">No trips found</p>
              <p>Try adjusting your filters or check back later for new trips.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {filteredTrips.map((trip) => {
                const traveler = trip.traveler || {}
                const initials =
                  traveler.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "TR"
                const languagesText = traveler.languages?.join(", ")

                console.log('👤 [Find Travelers Card] Rendering traveler:', {
                  id: traveler.id,
                  name: traveler.name,
                  travelerFullName: traveler.travelerFullName,
                  avatarUrl: traveler.avatarUrl,
                  travelerAvatarUrl: traveler.travelerAvatarUrl,
                  fullTravelerObject: traveler
                })

                return (
                  <Card key={`${traveler.id || initials}`} className="p-3 sm:p-4 md:p-6 flex flex-col">
                    <div className="flex flex-col items-center text-center mb-4">
                      <Avatar className="w-20 h-20 mb-3">
                        <AvatarImage src={traveler.travelerAvatarUrl || traveler.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-foreground mb-1">
                        {traveler.travelerFullName || traveler.name || "Traveler"}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap justify-center">
                        {traveler.rating && (
                          <span className="font-medium text-[#f3c623]">
                            {traveler.rating.toFixed(1)}
                          </span>
                        )}
                        {traveler.totalReviews !== undefined && (
                          <span>({traveler.totalReviews} review{traveler.totalReviews === 1 ? "" : "s"})</span>
                        )}
                      </div>
                      {languagesText && (
                        <p className="text-xs text-muted-foreground mt-1">Languages: {languagesText}</p>
                      )}
                    </div>

                    <div className="space-y-3 mb-4 flex-1">
                      <p className="text-sm font-medium text-foreground">Trip Details:</p>
                      <div className="space-y-1 rounded-md border p-3 bg-muted">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-[#0088cc] mt-0.5 flex-shrink-0" />
                          <p>
                            {trip.fromCity || trip.fromCountry || "Unknown"} →{" "}
                            {trip.toCity || trip.toCountry || "Unknown"}
                          </p>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-[#0088cc] mt-0.5 flex-shrink-0" />
                          <p>
                            {formatDateRange(trip.departureDate, trip.returnDate)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {trip.availableCapacityKg !== undefined && (
                            <span className="px-2 py-1 bg-muted border rounded-full">
                              {trip.availableCapacityKg} kg capacity
                            </span>
                          )}
                          {trip.maxPackageWeightKg !== undefined && (
                            <span className="px-2 py-1 bg-muted border rounded-full">
                              Max {trip.maxPackageWeightKg} kg/package
                            </span>
                          )}
                          {trip.status && (
                            <span className="px-2 py-1 bg-muted border rounded-full capitalize">
                              {trip.status.toLowerCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button onClick={() => openOfferDialog(trip.id)} className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white" size="sm">
                        Make Offer
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
          {/* Request Selection Dialog */}
          {requestDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/50" onClick={() => setRequestDialogOpen(false)} />
              <Card className="z-50 w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Select Item to Deliver</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Which item are you offering to deliver?
                </p>
                <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                  {requestsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : myRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      You don't have any requests yet. Create a request first.
                    </p>
                  ) : (
                    <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a request..." />
                      </SelectTrigger>
                      <SelectContent>
                        {myRequests.map((request) => (
                          <SelectItem key={request.id} value={request.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{request.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {request.fromCity} → {request.toCity}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRequestDialogOpen(false)} disabled={requestsLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleRequestSelected} disabled={!selectedRequestId || requestsLoading}>
                    Continue
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Offer Dialog */}
          {offerDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/50" onClick={() => setOfferDialogOpen(false)} />
              <Card className="z-50 w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Make an Offer</h3>

                {/* Show selected request info */}
                {selectedRequestId && myRequests.find(r => r.id === selectedRequestId) && (
                  <div className="mb-4 p-3 bg-muted border rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Item:</p>
                    <p className="font-semibold text-foreground">
                      {myRequests.find(r => r.id === selectedRequestId)?.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {myRequests.find(r => r.id === selectedRequestId)?.fromCity} → {myRequests.find(r => r.id === selectedRequestId)?.toCity}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label>Price (USD)</Label>
                    <Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Message (optional)</Label>
                    <textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} className="w-full border rounded p-2 mt-1" rows={4} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOfferDialogOpen(false)} disabled={offerSubmitting}>Cancel</Button>
                    <Button onClick={submitOffer} disabled={offerSubmitting || !offerPrice || Number(offerPrice) <= 0}>
                      {offerSubmitting ? 'Sending...' : 'Send Offer'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </BuyerLayout>
  )
}
