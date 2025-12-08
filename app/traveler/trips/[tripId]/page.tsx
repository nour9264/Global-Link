"use client"

import { TravelerLayout } from "@/components/traveler-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { MapPin, Calendar, Loader2, Package, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { getTripById, deleteTrip } from "@/lib/trip-service"
import type { Trip } from "@/types/trip"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
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

export default function TripDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tripId = params?.tripId as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Format date helper
  const formatDate = (dateString: string): string => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

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

  // Fetch trip details
  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) {
        toast.error("Invalid trip ID")
        router.push("/traveler/trips")
        return
      }

      setLoading(true)
      try {
        console.log(`🔄 [TripDetailPage] Fetching trip details for ID: ${tripId}...`)
        const tripData = await getTripById(tripId)
        console.log("📋 [TripDetailPage] Fetched trip:", tripData)

        if (!tripData) {
          toast.error("Trip not found")
          router.push("/traveler/trips")
          return
        }

        setTrip(tripData)
      } catch (error) {
        console.error("❌ [TripDetailPage] Error fetching trip:", error)
        toast.error("Failed to load trip details. Please try again.")
        router.push("/traveler/trips")
      } finally {
        setLoading(false)
      }
    }

    if (user && tripId) {
      fetchTrip()
    }
  }, [user, tripId, router])

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!trip) return

    setIsDeleting(true)
    try {
      console.log(`🗑️ [TripDetailPage] Deleting trip: ${trip.id}`)
      const response = await deleteTrip(trip.id)

      // Handle success - response might be undefined for 204 No Content
      if (!response || response.isSuccess === true || response.isSuccess === undefined) {
        toast.success("Trip deleted successfully")
        router.push("/traveler/trips")
      } else {
        throw new Error(response.message || "Failed to delete trip")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete trip"
      toast.error(errorMessage)
      console.error("❌ [TripDetailPage] Error deleting trip:", error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <TravelerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0088cc] mx-auto mb-4" />
            <p className="text-gray-600">Loading trip details...</p>
          </div>
        </div>
      </TravelerLayout>
    )
  }

  // Trip not found
  if (!trip) {
    return (
      <TravelerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Trip not found</h2>
            <p className="text-gray-600 mb-8">The trip you're looking for doesn't exist or has been removed.</p>
            <Link href="/traveler/trips">
              <Button className="bg-[#0088cc] hover:bg-[#0077b3]">Back to My Trips</Button>
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/traveler/trips")}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Trip Details</h1>
              <p className="text-sm text-muted-foreground mt-1">View and manage your trip information</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete Trip
            </Button>
          </div>
        </div>

        {/* Trip Header Card */}
        <Card className="overflow-hidden">
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-cyan-500">
            <Image
              src="/european-city-skyline.jpg"
              alt={`${trip.fromCity} to ${trip.toCity}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {trip.fromCity}, {trip.fromCountry} → {trip.toCity}, {trip.toCountry}
                  </h2>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{trip.fromCity}, {trip.fromCountry} to {trip.toCity}, {trip.toCountry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateRange(trip.departureDate, trip.returnDate)}</span>
                    </div>
                  </div>
                </div>
                <Badge className={`${getStatusBadgeColor(trip.status)} text-white`}>
                  {trip.status || "Active"}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Requests Enrolled Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {trip.totalRequests || 0}
                  </h3>
                  <p className="text-sm text-muted-foreground">Requests Enrolled</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trip.pendingRequests || 0} pending approval, {trip.confirmedRequests || 0} confirmed
                  </p>
                </div>
                <Link href="/traveler/offers">
                  <Button variant="link" className="text-[#0088cc]">
                    View All Requests
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Trip Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Trip Details</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Origin</p>
                    <p className="text-sm text-foreground">
                      {trip.fromCity}, {trip.fromCountry}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Destination</p>
                    <p className="text-sm text-foreground">
                      {trip.toCity}, {trip.toCountry}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Departure Date & Time</p>
                    <p className="text-sm text-foreground">{formatDate(trip.departureDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Return Date & Time</p>
                    <p className="text-sm text-foreground">{formatDate(trip.returnDate)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Available Capacity</p>
                    <p className="text-sm text-foreground">{trip.capacityKg} kg</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Max Package Weight</p>
                    <p className="text-sm text-foreground">{trip.maxPackageWeightKg} kg per package</p>
                  </div>
                </div>


                {trip.notes && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Additional Notes</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {trip.notes}
                    </p>
                  </div>
                )}

                {trip.receiveWindowStartUtc && trip.receiveByDeadlineUtc && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Receiving Window</p>
                    <div className="bg-muted p-3 rounded-md space-y-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Start:</span> {formatDate(trip.receiveWindowStartUtc)}
                      </p>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Deadline:</span> {formatDate(trip.receiveByDeadlineUtc)}
                      </p>
                    </div>
                  </div>
                )}

                {trip.createdAt && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Trip Created</p>
                    <p className="text-sm text-foreground">{formatDate(trip.createdAt)}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Trip
                </Button>
              </div>
            </Card>

            {/* Trip Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Trip Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusBadgeColor(trip.status)}>
                    {trip.status || "Active"}
                  </Badge>
                </div>
                {trip.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm text-foreground">{formatDate(trip.updatedAt)}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Trip</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this trip from {trip?.fromCity}, {trip?.fromCountry} to {trip?.toCity}, {trip?.toCountry}?
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

