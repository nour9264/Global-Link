"use client"

import { useEffect, useState } from "react"
import { TravelerLayout } from "@/components/traveler-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getMyTrips, getOffersByTripId, getMyOffers, getTripById } from "@/lib/trip-service"
import { getMatchIdByOfferId } from "@/lib/buyer-request-service"
import { acceptOffer, rejectOffer } from "@/lib/offer-action-service"
import { getOfferById } from "@/lib/offer-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import type { Trip } from "@/types/trip"
import type { Offer } from "@/types/offer"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function OffersPage() {
  const [respondOffer, setRespondOffer] = useState<Offer | null>(null);
  const [respondTrip, setRespondTrip] = useState<any>(null);
  const [respondRequest, setRespondRequest] = useState<any>(null);
  const [respondLoading, setRespondLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsMap, setTripsMap] = useState<Map<string, Trip>>(new Map())
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [offersFromBuyers, setOffersFromBuyers] = useState<Offer[]>([])
  const [offersToBuyers, setOffersToBuyers] = useState<Offer[]>([])
  const [offersFromBuyersLoading, setOffersFromBuyersLoading] = useState(false)
  const [offersToBuyersLoading, setOffersToBuyersLoading] = useState(true)
  const [tripsLoading, setTripsLoading] = useState(true)

  // Load traveler's trips on mount and cache them in a Map for quick lookup
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setTripsLoading(true)
        const myTrips = await getMyTrips()
        setTrips(myTrips)

        // Build a Map for O(1) lookup by tripId
        const map = new Map<string, Trip>()
        myTrips.forEach(trip => map.set(trip.id, trip))
        setTripsMap(map)

        if (myTrips.length > 0) {
          setSelectedTripId(myTrips[0].id)
        }
      } catch (error) {
        console.error("Failed to load trips:", error)
        toast.error("Failed to load your trips")
      } finally {
        setTripsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Load offers to buyers on mount - no enrichment needed, request details fetched on-demand
  useEffect(() => {
    const loadOffersToBuyers = async () => {
      try {
        setOffersToBuyersLoading(true)
        const offers = await getMyOffers()
        console.log('[Traveler Offers] Loaded offers to buyers:', offers.length)
        setOffersToBuyers(offers)
      } catch (error) {
        console.error("Failed to load offers to buyers:", error)
        toast.error("Failed to load your offers")
      } finally {
        setOffersToBuyersLoading(false)
      }
    }
    loadOffersToBuyers()
  }, [])

  // Load offers from buyers when trip is selected - no enrichment needed
  useEffect(() => {
    const loadOffers = async () => {
      if (!selectedTripId) return
      try {
        setOffersFromBuyersLoading(true)
        const fetchedOffers = await getOffersByTripId(selectedTripId)
        setOffersFromBuyers(fetchedOffers)
      } catch (error) {
        console.error("Failed to load offers:", error)
        toast.error("Failed to load offers for this trip")
      } finally {
        setOffersFromBuyersLoading(false)
      }
    }
    loadOffers()
  }, [selectedTripId])

  return (
    <TravelerLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Offers</h1>
          <p className="text-muted-foreground mt-1">Manage your delivery offers and track their status</p>
        </div>

        <Tabs defaultValue="to-buyers" className="w-full mt-6">
          <TabsList>
            <TabsTrigger value="to-buyers">My Offers to Buyers</TabsTrigger>
            <TabsTrigger value="from-buyers">My Offers from Buyers</TabsTrigger>
          </TabsList>

          <TabsContent value="to-buyers" className="space-y-4 mt-4">
            {offersToBuyersLoading ? (
              <Card className="p-6 flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading your offers...</span>
              </Card>
            ) : offersToBuyers.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  You haven't made any offers to buyers yet.
                </p>
              </Card>
            ) : (
              offersToBuyers.map((offer) => (
                <Card key={offer.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {offer.requestTitle || offer.request?.title || `Offer #${offer.id.substring(0, 8)}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Amount offered: ${offer.price}
                      </p>
                      {offer.request && (
                        <div className="mt-2 text-sm text-muted-foreground space-y-1">
                          {offer.request.category && (
                            <p className="flex items-center gap-1">
                              <span className="font-medium">Category:</span> {offer.request.category}
                            </p>
                          )}
                          {offer.request.description && (
                            <p className="line-clamp-2">
                              <span className="font-medium">Description:</span> {offer.request.description}
                            </p>
                          )}
                          {offer.request.fromCity && (
                            <p className="flex items-center gap-1">
                              <span className="font-medium">Route:</span> {offer.request.fromCity}, {offer.request.fromCountry} → {offer.request.toCity}, {offer.request.toCountry}
                            </p>
                          )}
                          {offer.request.itemValue !== undefined && (
                            <p>
                              <span className="font-medium">Item Value:</span> ${offer.request.itemValue}
                            </p>
                          )}
                          {offer.request.totalPackages !== undefined && (
                            <p>
                              <span className="font-medium">Packages:</span> {offer.request.totalPackages}
                            </p>
                          )}
                          {offer.request.estimatedTotalWeightKg !== undefined && (
                            <p>
                              <span className="font-medium">Est. Weight:</span> {offer.request.estimatedTotalWeightKg} kg
                            </p>
                          )}
                          {offer.request.targetArrivalDate && (
                            <p>
                              <span className="font-medium">Target Date:</span> {new Date(offer.request.targetArrivalDate as any).toLocaleDateString?.() || offer.request.targetArrivalDate}
                            </p>
                          )}
                          {offer.request.urgency && (
                            <p>
                              <span className="font-medium">Urgency:</span> {offer.request.urgency}
                            </p>
                          )}
                          {offer.request.isFragile && (
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">Fragile</span>
                            </div>
                          )}
                          {offer.request.batteryType && (
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs border border-amber-200">Battery: {offer.request.batteryType}</span>
                            </div>
                          )}
                          {offer.request.photos?.length ? (
                            <div className="mt-2">
                              <img src={offer.request.photos[0] as string} alt="Item photo" className="w-20 h-20 object-cover rounded border" />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <Badge
                      className={
                        offer.status === "Accepted"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : offer.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : offer.status === "Delivered"
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                      }
                    >
                      {offer.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground border-t pt-3">
                    <p>
                      <span className="font-medium">Offer Amount:</span> ${offer.price}
                    </p>
                    {offer.message && (
                      <p>
                        <span className="font-medium">Message:</span> {offer.message}
                      </p>
                    )}
                    {offer.createdAt && (
                      <p>
                        <span className="font-medium">Offer Date:</span>{" "}
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white" onClick={() => window.location.href = `/offer-details?offerId=${offer.id}`}>View Details</Button>
                    {offer.status === "Accepted" && (
                      <Button
                        variant="outline"
                        className="border-green-500 text-green-700 hover:bg-green-50"
                        onClick={async () => {
                          if (offer.matchId) {
                            window.location.href = `/traveler/order-status?matchId=${offer.matchId}`
                          } else {
                            try {
                              toast.info("Fetching order details...")
                              const matchId = await getMatchIdByOfferId(offer.id)
                              if (matchId) {
                                window.location.href = `/traveler/order-status?matchId=${matchId}`
                              } else {
                                toast.error("Match ID not found for this offer")
                              }
                            } catch (e) {
                              console.error("Error fetching match ID:", e)
                              toast.error("Failed to load order status")
                            }
                          }
                        }}
                      >
                        Show Order Status
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="from-buyers" className="space-y-4 mt-4">
            {/* Trip Selector */}
            <Card className="p-6 bg-muted border">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Select a trip to view offers from buyers:
                </label>
                {tripsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading your trips...</span>
                  </div>
                ) : trips.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No trips found. Create a trip first to see offers from buyers.
                  </p>
                ) : (
                  <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a trip..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.fromCity} → {trip.toCity} - {trip.departureDate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </Card>

            {/* Offers List */}
            {selectedTripId && (
              <div className="space-y-4">
                {offersFromBuyersLoading ? (
                  <Card className="p-6 flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading offers...</span>
                  </Card>
                ) : offersFromBuyers.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No offers yet for this trip. Check back later!
                    </p>
                  </Card>
                ) : (
                  offersFromBuyers.map((offer) => (
                    <Card key={offer.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {offer.requestTitle || offer.request?.title || `Offer #${offer.id.substring(0, 8)}`}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Amount offered: ${offer.price}
                          </p>
                          {offer.request && (
                            <div className="mt-2 text-sm text-muted-foreground space-y-1">
                              {offer.request.category && (
                                <p className="flex items-center gap-1">
                                  <span className="font-medium">Category:</span> {offer.request.category}
                                </p>
                              )}
                              {offer.request.description && (
                                <p className="line-clamp-2">
                                  <span className="font-medium">Description:</span> {offer.request.description}
                                </p>
                              )}
                              {offer.request.fromCity && (
                                <p className="flex items-center gap-1">
                                  <span className="font-medium">Route:</span> {offer.request.fromCity}, {offer.request.fromCountry} → {offer.request.toCity}, {offer.request.toCountry}
                                </p>
                              )}
                              {offer.request.itemValue !== undefined && (
                                <p>
                                  <span className="font-medium">Item Value:</span> ${offer.request.itemValue}
                                </p>
                              )}
                              {offer.request.totalPackages !== undefined && (
                                <p>
                                  <span className="font-medium">Packages:</span> {offer.request.totalPackages}
                                </p>
                              )}
                              {offer.request.estimatedTotalWeightKg !== undefined && (
                                <p>
                                  <span className="font-medium">Est. Weight:</span> {offer.request.estimatedTotalWeightKg} kg
                                </p>
                              )}
                              {offer.request.targetArrivalDate && (
                                <p>
                                  <span className="font-medium">Target Date:</span> {new Date(offer.request.targetArrivalDate as any).toLocaleDateString?.() || offer.request.targetArrivalDate}
                                </p>
                              )}
                              {offer.request.urgency && (
                                <p>
                                  <span className="font-medium">Urgency:</span> {offer.request.urgency}
                                </p>
                              )}
                              {offer.request.isFragile && (
                                <div className="flex flex-wrap gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">Fragile</span>
                                </div>
                              )}
                              {offer.request.batteryType && (
                                <div className="flex flex-wrap gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs border border-amber-200">Battery: {offer.request.batteryType}</span>
                                </div>
                              )}
                              {offer.request.photos?.length ? (
                                <div className="mt-2">
                                  <img src={offer.request.photos[0] as string} alt="Item photo" className="w-20 h-20 object-cover rounded border" />
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                        <Badge
                          className={
                            offer.status === "Accepted"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : offer.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : offer.status === "Delivered"
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground border-t pt-3">
                        <p>
                          <span className="font-medium">Offer Amount:</span> ${offer.price}
                        </p>
                        {offer.message && (
                          <p>
                            <span className="font-medium">Message:</span> {offer.message}
                          </p>
                        )}
                        {offer.createdAt && (
                          <p>
                            <span className="font-medium">Offer Date:</span>{" "}
                            {new Date(offer.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white" onClick={() => window.location.href = `/offer-details?offerId=${offer.id}`}>View Details</Button>
                        {offer.status === "Accepted" ? (
                          <Button
                            variant="outline"
                            className="border-green-500 text-green-700 hover:bg-green-50"
                            onClick={async () => {
                              if (offer.matchId) {
                                window.location.href = `/traveler/order-status?matchId=${offer.matchId}`
                              } else {
                                try {
                                  toast.info("Fetching order details...")
                                  const matchId = await getMatchIdByOfferId(offer.id)
                                  if (matchId) {
                                    window.location.href = `/traveler/order-status?matchId=${matchId}`
                                  } else {
                                    toast.error("Match ID not found for this offer")
                                  }
                                } catch (e) {
                                  console.error("Error fetching match ID:", e)
                                  toast.error("Failed to load order status")
                                }
                              }
                            }}
                          >
                            Show Order Status
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={async () => {
                            // Fetch the full offer details with request data
                            setRespondLoading(true);
                            try {
                              console.log('🔍 [Respond] Fetching full offer details for:', offer.id);
                              const fullOffer = await getOfferById(offer.id);
                              console.log('✅ [Respond] Full offer data:', fullOffer);
                              setRespondOffer(fullOffer);
                            } catch (e) {
                              console.error('❌ [Respond] Error fetching offer details:', e);
                              toast.error('Failed to load offer details');
                              // Fallback to the offer we already have
                              setRespondOffer(offer);
                            } finally {
                              setRespondLoading(false);
                            }
                          }}>Respond</Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Respond Modal */}
        <Dialog open={!!respondOffer} onOpenChange={open => { if (!open) { setRespondOffer(null); setRespondTrip(null); setRespondRequest(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to Offer</DialogTitle>
            </DialogHeader>
            {respondLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Loading details...</div>
            ) : respondOffer ? (
              <div className="space-y-2 text-sm">
                <div><b className="text-foreground">Offer Amount:</b> <span className="text-muted-foreground">${respondOffer.price}</span></div>
                <div><b className="text-foreground">Message:</b> <span className="text-muted-foreground">{respondOffer.message}</span></div>
                <div><b className="text-foreground">Status:</b> <span className="text-muted-foreground">{respondOffer.status}</span></div>
                <div><b className="text-foreground">Offer Date:</b> <span className="text-muted-foreground">{respondOffer.createdAt ? new Date(respondOffer.createdAt).toLocaleString() : "-"}</span></div>
                {respondOffer.request && (
                  <div className="mt-2 p-3 border border-border rounded bg-muted text-muted-foreground">
                    <b className="text-foreground">Item/Request Details:</b><br />
                    <div className="mt-2 space-y-1">
                      {respondOffer.request.title && <div><b className="text-foreground">Title:</b> {respondOffer.request.title}</div>}
                      {respondOffer.request.category && <div><b className="text-foreground">Category:</b> {respondOffer.request.category}</div>}
                      {respondOffer.request.fromCity && <div><b className="text-foreground">Route:</b> {respondOffer.request.fromCity}, {respondOffer.request.fromCountry} → {respondOffer.request.toCity}, {respondOffer.request.toCountry}</div>}
                      {respondOffer.request.description && <div><b className="text-foreground">Description:</b> {respondOffer.request.description}</div>}

                      {respondOffer.request.estimatedTotalWeightKg !== undefined && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <b className="text-foreground">Package Information:</b><br />
                          <div>• Weight: {respondOffer.request.estimatedTotalWeightKg} kg</div>
                        </div>
                      )}

                      {(respondOffer.request.itemValue !== undefined || respondOffer.request.budgetMax || respondOffer.request.urgency || respondOffer.request.targetArrivalDate) && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <b className="text-foreground">Additional Details:</b><br />
                          {respondOffer.request.itemValue !== undefined && <div>• Item Value: ${respondOffer.request.itemValue}</div>}
                          {respondOffer.request.budgetMax !== undefined && <div>• Max Budget: ${respondOffer.request.budgetMax}</div>}
                          {respondOffer.request.urgency && <div>• Urgency: {respondOffer.request.urgency}</div>}
                          {respondOffer.request.targetArrivalDate && <div>• Target Arrival: {new Date(respondOffer.request.targetArrivalDate as any).toLocaleDateString()}</div>}
                        </div>
                      )}

                      {(respondOffer.request.isFragile || respondOffer.request.batteryType) && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <b className="text-foreground">Special Handling:</b><br />
                          {respondOffer.request.isFragile && <div>• ⚠️ Fragile Item</div>}
                          {respondOffer.request.batteryType && <div>• 🔋 Battery Type: {respondOffer.request.batteryType}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="destructive" disabled={respondLoading} onClick={async () => {
                if (!respondOffer) return;
                setRespondLoading(true);
                try {
                  await rejectOffer(respondOffer.id);
                  toast.success("Offer rejected.");
                  setRespondOffer(null);
                  setRespondTrip(null);
                  setRespondRequest(null);
                  setOffersFromBuyers((prev) => prev.filter(o => o.id !== respondOffer.id));
                } catch (e) {
                  toast.error("Failed to reject offer.");
                } finally {
                  setRespondLoading(false);
                }
              }}>Reject</Button>
              <Button variant="default" disabled={respondLoading} onClick={async () => {
                if (!respondOffer) return;
                setRespondLoading(true);
                try {
                  await acceptOffer(respondOffer.id);
                  toast.success("Offer accepted.");
                  setRespondOffer(null);
                  setRespondTrip(null);
                  setRespondRequest(null);
                  setOffersFromBuyers((prev) => prev.map(o => o.id === respondOffer.id ? { ...o, status: "Accepted" } : o));
                } catch (e) {
                  toast.error("Failed to accept offer.");
                } finally {
                  setRespondLoading(false);
                }
              }}>Accept</Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TravelerLayout>
  )
}
