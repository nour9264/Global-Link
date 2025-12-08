"use client"

import { useState, useEffect } from "react"
import { TravelerLayout } from "@/components/traveler-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Plane, Package, CheckCircle, Plus, Globe, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getMyTrips, getMyOffers } from "@/lib/trip-service"

import type { Trip } from "@/types/trip"
import type { BuyerRequest } from "@/types/buyer-request"

export default function TravelerDashboard() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [matchedRequests, setMatchedRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    upcomingTrips: 0,
    pendingOffers: 0,
    deliveredPackages: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch trips
        const tripsData = await getMyTrips()
        setTrips(tripsData)

        // Fetch all offers to calculate stats
        let allOffers: any[] = []
        try {
          allOffers = await getMyOffers()
        } catch (error) {
          console.error("Failed to fetch offers for stats:", error)
        }

        // Calculate stats from trips
        const now = new Date()
        const upcomingTripsCount = tripsData.filter(trip => {
          const departureDate = new Date(trip.departureDate)
          return departureDate > now
        }).length

        // Count pending offers (offers with pending status)
        const pendingOffersCount = allOffers.filter((offer: any) => {
          const status = offer.status?.toLowerCase()
          return status === "pending" || status === "normal"
        }).length

        // Count delivered packages (offers with accepted/completed/delivered status)
        const deliveredCount = allOffers.filter((offer: any) => {
          const status = offer.status?.toLowerCase()
          return status === "accepted" || status === "completed" || status === "delivered"
        }).length

        // Calculate total earnings from accepted offers
        const totalEarnings = allOffers
          .filter((offer: any) => {
            const status = offer.status?.toLowerCase()
            return status === "accepted" || status === "completed" || status === "delivered"
          })
          .reduce((sum: number, offer: any) => sum + (offer.price || 0), 0)

        setStats({
          totalEarnings,
          upcomingTrips: upcomingTripsCount,
          pendingOffers: pendingOffersCount,
          deliveredPackages: deliveredCount,
        })

        // Filter accepted offers for matched requests section
        const acceptedOffers = allOffers.filter(offer => {
          const status = offer.status?.toLowerCase()
          return status === "accepted"
        })
        setMatchedRequests(acceptedOffers.slice(0, 4)) // Show first 4
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        setTrips([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDateRange = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return ""
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const startFormatted = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      const endFormatted = end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      return `${startFormatted} – ${endFormatted}`
    } catch {
      return `${startDate} – ${endDate}`
    }
  }

  const formatDate = (date?: string): string => {
    if (!date) return "N/A"
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return date
    }
  }

  const getStatusBadge = (status?: string) => {
    const statusLower = status?.toLowerCase() || "pending"

    if (statusLower === "active" || statusLower === "open" || statusLower === "confirmed") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Confirmed</Badge>
    }
    if (statusLower === "completed") {
      return <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">Completed</Badge>
    }
    if (statusLower === "inprogress") {
      return <Badge className="bg-yellow-600 hover:bg-yellow-600 text-white text-xs">InProgress</Badge>
    }
    return <Badge variant="secondary" className="text-xs">Pending</Badge>
  }

  // Show all trips (not just upcoming) - sorted by departure date (most recent first)
  const displayTrips = [...trips]
    .sort((a, b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime())
    .slice(0, 2) // Show first 2 trips

  return (
    <TravelerLayout>
      <div className="flex flex-col gap-6 sm:gap-8 bg-background p-4 sm:p-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Welcome Back, Traveler!</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Your next adventure awaits. Here's a quick overview of your GlobalLink activity.
            </p>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16">
            <Globe className="w-full h-full text-[#0088cc]" />
          </div>
        </div>

        {/* Your Overview Stats */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Your Overview</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#0088cc]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <Card className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Total Earnings</span>
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">${stats.totalEarnings}</div>
                <p className="text-xs text-muted-foreground mt-1">Since joining GlobalLink</p>
              </Card>

              <Card className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Upcoming Trips</span>
                  <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stats.upcomingTrips}</div>
                <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
              </Card>

              <Card className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Pending Offers</span>
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stats.pendingOffers}</div>
                <p className="text-xs text-muted-foreground mt-1">Requiring your attention</p>
              </Card>

              <Card className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Delivered Packages</span>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stats.deliveredPackages}</div>
                <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
              </Card>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            <Link href="/traveler/add-trip">
              <Button className="w-full h-auto min-h-[40px] sm:min-h-[48px] md:min-h-[56px] py-2 sm:py-3 bg-[#0088cc] hover:bg-[#0077b3] text-xs sm:text-sm md:text-base text-white whitespace-normal">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="leading-tight">Add a New Trip</span>
              </Button>
            </Link>
            <Link href="/traveler/available-requests">
              <Button className="w-full h-auto min-h-[40px] sm:min-h-[48px] md:min-h-[56px] py-2 sm:py-3 bg-[#0088cc] hover:bg-[#0077b3] text-xs sm:text-sm md:text-base text-white whitespace-normal">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="leading-tight">Browse Available Requests</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Upcoming Trips */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Upcoming Trips</h2>
            <Link href="/traveler/trips">
              <Button variant="link" className="text-[#0088cc] p-0 h-auto text-sm">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#0088cc]" />
            </div>
          ) : displayTrips.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You don't have any trips yet.</p>
              <Link href="/traveler/add-trip">
                <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white">Add Your First Trip</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {displayTrips.map((trip) => (
                <Card key={trip.id} className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {trip.fromCity} → {trip.toCity}
                    </h3>
                    {getStatusBadge(trip.status)}
                  </div>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-2">📅</span>
                      <span>{formatDateRange(trip.departureDate, trip.returnDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-2">📍</span>
                      <span>From {trip.fromCity}</span>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex justify-between items-center">
                    <Link href={`/traveler/trips/${trip.id}`}>
                      <Button variant="link" className="text-[#0088cc] p-0 text-sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Matched Requests */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Matched Requests</h2>
            <p className="text-sm text-muted-foreground mt-1">Opportunities that match your travel plans. Make an offer today!</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#0088cc]" />
            </div>
          ) : matchedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No matched requests available at the moment.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {matchedRequests.map((offer) => {
                const request = offer.request || {}
                const photos = request.photos || []
                const title = offer.requestTitle || request.title || "Untitled Request"
                const toCity = request.toCity || "Unknown"
                const targetDate = request.targetArrivalDate
                const budget = offer.price || request.budgetMax || 0

                return (
                  <Card key={offer.id} className="overflow-hidden">
                    <div className="relative h-32 sm:h-40 bg-gradient-to-br from-blue-500 to-cyan-500">
                      {photos.length > 0 ? (
                        <Image
                          src={photos[0]}
                          alt={title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-12 h-12 text-white/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1 line-clamp-1">
                        {title}
                      </h3>
                      <p className="text-base sm:text-lg font-bold text-[#0088cc] mb-2">
                        ${budget}
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center">
                          <span className="mr-1">📍</span>
                          <span className="line-clamp-1">To {toCity}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1">📅</span>
                          <span>By {formatDate(targetDate)}</span>
                        </div>
                      </div>
                      <Link href="/traveler/offers">
                        <Button className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white" size="sm">
                          View Offer
                        </Button>
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </TravelerLayout>
  )
}
