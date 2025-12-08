"use client"

import { TravelerLayout } from "@/components/traveler-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { MapPin, Calendar, Loader2, Package, ArrowRight, Edit, Trash2 } from "lucide-react"
import { getMyTrips, deleteTrip } from "@/lib/trip-service"
import type { Trip } from "@/types/trip"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function MyTripsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Format date range helper
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

  // Get status badge color
  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "open":
        return "bg-[#0088cc]"
      case "completed":
        return "bg-green-600"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  // Fetch trips on mount
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true)
      try {
        console.log("🔄 [MyTripsPage] Fetching trips...")
        const fetchedTrips = await getMyTrips()
        console.log("📋 [MyTripsPage] Fetched trips:", fetchedTrips)

        setTrips(fetchedTrips)
      } catch (error) {
        console.error("❌ [MyTripsPage] Error fetching trips:", error)
        toast.error("Failed to load trips. Please try again.")
        setTrips([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchTrips()
    }
  }, [user])

  // Handle trip click - navigate to trip detail page
  const handleTripClick = (tripId: string) => {
    router.push(`/traveler/trips/${tripId}`)
  }

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation() // Prevent card click
    setTripToDelete(trip)
    setDeleteDialogOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!tripToDelete) return

    setIsDeleting(true)
    try {
      console.log(`🗑️ [MyTripsPage] Deleting trip: ${tripToDelete.id}`)
      const response = await deleteTrip(tripToDelete.id)

      // Handle success - response might be undefined for 204 No Content
      if (!response || response.isSuccess === true || response.isSuccess === undefined) {
        toast.success("Trip deleted successfully")
        // Remove trip from list
        const deletedId = tripToDelete.id
        setTrips(prev => prev.filter(t => t.id !== deletedId))
        setDeleteDialogOpen(false)
        setTripToDelete(null)
      } else {
        throw new Error(response.message || "Failed to delete trip")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete trip"
      toast.error(errorMessage)
      console.error("❌ [MyTripsPage] Error deleting trip:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <TravelerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0088cc] mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your trips...</p>
          </div>
        </div>
      </TravelerLayout>
    )
  }

  // Empty state
  if (trips.length === 0) {
    return (
      <TravelerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center max-w-md px-6">
            <div className="mb-8 flex justify-center">
              <Image
                src="/images/no-trips-empty-state.png"
                alt="No trips yet"
                width={200}
                height={200}
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">You haven't planned any adventures yet.</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Start your journey by adding your first trip and explore new destinations.
            </p>
            <Link href="/traveler/add-trip">
              <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white px-8 py-6 text-base">Add New Trip</Button>
            </Link>
          </div>
        </div>
      </TravelerLayout>
    )
  }

  return (
    <TravelerLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Trips</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {trips.length} {trips.length === 1 ? "trip" : "trips"} total
            </p>
          </div>
          <Link href="/traveler/add-trip">
            <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white">
              Add New Trip
            </Button>
          </Link>
        </div>

        {/* Trips List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {trips.map((trip) => (
            <Card
              key={trip.id}
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              onClick={() => handleTripClick(trip.id)}
            >
              <div className="relative h-32 bg-gradient-to-r from-blue-500 to-cyan-500">
                <Image
                  src="/european-city-skyline.jpg"
                  alt={`${trip.fromCity} to ${trip.toCity}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-3 right-3">
                  <Badge className={`${getStatusBadgeColor(trip.status)} text-white`}>
                    {trip.status || "Active"}
                  </Badge>
                </div>
              </div>

              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                    {trip.fromCity}, {trip.fromCountry} → {trip.toCity}, {trip.toCountry}
                  </h3>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {trip.fromCity}, {trip.fromCountry} to {trip.toCity}, {trip.toCountry}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{formatDateRange(trip.departureDate, trip.returnDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 flex-shrink-0" />
                    <span>{trip.totalRequests || 0} Requests Enrolled</span>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {trip.pendingRequests || 0} pending, {trip.confirmedRequests || 0} confirmed
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#0088cc]" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      onClick={(e) => handleDeleteClick(e, trip)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Trip</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this trip from {tripToDelete?.fromCity}, {tripToDelete?.fromCountry} to {tripToDelete?.toCity}, {tripToDelete?.toCountry}?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TravelerLayout>
  )
}

