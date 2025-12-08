"use client"

import { BuyerLayout } from "@/components/buyer-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ensureAbsoluteUrl } from "@/lib/utils"
import {
  MapPin,
  Calendar,
  Loader2,
  Package,
  ArrowLeft,
  Trash2,
  DollarSign,
  AlertCircle,
  Battery,
  Tag,
} from "lucide-react"
import { getRequestById, deleteRequest } from "@/lib/buyer-request-service"
import type { BuyerRequest } from "@/types/buyer-request"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export default function BuyerRequestDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const requestId = params?.requestId as string

  const [request, setRequest] = useState<BuyerRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  // Get valid photos (filter out empty strings)
  const validPhotos = request?.photos?.filter((p) => p && p.trim()) || []

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

  // Get status badge color
  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "open":
      case "pending":
        return "bg-[#0088cc] text-white"
      case "completed":
      case "accepted":
        return "bg-green-600 text-white"
      case "cancelled":
      case "rejected":
        return "bg-red-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) {
        toast.error("Invalid request ID")
        router.push("/buyer/requests")
        return
      }

      setLoading(true)
      try {
        console.log(`🔄 [BuyerRequestDetailPage] Fetching request details for ID: ${requestId}...`)
        const requestData = await getRequestById(requestId)
        console.log("📋 [BuyerRequestDetailPage] Fetched request:", requestData)

        if (!requestData) {
          toast.error("Request not found")
          router.push("/buyer/requests")
          return
        }

        setRequest(requestData)
      } catch (error) {
        console.error("❌ [BuyerRequestDetailPage] Error fetching request:", error)
        toast.error("Failed to load request details. Please try again.")
        router.push("/buyer/requests")
      } finally {
        setLoading(false)
      }
    }

    if (user && requestId) {
      fetchRequest()
    }
  }, [user, requestId, router])

  // Keyboard navigation for photo viewer
  useEffect(() => {
    if (selectedPhotoIndex === null || validPhotos.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedPhotoIndex(
          selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : validPhotos.length - 1
        )
      } else if (e.key === "ArrowRight") {
        setSelectedPhotoIndex(
          selectedPhotoIndex < validPhotos.length - 1 ? selectedPhotoIndex + 1 : 0
        )
      } else if (e.key === "Escape") {
        setSelectedPhotoIndex(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedPhotoIndex, validPhotos.length])

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!request) return

    setIsDeleting(true)
    try {
      console.log(`🗑️ [BuyerRequestDetailPage] Deleting request: ${request.id}`)
      const response = await deleteRequest(request.id)

      if (response.isSuccess) {
        toast.success("Request deleted successfully")
        router.push("/buyer/requests")
      } else {
        throw new Error(response.message || "Failed to delete request")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete request"
      toast.error(errorMessage)
      console.error("❌ [BuyerRequestDetailPage] Error deleting request:", error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0088cc] mx-auto mb-4" />
            <p className="text-muted-foreground">Loading request details...</p>
          </div>
        </div>
      </BuyerLayout>
    )
  }

  // Request not found
  if (!request) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-3">Request not found</h2>
            <p className="text-muted-foreground mb-8">The request you're looking for doesn't exist or has been removed.</p>
            <Link href="/buyer/requests">
              <Button className="bg-[#0088cc] hover:bg-[#0077b3]">Back to My Requests</Button>
            </Link>
          </div>
        </div>
      </BuyerLayout>
    )
  }

  return (
    <BuyerLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/buyer/requests")}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Request Details</h1>
              <p className="text-sm text-muted-foreground mt-1">View and manage your request information</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete Request
            </Button>
          </div>
        </div>

        {/* Request Header Card */}
        <Card className="overflow-hidden">
          <div className="relative h-64 bg-gradient-to-r from-blue-500 to-cyan-500">
            {validPhotos.length > 0 ? (
              <Image
                src={ensureAbsoluteUrl(validPhotos[0]) || "/european-city-skyline.jpg"}
                alt={request.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <Image
                src="/european-city-skyline.jpg"
                alt={request.title}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">{request.title}</h2>
                  <div className="flex items-center gap-4 text-sm drop-shadow-md">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {request.fromCity}, {request.fromCountry} → {request.toCity}, {request.toCountry}
                      </span>
                    </div>
                    {request.targetArrivalDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Deadline: {formatDate(request.targetArrivalDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={`${getStatusBadgeColor(request.status)} text-white shadow-lg`}>
                  {request.status || "Pending"}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Item Details</h3>
              <div className="space-y-4">
                {request.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {request.description}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {request.category && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-foreground">{request.category}</p>
                      </div>
                    </div>
                  )}
                  {request.itemValue !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Item Value</p>
                      <p className="text-sm text-foreground">${request.itemValue.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Route & Delivery */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Route & Delivery</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Origin</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-foreground">
                        {request.fromCity}, {request.fromCountry}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Destination</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-foreground">
                        {request.toCity}, {request.toCountry}
                      </p>
                    </div>
                  </div>
                </div>

                {request.targetArrivalDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Delivery Deadline</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-foreground">{formatDate(request.targetArrivalDate)}</p>
                    </div>
                  </div>
                )}

                {request.urgency && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Urgency</p>
                    <Badge variant="outline">{request.urgency}</Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Package Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Package Information</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {request.estimatedTotalWeightKg !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Weight</p>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-foreground">{request.estimatedTotalWeightKg} kg</p>
                      </div>
                    </div>
                  )}
                  {request.totalPackages !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Packages</p>
                      <p className="text-sm text-foreground">{request.totalPackages}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {request.isFragile && (
                    <Badge variant="outline" className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Fragile Item
                    </Badge>
                  )}
                  {request.batteryType && (
                    <Badge variant="outline" className="flex items-center gap-2">
                      <Battery className="w-3 h-3" />
                      Battery: {request.batteryType}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget & Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Budget & Status</h3>
              <div className="space-y-3">
                {request.budgetMax !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-foreground">
                        ${request.budgetMax.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusBadgeColor(request.status)}>
                    {request.status || "Pending"}
                  </Badge>
                </div>
                {request.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm text-foreground">{formatDate(request.createdAt)}</span>
                  </div>
                )}
                {request.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm text-foreground">{formatDate(request.updatedAt)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Request
                </Button>
                <Link href="/buyer/requests">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Requests
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Item Photos */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Item Photos</h3>
              {validPhotos.length > 0 ? (
                <div className="space-y-3">
                  {/* Main photo */}
                  <div
                    className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity group"
                    onClick={() => setSelectedPhotoIndex(0)}
                  >
                    <Image
                      src={ensureAbsoluteUrl(validPhotos[0]) || "/placeholder.svg"}
                      alt={`${request.title} - Main photo`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium transition-opacity">
                        Click to view
                      </span>
                    </div>
                  </div>
                  {/* Thumbnail gallery if more than one photo */}
                  {validPhotos.length > 1 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        All Photos ({validPhotos.length})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {validPhotos.slice(0, 4).map((photo, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#0088cc] transition-colors cursor-pointer bg-gray-100"
                            onClick={() => setSelectedPhotoIndex(index)}
                          >
                            <Image
                              src={ensureAbsoluteUrl(photo) || "/placeholder.svg"}
                              alt={`${request.title} - Photo ${index + 1}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                // Fallback if image fails to load
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {validPhotos.length > 4 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          +{validPhotos.length - 4} more photos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">No photos available</p>
                    <p className="text-xs text-gray-400 mt-1">Photos will appear here when added</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Photo Viewer Dialog */}
        {validPhotos.length > 0 && (
          <Dialog open={selectedPhotoIndex !== null} onOpenChange={(open) => !open && setSelectedPhotoIndex(null)}>
            <DialogContent
              className="max-w-6xl w-full p-0 bg-black border-none"
              showCloseButton={false}
            >
              <div className="relative w-full min-h-[60vh] max-h-[80vh] bg-black flex items-center justify-center">
                {selectedPhotoIndex !== null && selectedPhotoIndex < validPhotos.length && (
                  <>
                    <button
                      onClick={() => setSelectedPhotoIndex(null)}
                      className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    {validPhotos.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPhotoIndex(
                              selectedPhotoIndex > 0
                                ? selectedPhotoIndex - 1
                                : validPhotos.length - 1
                            )
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full p-3 transition-colors"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPhotoIndex(
                              selectedPhotoIndex < validPhotos.length - 1
                                ? selectedPhotoIndex + 1
                                : 0
                            )
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full p-3 transition-colors"
                          aria-label="Next photo"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </>
                    )}
                    <div className="relative w-full h-full min-h-[60vh] max-h-[80vh] flex items-center justify-center p-8">
                      <Image
                        src={ensureAbsoluteUrl(validPhotos[selectedPhotoIndex]) || "/placeholder.svg"}
                        alt={`${request.title} - Photo ${selectedPhotoIndex + 1}`}
                        width={1200}
                        height={800}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    {validPhotos.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/70 px-4 py-2 rounded-full">
                        {selectedPhotoIndex + 1} / {validPhotos.length}
                      </div>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the request &quot;{request?.title}&quot;? This action cannot be undone.
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
    </BuyerLayout>
  )
}

