"use client"

import { BuyerLayout } from "@/components/buyer-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ensureAbsoluteUrl } from "@/lib/utils"
import { MapPin, Calendar, Loader2, Package, ArrowRight, Trash2, DollarSign } from "lucide-react"
import { getMyRequests, deleteRequest } from "@/lib/buyer-request-service"
import type { BuyerRequest } from "@/types/buyer-request"
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

export default function BuyerRequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<BuyerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<BuyerRequest | null>(null)
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
        return "bg-[#0088cc]"
      case "completed":
      case "accepted":
        return "bg-green-600"
      case "cancelled":
      case "rejected":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  // Fetch requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      try {
        console.log("🔄 [BuyerRequestsPage] Fetching requests...")
        const fetchedRequests = await getMyRequests()
        console.log("📋 [BuyerRequestsPage] Fetched requests:", fetchedRequests)

        setRequests(fetchedRequests)
      } catch (error) {
        console.error("❌ [BuyerRequestsPage] Error fetching requests:", error)
        toast.error("Failed to load requests. Please try again.")
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchRequests()
    }
  }, [user])

  // Handle request click - navigate to request detail page
  const handleRequestClick = (requestId: string) => {
    router.push(`/buyer/requests/${requestId}`)
  }

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, request: BuyerRequest) => {
    e.stopPropagation() // Prevent card click
    setRequestToDelete(request)
    setDeleteDialogOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return

    setIsDeleting(true)
    try {
      console.log(`🗑️ [BuyerRequestsPage] Deleting request: ${requestToDelete.id}`)
      const response = await deleteRequest(requestToDelete.id)

      if (response.isSuccess) {
        toast.success("Request deleted successfully")
        // Remove request from list
        setRequests(requests.filter((r) => r.id !== requestToDelete.id))
        setDeleteDialogOpen(false)
        setRequestToDelete(null)
      } else {
        throw new Error(response.message || "Failed to delete request")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete request"
      toast.error(errorMessage)
      console.error("❌ [BuyerRequestsPage] Error deleting request:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0088cc] mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your requests...</p>
          </div>
        </div>
      </BuyerLayout>
    )
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <BuyerLayout>
        <div className="flex flex-col items-center justify-center min-h-[600px] text-center">
          <h1 className="text-2xl font-bold text-foreground mb-8">YOU CURRENTLY DO NOT HAVE ACTIVE REQUESTS.</h1>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md">
            <div className="w-16 h-16 bg-[#0088cc] rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Create New Request</h2>
            <p className="text-muted-foreground mb-6">Easily post a new item request to our network of travelers.</p>
            <Link href="/buyer/create-request">
              <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white">Create New Request</Button>
            </Link>
          </div>
        </div>
      </BuyerLayout>
    )
  }

  return (
    <BuyerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {requests.length} {requests.length === 1 ? "request" : "requests"} total
            </p>
          </div>
          <Link href="/buyer/create-request">
            <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white">Create New Request</Button>
          </Link>
        </div>

        {/* Requests List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              onClick={() => handleRequestClick(request.id)}
            >
                <div className="relative h-32 bg-gradient-to-r from-blue-500 to-cyan-500">
                {request.photos && request.photos.length > 0 ? (
                  <Image
                    src={ensureAbsoluteUrl(request.photos[0]) || "/european-city-skyline.jpg"}
                    alt={request.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src="/european-city-skyline.jpg"
                    alt={request.title}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-3 right-3">
                  <Badge className={`${getStatusBadgeColor(request.status)} text-white`}>
                    {request.status || "Pending"}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-1">{request.title}</h3>
                  {request.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {request.fromCity}, {request.fromCountry} → {request.toCity}, {request.toCountry}
                    </span>
                  </div>
                  {request.targetArrivalDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Deadline: {formatDate(request.targetArrivalDate)}</span>
                    </div>
                  )}
                  {request.budgetMax && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      <span>Budget: ${request.budgetMax.toFixed(2)}</span>
                    </div>
                  )}
                  {request.estimatedTotalWeightKg && (
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span>Weight: {request.estimatedTotalWeightKg} kg</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{request.isFragile ? "Fragile Item" : "Standard Item"}</span>
                    <ArrowRight className="w-4 h-4 text-[#0088cc]" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => handleDeleteClick(e, request)}
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
              <AlertDialogTitle>Delete Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the request &quot;{requestToDelete?.title}&quot;? This action cannot
                be undone.
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
