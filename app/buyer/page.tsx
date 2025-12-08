"use client"

import { useState, useEffect } from "react"
import { BuyerLayout } from "@/components/buyer-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Plane, Loader2 } from "lucide-react"
import Link from "next/link"
import { getMyRequests } from "@/lib/buyer-request-service"
import type { BuyerRequest } from "@/types/buyer-request"

export default function BuyerDashboard() {
  const [requests, setRequests] = useState<BuyerRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        const data = await getMyRequests()
        // Get the 5 most recent requests
        setRequests(data.slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch requests:", error)
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  const getStatusBadge = (status?: string) => {
    const statusLower = status?.toLowerCase() || "pending"

    if (statusLower === "matched" || statusLower === "accepted") {
      return <Badge className="bg-[#0088cc] hover:bg-[#0088cc] text-white text-xs">Matched</Badge>
    }
    if (statusLower === "completed" || statusLower === "delivered") {
      return <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs">Completed</Badge>
    }
    if (statusLower === "cancelled") {
      return <Badge variant="destructive" className="text-xs">Cancelled</Badge>
    }
    return <Badge variant="secondary" className="text-xs">Pending</Badge>
  }

  return (
    <BuyerLayout>
      <div className="space-y-6 sm:space-y-8 bg-background min-h-screen p-4 sm:p-6">
        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Buyer Dashboard</h1>

        {/* Action Cards */}
        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6 max-w-4xl">
          <Card className="p-3 sm:p-6 flex flex-col items-center text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0088cc]/10 flex items-center justify-center mb-3 sm:mb-4">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-[#0088cc]" />
            </div>
            <h2 className="text-sm sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">Create New Request</h2>
            <p className="text-[10px] sm:text-sm text-muted-foreground mb-3 sm:mb-4">Easily post a new item request to our network of travelers.</p>
            <Link href="/buyer/create-request" className="w-full">
              <Button className="w-full h-auto min-h-[40px] sm:min-h-[44px] py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs sm:text-sm whitespace-normal leading-tight">Create New Request</Button>
            </Link>
          </Card>

          <Card className="p-3 sm:p-6 flex flex-col items-center text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0088cc]/10 flex items-center justify-center mb-3 sm:mb-4">
              <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-[#0088cc]" />
            </div>
            <h2 className="text-sm sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">Find Travelers</h2>
            <p className="text-[10px] sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Browse available travelers and trips to find a match for your delivery.
            </p>
            <Link href="/buyer/find-travelers" className="w-full">
              <Button className="w-full h-auto min-h-[40px] sm:min-h-[44px] py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs sm:text-sm whitespace-normal leading-tight">Find Travelers</Button>
            </Link>
          </Card>
        </div>

        {/* Recent Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Recent Requests</h2>
            <Link href="/buyer/requests">
              <Button variant="link" className="text-[#0088cc] p-0 h-auto text-sm">View All</Button>
            </Link>
          </div>

          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#0088cc]" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-muted-foreground mb-4">You haven't created any requests yet.</p>
                <Link href="/buyer/create-request">
                  <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white">Create Your First Request</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-foreground">Item</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-foreground">Destination</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-foreground">Offers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-muted/50">
                        <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-foreground">
                          {request.title || "Untitled Request"}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground">
                          {request.toCity}, {request.toCountry}
                        </td>
                        <td className="py-3 px-3 sm:px-4">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-foreground">
                          {(request as any).totalOffers || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </BuyerLayout>
  )
}
