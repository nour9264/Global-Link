"use client"

import { useState, useEffect } from "react"
import { TravelerLayout } from "@/components/traveler-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Calendar, Package, Loader2 } from "lucide-react"
import Image from "next/image"
import type { BuyerRequest } from "@/types/buyer-request"
import type { Trip } from "@/types/trip"
import { getAllRequests, makeOfferForRequest } from "@/lib/buyer-request-service"
import { getMyTrips } from "@/lib/trip-service"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as utils from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"

// Get the formatDate function from utils
const { formatDate } = utils

export default function AvailableRequestsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<BuyerRequest[]>([])
  const [myTrips, setMyTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchRequests()
    fetchMyTrips()
  }, [])

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Debug: Log auth state
      const token = localStorage.getItem("authToken")
      console.log("🔑 Auth token present:", !!token)

      const data = await getAllRequests()
      console.log("📦 Fetched requests:", data)

      if (!data || !Array.isArray(data)) {
        console.warn("⚠️ Received invalid data format:", data)
        throw new Error("Invalid response format from server")
      }

      setRequests(data)
    } catch (err) {
      console.error("❌ Error fetching requests:", err)
      const message = err instanceof Error ? err.message : "Failed to fetch requests"
      setError(message)
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMyTrips = async () => {
    try {
      const trips = await getMyTrips()
      console.log("📦 Fetched my trips:", trips)
      setMyTrips(trips)
    } catch (err) {
      console.error("❌ Error fetching trips:", err)
      toast({ title: 'Warning', description: 'Failed to fetch your trips. You need a trip to make an offer.', variant: 'destructive' })
    }
  }

  const filteredRequests = requests.filter(request => {
    const searchTerms = searchQuery.toLowerCase()
    return (
      request.title?.toLowerCase().includes(searchTerms) ||
      request.toCity?.toLowerCase().includes(searchTerms) ||
      request.toCountry?.toLowerCase().includes(searchTerms) ||
      request.description?.toLowerCase().includes(searchTerms)
    )
  })

  const handleMakeOffer = (requestId: string) => {
    openOfferDialog(requestId)
  }

  // Offer dialog state
  const [offerOpen, setOfferOpen] = useState(false)
  const [offerRequestId, setOfferRequestId] = useState<string | null>(null)
  const [offerPrice, setOfferPrice] = useState("")
  const [offerMessage, setOfferMessage] = useState("")
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [offerSubmitting, setOfferSubmitting] = useState(false)

  const openOfferDialog = (requestId: string) => {
    setOfferRequestId(requestId)
    setOfferPrice("")
    setOfferMessage("")
    setSelectedTripId("")
    setOfferOpen(true)
  }

  const closeOfferDialog = () => {
    setOfferOpen(false)
    setOfferRequestId(null)
  }

  const submitOffer = async () => {
    if (!offerRequestId) {
      toast({ title: 'Error', description: 'Request ID is missing. Please try again.', variant: 'destructive' })
      return
    }
    if (!selectedTripId) {
      toast({ title: 'Error', description: 'Please select a trip for this offer.', variant: 'destructive' })
      return
    }
    const priceNum = parseFloat(offerPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: 'Invalid price', description: 'Please enter a valid positive price', variant: 'destructive' })
      return
    }
    setOfferSubmitting(true)
    try {
      const result = await makeOfferForRequest(offerRequestId, {
        price: priceNum,
        message: offerMessage,
        travelerTripId: selectedTripId
      })
      console.log('📍 [submitOffer] Complete result:', result)

      if (result.success) {
        toast({ title: 'Success', description: 'Your offer was sent to the buyer.' })
        closeOfferDialog()
        setOfferPrice('')
        setOfferMessage('')
        setSelectedTripId('')
      } else {
        const errorMsg = result.message && result.message.trim() ? result.message : 'An error occurred. Please try again.'
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
    <TravelerLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Available Requests</h1>
          <p className="text-muted-foreground mt-1">Browse delivery requests that match your travel plans</p>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by destination or item..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">Filters</Button>
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#0088cc]" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRequests} variant="outline">
              Try Again
            </Button>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredRequests.length === 0 && (
          <Card className="p-6 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Requests Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No requests match your search criteria. Try different keywords."
                : "There are no available requests at the moment."}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery("")} variant="outline">
                Clear Search
              </Button>
            )}
          </Card>
        )}

        {/* Requests Grid */}
        {!isLoading && !error && filteredRequests.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <div className="relative h-48 bg-muted">
                  {request.photos && request.photos.length > 0 ? (
                    <>
                      {(() => {
                        const originalUrl = request.photos[0];
                        const processedUrl = utils.ensureAbsoluteUrl(originalUrl);
                        console.log('🖼️ Image Debug:', {
                          requestTitle: request.title,
                          originalUrl,
                          processedUrl,
                          API_BASE_URL_RUNTIME: API_BASE_URL
                        });
                        return null;
                      })()}
                      <Image
                        src={utils.ensureAbsoluteUrl(request.photos[0]) || "/placeholder.svg"}
                        alt={request.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{request.title}</h3>
                    <Badge className="bg-[#0088cc] hover:bg-[#0088cc]">
                      ${request.budgetMax || request.itemValue || 0}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>To {request.toCity}, {request.toCountry}</span>
                    </div>
                    {request.targetArrivalDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>By {formatDate(request.targetArrivalDate)}</span>
                      </div>
                    )}
                    {request.estimatedTotalWeightKg && (
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span>
                          {request.estimatedTotalWeightKg < 2
                            ? "Small"
                            : request.estimatedTotalWeightKg < 5
                              ? "Medium"
                              : "Large"}
                          ({request.estimatedTotalWeightKg}kg)
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white"
                    onClick={() => handleMakeOffer(request.id)}
                  >
                    Make Offer
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Offer Dialog */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>Send a price and an optional message to the buyer.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            <div>
              <Label htmlFor="trip-select">Select Your Trip</Label>
              {myTrips.length === 0 ? (
                <div className="text-sm text-red-500 mt-1">
                  You need to create a trip before making an offer.
                </div>
              ) : (
                <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                  <SelectTrigger id="trip-select" className="mt-1">
                    <SelectValue placeholder="Select a trip..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myTrips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.fromCity} → {trip.toCity} ({formatDate(trip.departureDate)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>Price (USD)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="Add a short note to the buyer"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                className="mt-1 h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeOfferDialog} className="mr-2">
              Cancel
            </Button>
            <Button onClick={submitOffer} disabled={offerSubmitting || !selectedTripId || myTrips.length === 0}>
              {offerSubmitting ? "Sending..." : "Send Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TravelerLayout>
  )
}
