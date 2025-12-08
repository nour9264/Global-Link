"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BuyerLayout } from "@/components/buyer-layout"
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
import { getMyRequests, getOffersByRequestId, getMyOffers, getRequestById, getMatchIdByOfferId } from "@/lib/buyer-request-service"
import { getTripById } from "@/lib/trip-service"
import { acceptOffer, rejectOffer } from "@/lib/offer-action-service"
import {
  DynamicDialog as Dialog,
  DynamicDialogContent as DialogContent,
  DynamicDialogHeader as DialogHeader,
  DynamicDialogTitle as DialogTitle,
  DynamicDialogFooter as DialogFooter,
  DynamicDialogClose as DialogClose
} from "./dynamic-components"
import type { BuyerRequest } from "@/types/buyer-request"
import type { Offer } from "@/types/offer"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"



export default function BuyerOffersPage() {
  const router = useRouter()
  const [respondOffer, setRespondOffer] = useState<Offer | null>(null);
  const [respondTrip, setRespondTrip] = useState<any>(null);
  const [respondRequest, setRespondRequest] = useState<any>(null);
  const [respondLoading, setRespondLoading] = useState(false);
  const [requests, setRequests] = useState<BuyerRequest[]>([])
  const [requestsMap, setRequestsMap] = useState<Map<string, BuyerRequest>>(new Map())
  const [selectedRequestId, setSelectedRequestId] = useState<string>("")
  const [offersFromTravelers, setOffersFromTravelers] = useState<Offer[]>([])
  const [offersToTravelers, setOffersToTravelers] = useState<Offer[]>([])
  const [offersFromTravelersLoading, setOffersFromTravelersLoading] = useState(false)
  const [offersToTravelersLoading, setOffersToTravelersLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(true)

  // Load buyer's requests on mount and cache them in a Map for quick lookup
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setRequestsLoading(true)
        const myRequests = await getMyRequests()
        setRequests(myRequests)

        // Build a Map for O(1) lookup by requestId
        const map = new Map<string, BuyerRequest>()
        myRequests.forEach(request => map.set(request.id, request))
        setRequestsMap(map)

        if (myRequests.length > 0) {
          setSelectedRequestId(myRequests[0].id)
        }
      } catch (error) {
        toast.error("Failed to load your requests")
      } finally {
        setRequestsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Load offers to travellers on mount - no enrichment needed, use requestsMap
  useEffect(() => {
    const loadOffersToTravelers = async () => {
      try {
        setOffersToTravelersLoading(true)
        const offers = await getMyOffers()
        setOffersToTravelers(offers)
      } catch (error) {
        toast.error("Failed to load your offers")
      } finally {
        setOffersToTravelersLoading(false)
      }
    }
    loadOffersToTravelers()
  }, [])

  // Load offers from travellers when request is selected - no enrichment needed
  useEffect(() => {
    const loadOffers = async () => {
      if (!selectedRequestId) return
      try {
        setOffersFromTravelersLoading(true)
        const fetchedOffers = await getOffersByRequestId(selectedRequestId)
        setOffersFromTravelers(fetchedOffers)
      } catch (error) {
        toast.error("Failed to load offers for this request")
      } finally {
        setOffersFromTravelersLoading(false)
      }
    }
    loadOffers()
  }, [selectedRequestId])

  return (
    <BuyerLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Offers</h1>
          <p className="text-muted-foreground mt-1">Manage your delivery offers and track their status</p>
        </div>

        <Tabs defaultValue="to-travelers" className="w-full mt-6">
          <TabsList>
            <TabsTrigger value="to-travelers">My Offers to travellers</TabsTrigger>
            <TabsTrigger value="from-travelers">My Offers from travellers</TabsTrigger>
          </TabsList>

          <TabsContent value="to-travelers" className="space-y-4 mt-4">
            {offersToTravelersLoading ? (
              <Card className="p-6 flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading your offers...</span>
              </Card>
            ) : offersToTravelers.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  You haven't made any offers to travellers yet.
                </p>
              </Card>
            ) : (
              offersToTravelers.map((offer) => {
                // Lookup request details from the cached map
                const request = offer.requestId ? requestsMap.get(offer.requestId) : null

                return (
                  <Card key={offer.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {offer.requestTitle || offer.request?.title || request?.title || `Offer #${offer.id.substring(0, 8)}`}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Amount offered: ${offer.price}
                        </p>
                        {(offer.request || request) ? (
                          <div className="mt-2 text-sm text-muted-foreground space-y-1">
                            {(offer.request?.category || request?.category) && (
                              <p className="flex items-center gap-1">
                                <span className="font-medium">Category:</span> {offer.request?.category || request?.category}
                              </p>
                            )}
                            {(offer.request?.description || request?.description) && (
                              <p className="line-clamp-2">
                                <span className="font-medium">Description:</span> {offer.request?.description || request?.description}
                              </p>
                            )}
                            {(offer.request?.fromCity || request?.fromCity) && (
                              <p className="flex items-center gap-1">
                                <span className="font-medium">Route:</span> {offer.request?.fromCity || request?.fromCity}, {offer.request?.fromCountry || request?.fromCountry} → {offer.request?.toCity || request?.toCity}, {offer.request?.toCountry || request?.toCountry}
                              </p>
                            )}
                            {(offer.request?.itemValue ?? request?.itemValue) !== undefined && (
                              <p>
                                <span className="font-medium">Item Value:</span> ${offer.request?.itemValue ?? request?.itemValue}
                              </p>
                            )}
                            {((offer.request?.budgetMax ?? request?.budgetMax) !== undefined) && (
                              <p>
                                <span className="font-medium">Buyer Budget Max:</span> ${offer.request?.budgetMax ?? request?.budgetMax}
                              </p>
                            )}
                            {(offer.request?.totalPackages ?? request?.totalPackages) !== undefined && (
                              <p>
                                <span className="font-medium">Packages:</span> {offer.request?.totalPackages ?? request?.totalPackages}
                              </p>
                            )}
                            {(offer.request?.estimatedTotalWeightKg ?? request?.estimatedTotalWeightKg) !== undefined && (
                              <p>
                                <span className="font-medium">Est. Weight:</span> {offer.request?.estimatedTotalWeightKg ?? request?.estimatedTotalWeightKg} kg
                              </p>
                            )}
                            {(offer.request?.targetArrivalDate || request?.targetArrivalDate) && (
                              <p>
                                <span className="font-medium">Target Date:</span> {new Date(offer.request?.targetArrivalDate || (request?.targetArrivalDate as any)).toLocaleDateString?.() || (offer.request?.targetArrivalDate || request?.targetArrivalDate)}
                              </p>
                            )}
                            {(offer.request?.urgency || request?.urgency) && (
                              <p>
                                <span className="font-medium">Urgency:</span> {offer.request?.urgency || request?.urgency}
                              </p>
                            )}
                            {(offer.request?.isFragile ?? request?.isFragile) && (
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">Fragile</span>
                              </div>
                            )}
                            {(offer.request?.batteryType || request?.batteryType) && (
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs border border-amber-200">Battery: {offer.request?.batteryType || request?.batteryType}</span>
                              </div>
                            )}
                            {(offer.request?.photos?.length || request?.photos?.length) ? (
                              <div className="mt-2">
                                <img
                                  src={(offer.request?.photos?.[0] || request?.photos?.[0]) as string}
                                  alt="Item photo"
                                  className="w-20 h-20 object-cover rounded border"
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : offer.requestId ? (
                          <p className="text-xs text-gray-500 mt-1">Request ID: {offer.requestId.substring(0, 8)}...</p>
                        ) : null}
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
                      <Button className="bg-[#0088cc] hover:bg-[#0077b3]" onClick={() => router.push(`/offer-details?offerId=${offer.id}`)}>View Details</Button>
                      {offer.status === "Accepted" && (
                        <Button
                          variant="outline"
                          className="border-green-500 text-green-700 hover:bg-green-50"
                          onClick={async () => {
                            if (offer.matchId) {
                              router.push(`/buyer/order-status?matchId=${offer.matchId}`)
                            } else {
                              try {
                                toast.info("Fetching order details...")
                                const matchId = await getMatchIdByOfferId(offer.id)
                                if (matchId) {
                                  router.push(`/buyer/order-status?matchId=${matchId}`)
                                } else {
                                  toast.error("Match ID not found for this offer")
                                }
                              } catch (e) {
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
                )
              })
            )}
          </TabsContent>

          <TabsContent value="from-travelers" className="space-y-4 mt-4">
            {/* Request Selector */}
            <Card className="p-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Select a request to view offers from travellers:
                </label>
                {requestsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading your requests...</span>
                  </div>
                ) : requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No requests found. Create a request first to see offers from travellers.
                  </p>
                ) : (
                  <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a request..." />
                    </SelectTrigger>
                    <SelectContent>
                      {requests.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.title} - {req.fromCity} → {req.toCity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </Card>

            {/* Offers List */}
            {selectedRequestId && (
              <div className="space-y-4">
                {offersFromTravelersLoading ? (
                  <Card className="p-6 flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    <span className="text-muted-foreground">Loading offers...</span>
                  </Card>
                ) : offersFromTravelers.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No offers yet for this request. Check back later!
                    </p>
                  </Card>
                ) : (
                  offersFromTravelers.map((offer) => {
                    // Lookup request details from the cached map
                    const request = offer.requestId ? requestsMap.get(offer.requestId) : null

                    return (
                      <Card key={offer.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground">
                              {offer.requestTitle || offer.request?.title || request?.title || `Offer #${offer.id.substring(0, 8)}`}
                            </h3>
                            {offer.travelerName && (
                              <p className="text-sm text-muted-foreground mt-1">
                                From: {offer.travelerName} {offer.travelerRating ? `(${offer.travelerRating}⭐)` : ""}
                              </p>
                            )}
                            {(offer.request || request) ? (
                              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                {(offer.request?.category || request?.category) && (
                                  <p className="flex items-center gap-1">
                                    <span className="font-medium">Category:</span> {offer.request?.category || request?.category}
                                  </p>
                                )}
                                {(offer.request?.description || request?.description) && (
                                  <p className="line-clamp-2">
                                    <span className="font-medium">Description:</span> {offer.request?.description || request?.description}
                                  </p>
                                )}
                                {(offer.request?.fromCity || request?.fromCity) && (
                                  <p className="flex items-center gap-1">
                                    <span className="font-medium">Route:</span> {offer.request?.fromCity || request?.fromCity}, {offer.request?.fromCountry || request?.fromCountry} → {offer.request?.toCity || request?.toCity}, {offer.request?.toCountry || request?.toCountry}
                                  </p>
                                )}
                                {(offer.request?.itemValue ?? request?.itemValue) !== undefined && (
                                  <p>
                                    <span className="font-medium">Item Value:</span> ${offer.request?.itemValue ?? request?.itemValue}
                                  </p>
                                )}
                                {((offer.request?.budgetMax ?? request?.budgetMax) !== undefined) && (
                                  <p>
                                    <span className="font-medium">Buyer Budget Max:</span> ${offer.request?.budgetMax ?? request?.budgetMax}
                                  </p>
                                )}
                                {(offer.request?.totalPackages ?? request?.totalPackages) !== undefined && (
                                  <p>
                                    <span className="font-medium">Packages:</span> {offer.request?.totalPackages ?? request?.totalPackages}
                                  </p>
                                )}
                                {(offer.request?.estimatedTotalWeightKg ?? request?.estimatedTotalWeightKg) !== undefined && (
                                  <p>
                                    <span className="font-medium">Est. Weight:</span> {offer.request?.estimatedTotalWeightKg ?? request?.estimatedTotalWeightKg} kg
                                  </p>
                                )}
                                {(offer.request?.targetArrivalDate || request?.targetArrivalDate) && (
                                  <p>
                                    <span className="font-medium">Target Date:</span> {new Date(offer.request?.targetArrivalDate || (request?.targetArrivalDate as any)).toLocaleDateString?.() || (offer.request?.targetArrivalDate || request?.targetArrivalDate)}
                                  </p>
                                )}
                                {(offer.request?.urgency || request?.urgency) && (
                                  <p>
                                    <span className="font-medium">Urgency:</span> {offer.request?.urgency || request?.urgency}
                                  </p>
                                )}
                                {(offer.request?.isFragile ?? request?.isFragile) && (
                                  <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">Fragile</span>
                                  </div>
                                )}
                                {(offer.request?.batteryType || request?.batteryType) && (
                                  <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs border border-amber-200">Battery: {offer.request?.batteryType || request?.batteryType}</span>
                                  </div>
                                )}
                                {(offer.request?.photos?.length || request?.photos?.length) ? (
                                  <div className="mt-2">
                                    <img
                                      src={(offer.request?.photos?.[0] || request?.photos?.[0]) as string}
                                      alt="Item photo"
                                      className="w-20 h-20 object-cover rounded border"
                                    />
                                  </div>
                                ) : null}
                              </div>
                            ) : offer.requestId ? (
                              <p className="text-xs text-muted-foreground mt-1">Request ID: {offer.requestId.substring(0, 8)}...</p>
                            ) : null}
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
                          <Button className="bg-[#0088cc] hover:bg-[#0077b3]" onClick={() => router.push(`/offer-details?offerId=${offer.id}`)}>View Details</Button>
                          {offer.status === "Accepted" ? (
                            <Button
                              variant="outline"
                              className="border-green-500 text-green-700 hover:bg-green-50"
                              onClick={async () => {
                                if (offer.matchId) {
                                  router.push(`/buyer/order-status?matchId=${offer.matchId}`)
                                } else {
                                  try {
                                    toast.info("Fetching order details...")
                                    const matchId = await getMatchIdByOfferId(offer.id)
                                    if (matchId) {
                                      router.push(`/buyer/order-status?matchId=${matchId}`)
                                    } else {
                                      toast.error("Match ID not found for this offer")
                                    }
                                  } catch (e) {
                                    toast.error("Failed to load order status")
                                  }
                                }
                              }}
                            >
                              Show Order Status
                            </Button>
                          ) : (
                            <Button variant="outline" onClick={async () => {
                              setRespondOffer(offer);
                              setRespondTrip(null);
                              setRespondRequest(null);
                              setRespondLoading(true);
                              try {
                                if (offer.tripId) {
                                  const trip = await getTripById(offer.tripId);
                                  setRespondTrip(trip);
                                }
                                if (offer.requestId) {
                                  // Strategy 1: Look up in local state (Best for Buyer)
                                  const localRequest = requests.find(r => r.id === offer.requestId);
                                  if (localRequest) {
                                    setRespondRequest(localRequest);
                                  } else {
                                    // Strategy 2: Fetch from API or use Embedded
                                    try {
                                      const request = await getRequestById(offer.requestId);
                                      setRespondRequest(request);
                                    } catch (reqError) {
                                      // Fallback: Use embedded request data if available
                                      if (offer.request) {
                                        setRespondRequest(offer.request);
                                      } else if (offer.requestTitle) {
                                        // Construct a minimal request object
                                        setRespondRequest({
                                          id: offer.requestId,
                                          title: offer.requestTitle,
                                        });
                                      }
                                    }
                                  }
                                }
                              } catch (e) {
                                // Silently handle error
                              } finally {
                                setRespondLoading(false);
                              }
                            }}>Respond</Button>
                          )}
                        </div>
                        {/* Respond Modal */}
                        <Dialog open={!!respondOffer} onOpenChange={open => { if (!open) { setRespondOffer(null); setRespondTrip(null); setRespondRequest(null); } }}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Respond to Offer</DialogTitle>
                            </DialogHeader>
                            {respondLoading ? (
                              <div className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading details...</div>
                            ) : respondOffer ? (
                              <div className="space-y-2">
                                <div><b>Offer Amount:</b> ${respondOffer.price}</div>
                                <div><b>Message:</b> {respondOffer.message}</div>
                                <div><b>Status:</b> {respondOffer.status}</div>
                                <div><b>Offer Date:</b> {respondOffer.createdAt ? new Date(respondOffer.createdAt).toLocaleString() : "-"}</div>
                                {respondTrip && (
                                  <div className="mt-2 p-2 border rounded bg-blue-50">
                                    <b>Trip Details:</b><br />
                                    {respondTrip.fromCity} → {respondTrip.toCity} ({respondTrip.fromCountry} → {respondTrip.toCountry})<br />
                                    Departure: {respondTrip.departureDate}<br />
                                    Return: {respondTrip.returnDate}<br />
                                    Capacity: {respondTrip.capacityKg}kg, Max Package: {respondTrip.maxPackageWeightKg}kg
                                  </div>
                                )}
                                {respondRequest && (
                                  <div className="mt-2 p-3 border rounded bg-green-50">
                                    <b>Item/Request Details:</b><br />
                                    <div className="mt-2 space-y-1">
                                      <div><b>Title:</b> {respondRequest.title}</div>
                                      {respondRequest.category && <div><b>Category:</b> {respondRequest.category}</div>}
                                      <div><b>Route:</b> {respondRequest.fromCity}, {respondRequest.fromCountry} → {respondRequest.toCity}, {respondRequest.toCountry}</div>
                                      {respondRequest.description && <div><b>Description:</b> {respondRequest.description}</div>}

                                      {(respondRequest.estimatedTotalWeightKg || respondRequest.totalPackages) && (
                                        <div className="mt-2 pt-2 border-t border-green-200">
                                          <b>Package Information:</b><br />
                                          {respondRequest.estimatedTotalWeightKg && <div>• Weight: {respondRequest.estimatedTotalWeightKg} kg</div>}
                                          {respondRequest.totalPackages && <div>• Packages: {respondRequest.totalPackages}</div>}
                                        </div>
                                      )}

                                      {(respondRequest.itemValue || respondRequest.budgetMax || respondRequest.urgency || respondRequest.targetArrivalDate) && (
                                        <div className="mt-2 pt-2 border-t border-green-200">
                                          <b>Additional Details:</b><br />
                                          {respondRequest.itemValue && <div>• Item Value: ${respondRequest.itemValue}</div>}
                                          {respondRequest.budgetMax && <div>• Max Budget: ${respondRequest.budgetMax}</div>}
                                          {respondRequest.urgency && <div>• Urgency: {respondRequest.urgency}</div>}
                                          {respondRequest.targetArrivalDate && <div>• Target Arrival: {new Date(respondRequest.targetArrivalDate).toLocaleDateString()}</div>}
                                        </div>
                                      )}

                                      {(respondRequest.isFragile || respondRequest.batteryType) && (
                                        <div className="mt-2 pt-2 border-t border-green-200">
                                          <b>Special Handling:</b><br />
                                          {respondRequest.isFragile && <div>• ⚠️ Fragile Item</div>}
                                          {respondRequest.batteryType && <div>• 🔋 Battery Type: {respondRequest.batteryType}</div>}
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
                                  // Optionally refresh offers
                                  setOffersFromTravelers((prev) => prev.filter(o => o.id !== respondOffer.id));
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
                                  // Optionally refresh offers
                                  setOffersFromTravelers((prev) => prev.map(o => o.id === respondOffer.id ? { ...o, status: "Accepted" } : o));
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
                      </Card>
                    )
                  })
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </BuyerLayout>
  )
}
