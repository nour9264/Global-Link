"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TravelerLayout } from "@/components/traveler-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Circle, Package, CreditCard, Plane, Truck, Home, ArrowLeft, Loader2, MessageCircle } from "lucide-react"
import { confirmItemReceived, confirmPlaneArrived, verifyReceiveOtp } from "@/lib/match-service"
import { ORDER_STAGES, computeProgressPercent } from "@/lib/order-tracking"
import useMatchTracking from "@/hooks/use-match-tracking"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { initiateConversation, resolveConversation } from "@/lib/chat-service"

function OrderStatusContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const matchId = searchParams.get("matchId")
    // Try common query names for an offer id, plus a sessionStorage fallback
    const getOfferId = () => {
        const keys = ["offerId", "offer", "id", "offer_id"]
        for (const k of keys) {
            const v = searchParams.get(k)
            if (v) return v
        }
        try {
            const stored = sessionStorage.getItem("lastOfferId")
            if (stored) return stored
        } catch (err) { }
        return null
    }

    const offerId = getOfferId()

    const [resolvedMatchId, setResolvedMatchId] = useState<string | null>(null) // retained for existing UI fallback
    const { matchId: effectiveMatchIdHook, itemDetails, tracking, stageIndex, loading, error, refetch } = useMatchTracking({
        matchIdParam: matchId,
        offerIdParam: offerId,
    })
    const [actionLoading, setActionLoading] = useState(false)

    const [showOtpDialog, setShowOtpDialog] = useState(false)
    const [otpInput, setOtpInput] = useState("")

    // Sync legacy resolvedMatchId for fallback UI
    useEffect(() => { if (effectiveMatchIdHook) setResolvedMatchId(effectiveMatchIdHook) }, [effectiveMatchIdHook])

    const currentStage = stageIndex
    const progressPercent = computeProgressPercent(stageIndex)

    const handleConfirmItemReceived = async () => {
        const mId = effectiveMatchIdHook
        if (!mId) return
        try {
            setActionLoading(true)
            console.log("Confirming item received for matchId:", mId)
            await confirmItemReceived(mId)
            toast.success("Status updated: Item with Traveler")
            refetch()
        } catch (error) {
            console.error("Failed to update status:", error)
            toast.error("Failed to update status")
        } finally {
            setActionLoading(false)
        }
    }

    const handleConfirmPlaneArrived = async () => {
        const mId = effectiveMatchIdHook
        if (!mId) return
        try {
            setActionLoading(true)
            console.log("Confirming plane arrived for matchId:", mId)
            await confirmPlaneArrived(mId)
            toast.success("Status updated: Plane Arrived")
            refetch()
        } catch (error) {
            console.error("Failed to update status:", error)
            toast.error("Failed to update status")
        } finally {
            setActionLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        const mId = effectiveMatchIdHook
        if (!mId || !otpInput) return
        try {
            setActionLoading(true)
            console.log("Verifying receive OTP for matchId:", mId)
            await verifyReceiveOtp(mId, otpInput)
            toast.success("Item delivered successfully! Payment has been released to the traveler.")
            setShowOtpDialog(false)
            refetch()
        } catch (error) {
            console.error("Failed to verify OTP:", error)
            toast.error("Invalid OTP or verification failed")
        } finally {
            setActionLoading(false)
        }
    }

    const effectiveMatchId = effectiveMatchIdHook

    if (!effectiveMatchId) {
        return (
            <TravelerLayout>
                <div className="p-6 text-center">
                    <p className="text-foreground">Resolving order details...</p>
                    <p className="text-sm text-muted-foreground mt-2">If you arrived here via an offer link, we&apos;re resolving the associated match. This may take a moment.</p>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </div>
            </TravelerLayout>
        )
    }

    if (loading && !itemDetails) {
        return (
            <TravelerLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </TravelerLayout>
        )
    }


    return (
        <TravelerLayout>
            <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Request Details</h1>
                        <p className="text-muted-foreground mt-1">Track your item from request to delivery</p>
                    </div>
                </div>

                {/* Order Progress */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold text-foreground mb-2">Order Progress</h2>
                    <p className="text-sm text-muted-foreground mb-6">Track your item from request to delivery</p>

                    {/* Progress Bar */}
                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute top-6 left-0 right-0 h-1 bg-border" style={{ zIndex: 0 }} />
                        {tracking?.timeline?.$values && (() => {
                            const timeline = tracking.timeline.$values
                            // Find the index of the current stage
                            const currentIndex = timeline.findIndex(t => t.isCurrent)
                            const totalCount = timeline.length
                            const isLastStage = currentIndex === totalCount - 1
                            const allCompleted = timeline.every(t => t.isCompleted)

                            // If last stage is current or all completed, show 100%
                            const progressPercent = allCompleted || isLastStage
                                ? 100
                                : totalCount > 1 && currentIndex >= 0
                                    ? ((currentIndex - 0.5) / (totalCount - 1)) * 100
                                    : 0

                            return (
                                <div
                                    className="absolute top-6 left-0 h-1 bg-[#0088cc] transition-all duration-500"
                                    style={{
                                        width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                                        zIndex: 0
                                    }}
                                />
                            )
                        })()}

                        {/* Stages - Dynamic from Timeline */}
                        <div className="relative flex justify-between" style={{ zIndex: 1 }}>
                            {tracking?.timeline?.$values ? (
                                tracking.timeline.$values.map((timelineItem, index) => {
                                    // Map status to icon
                                    const getIcon = (status: string) => {
                                        const statusLower = status.toLowerCase()
                                        if (statusLower.includes("created") || statusLower.includes("offer")) return Package
                                        if (statusLower.includes("paid") || statusLower.includes("payment")) return CreditCard
                                        if (statusLower.includes("itemreceived") || statusLower.includes("traveler")) return Truck
                                        if (statusLower.includes("planearrived") || statusLower.includes("plane")) return Plane
                                        if (statusLower.includes("delivered")) return Home
                                        return Package
                                    }

                                    const Icon = getIcon(timelineItem.status)
                                    const isCompleted = timelineItem.isCompleted
                                    const isCurrent = timelineItem.isCurrent
                                    const isPast = isCompleted && !isCurrent

                                    return (
                                        <div
                                            key={timelineItem.$id || index}
                                            className="flex flex-col items-center group relative"
                                            style={{ flex: 1 }}
                                        >
                                            {/* Icon Circle */}
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${isCurrent
                                                    ? "bg-card border-[#0088cc] text-[#0088cc] animate-pulse shadow-[0_0_15px_rgba(0,136,204,0.5)]"
                                                    : isPast
                                                        ? "bg-[#0088cc] border-[#0088cc] text-white dark:text-white"
                                                        : "bg-card border-border text-muted-foreground"
                                                    }`}
                                            >
                                                {isPast ? (
                                                    <CheckCircle2 className="w-6 h-6" />
                                                ) : (
                                                    <Icon className="w-6 h-6" />
                                                )}
                                            </div>

                                            {/* Stage Name */}
                                            <p
                                                className={`mt-2 text-xs text-center font-medium ${isPast || isCurrent ? "text-foreground" : "text-muted-foreground"
                                                    }`}
                                                style={{ maxWidth: "100px" }}
                                            >
                                                {timelineItem.title}
                                            </p>

                                            {/* Tooltip on hover */}
                                            {timelineItem.description && (
                                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded py-2 px-3 whitespace-nowrap z-10 shadow-lg border border-border">
                                                    {timelineItem.description}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            ) : (
                                // Fallback to static stages if timeline not available
                                ORDER_STAGES.map((stage, index) => {
                                    const Icon = stage.icon
                                    const isPast = index < currentStage
                                    const isActive = index === currentStage

                                    return (
                                        <div key={stage.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${isActive
                                                    ? "bg-card border-[#0088cc] text-[#0088cc] animate-pulse shadow-[0_0_15px_rgba(0,136,204,0.5)]"
                                                    : isPast
                                                        ? "bg-[#0088cc] border-[#0088cc] text-white dark:text-white"
                                                        : "bg-card border-border text-muted-foreground"
                                                    }`}
                                            >
                                                {isPast ? (
                                                    <CheckCircle2 className="w-6 h-6" />
                                                ) : (
                                                    <Icon className="w-6 h-6" />
                                                )}
                                            </div>
                                            <p
                                                className={`mt-2 text-xs text-center font-medium ${isPast || isActive ? "text-foreground" : "text-muted-foreground"
                                                    }`}
                                                style={{ maxWidth: "100px" }}
                                            >
                                                {stage.name}
                                            </p>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </Card>

                {/* Item Details and Photos */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Item Details */}
                    <Card className="md:col-span-2 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-foreground">{itemDetails?.title}</h2>
                            <div className="flex gap-2">
                                {itemDetails?.isFragile && (
                                    <Badge className="bg-red-500 text-white hover:bg-red-600 border-0">
                                        Fragile
                                    </Badge>
                                )}
                                <Badge className="bg-muted text-foreground">
                                    {tracking?.status || (loading ? "Loading" : error ? "Error" : "Processing")}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="border-b pb-3">
                                <h3 className="font-semibold text-foreground mb-2">Item Details</h3>
                                <div className="space-y-1 text-muted-foreground">
                                    <p><span className="font-medium">Description:</span> {itemDetails?.description}</p>
                                    <p><span className="font-medium">Quantity:</span> {itemDetails?.quantity}</p>
                                    <p><span className="font-medium">Declared Value:</span> USD {itemDetails?.price}</p>
                                    {itemDetails?.dimensions && <p><span className="font-medium">Dimensions:</span> {itemDetails.dimensions}</p>}
                                    {itemDetails?.category && <p><span className="font-medium">Category:</span> {itemDetails.category}</p>}
                                    {itemDetails?.urgency && <p><span className="font-medium">Urgency:</span> {itemDetails.urgency}</p>}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Delivery Specifics</h3>
                                <div className="space-y-1 text-muted-foreground">
                                    <p><span className="font-medium">📍 Origin:</span> {itemDetails?.fromCity}</p>
                                    <p><span className="font-medium">🎯 Destination:</span> {itemDetails?.toCity}</p>
                                    <p><span className="font-medium">📅 Delivery Date:</span> {itemDetails?.deliveryDate ? new Date(itemDetails.deliveryDate).toLocaleDateString() : "N/A"}</p>
                                    <p><span className="font-medium">🛒 Buyer Name:</span> {itemDetails?.buyerName || "N/A"}</p>
                                    <p><span className="font-medium">✈️ Traveler Name:</span> {itemDetails?.travelerName || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Item Photos */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-foreground mb-4">Item Photos</h3>
                        <div className="space-y-3">
                            {itemDetails?.imageUrl ? (
                                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                                    <img src={itemDetails.imageUrl} alt="Item" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                                    <Package className="w-12 h-12 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground mt-2">No photo available</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Next Steps / Actions */}
                <Card className="p-6 bg-muted border-border">
                    <h3 className="font-semibold text-foreground mb-2">Traveler Actions</h3>
                    <p className="text-sm text-foreground mb-4">
                        Update the status as you progress with the delivery:
                    </p>

                    <div className="flex flex-wrap gap-3">
                        {/* Item Picked Up Button */}
                        {(() => {
                            const timeline = tracking?.timeline?.$values || []

                            // Find timeline items by status
                            const paidItem = timeline.find(t => t.status === "Paid")
                            const itemReceivedItem = timeline.find(t => t.status === "ItemReceived")
                            const planeArrivedItem = timeline.find(t => t.status === "PlaneArrived")
                            const deliveredItem = timeline.find(t => t.status === "Delivered")

                            // Debug logging
                            console.log("🔍 [Traveler Actions] Timeline:", timeline)
                            console.log("🔍 [Traveler Actions] Paid Item:", paidItem)
                            console.log("🔍 [Traveler Actions] ItemReceived Item:", itemReceivedItem)
                            console.log("🔍 [Traveler Actions] PlaneArrived Item:", planeArrivedItem)

                            // Button enable logic based on isCurrent
                            // isCurrent = true means "waiting for this stage to be completed"
                            // So if ItemReceived.isCurrent = true, enable "Item Picked Up" button
                            const canPickUpItem = itemReceivedItem?.isCurrent === true
                            const canConfirmPlaneArrived = planeArrivedItem?.isCurrent === true
                            const canConfirmDelivery = deliveredItem?.isCurrent === true

                            // Completion status
                            const itemPickedUpCompleted = itemReceivedItem?.isCompleted === true
                            const planeArrivedCompleted = planeArrivedItem?.isCompleted === true
                            const deliveryCompleted = deliveredItem?.isCompleted === true

                            // Check if payment is completed to enable chat
                            const paymentCompleted = paidItem?.isCompleted === true

                            console.log("🔍 [Traveler Actions] Can Pick Up:", canPickUpItem)
                            console.log("🔍 [Traveler Actions] Can Confirm Plane:", canConfirmPlaneArrived)
                            console.log("🔍 [Traveler Actions] Can Confirm Delivery:", canConfirmDelivery)
                            console.log("🔍 [Traveler Actions] Payment Completed:", paymentCompleted)

                            const handleChatWithBuyer = async () => {
                                if (!paymentCompleted || !effectiveMatchIdHook || !itemDetails) {
                                    console.log('❌ Cannot start chat:', { paymentCompleted, effectiveMatchIdHook, itemDetails })
                                    return
                                }

                                if (!itemDetails.requestId || !itemDetails.buyerId) {
                                    console.error('❌ Missing required IDs:', { requestId: itemDetails.requestId, buyerId: itemDetails.buyerId })
                                    toast.error('Unable to start chat - missing information')
                                    return
                                }

                                try {
                                    setActionLoading(true)

                                    // First, try to resolve existing conversation
                                    let conversationId = await resolveConversation(itemDetails.requestId, itemDetails.buyerId)

                                    // If no conversation exists, initialize one
                                    if (!conversationId) {
                                        console.log('🔵 No existing conversation, initializing new one...')
                                        await initiateConversation(itemDetails.requestId, itemDetails.buyerId)
                                        // Try to resolve again after initialization
                                        conversationId = await resolveConversation(itemDetails.requestId, itemDetails.buyerId)
                                    }

                                    console.log('✅ Conversation ready:', conversationId)
                                    // Navigate to chat page
                                    router.push('/traveler/chat')
                                } catch (error) {
                                    console.error('❌ Failed to initialize chat:', error)
                                    toast.error('Failed to open chat')
                                } finally {
                                    setActionLoading(false)
                                }
                            }

                            return (
                                <>
                                    {/* Chat Button - Only clickable after payment */}
                                    <Button
                                        className={paymentCompleted ? "bg-[#0088cc] hover:bg-[#0077b3] text-white" : "bg-gray-400 cursor-not-allowed text-white"}
                                        onClick={handleChatWithBuyer}
                                        disabled={!paymentCompleted || actionLoading}
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                                        Chat with Buyer
                                    </Button>

                                    <Button
                                        className={itemPickedUpCompleted ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
                                        onClick={handleConfirmItemReceived}
                                        disabled={actionLoading || !canPickUpItem || itemPickedUpCompleted}
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {itemPickedUpCompleted ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
                                        Item Picked Up
                                    </Button>

                                    {/* Plane Arrived Button */}
                                    <Button
                                        className={planeArrivedCompleted ? "bg-gray-400 cursor-not-allowed text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}
                                        onClick={handleConfirmPlaneArrived}
                                        disabled={actionLoading || !canConfirmPlaneArrived || planeArrivedCompleted}
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {planeArrivedCompleted ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
                                        Plane Arrived
                                    </Button>

                                    {/* Confirm Delivery Button */}
                                    <Button
                                        className={deliveryCompleted ? "bg-gray-400 cursor-not-allowed text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                                        onClick={() => setShowOtpDialog(true)}
                                        disabled={actionLoading || !canConfirmDelivery || deliveryCompleted}
                                    >
                                        {deliveryCompleted ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
                                        Confirm Delivery
                                    </Button>
                                </>
                            )
                        })()}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                        Buttons are enabled based on the current order status. Completed actions are marked with a checkmark.
                    </p>
                </Card>

                {/* OTP Input Dialog */}
                <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enter Delivery Confirmation Code</DialogTitle>
                        </DialogHeader>
                        <div className="py-6 space-y-4">
                            <p className="text-muted-foreground">
                                Ask the buyer for the confirmation code and enter it below to complete the delivery.
                            </p>
                            <Input
                                placeholder="Enter OTP Code"
                                className="text-center text-2xl tracking-widest uppercase"
                                maxLength={6}
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowOtpDialog(false)}>Cancel</Button>
                            <Button className="text-white" onClick={handleVerifyOtp} disabled={actionLoading || !otpInput}>
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Verify & Complete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog >
            </div >
        </TravelerLayout >
    )
}

export default function OrderStatusPage() {
    return (
        <Suspense fallback={
            <TravelerLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </TravelerLayout>
        }>
            <OrderStatusContent />
        </Suspense>
    )
}
