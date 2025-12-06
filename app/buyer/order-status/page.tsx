"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BuyerLayout } from "@/components/buyer-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Package, CreditCard, Plane, Truck, Home, ArrowLeft, Loader2, Copy, MessageCircle } from "lucide-react"
import { generateReceiveOtp } from "@/lib/match-service"
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
        // fallback to sessionStorage (in case previous page stored it)
        try {
            const stored = sessionStorage.getItem("lastOfferId")
            if (stored) return stored
        } catch (err) {
            // ignore (SSR or privacy restrictions)
        }
        return null
    }

    const offerId = getOfferId()

    const [resolvedMatchId, setResolvedMatchId] = useState<string | null>(null) // preserved for redirect UI
    const { matchId: effectiveMatchId, itemDetails, tracking, stageIndex, loading, error, refetch } = useMatchTracking({
        matchIdParam: matchId,
        offerIdParam: offerId,
    })
    const [otp, setOtp] = useState<string | null>(null)
    const [otpLoading, setOtpLoading] = useState(false)
    const [showOtpDialog, setShowOtpDialog] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Keep legacy resolvedMatchId state for UI messaging only
    useEffect(() => { if (effectiveMatchId) setResolvedMatchId(effectiveMatchId) }, [effectiveMatchId])

    // Show toast when delivery is completed
    useEffect(() => {
        const timeline = tracking?.timeline?.$values || []
        const deliveredItem = timeline.find(t => t.status === "Delivered")

        // Check if delivery just completed (isCompleted became true)
        if (deliveredItem?.isCompleted === true) {
            const hasShownToast = sessionStorage.getItem(`delivery-toast-${effectiveMatchId}`)
            if (!hasShownToast) {
                toast.success("Item delivered successfully! Payment has been released to the traveler.")
                sessionStorage.setItem(`delivery-toast-${effectiveMatchId}`, "true")
            }
        }
    }, [tracking?.timeline?.$values, effectiveMatchId])

    const handleGenerateOtp = async () => {
        const mId = matchId || resolvedMatchId
        if (!mId) return
        try {
            setOtpLoading(true)
            console.log("Generating receive OTP for matchId:", mId)
            const result = await generateReceiveOtp(mId)
            setOtp(result.otp)
            setShowOtpDialog(true)
        } catch (error) {
            console.error("Failed to generate OTP:", error)
            toast.error("Failed to generate OTP")
        } finally {
            setOtpLoading(false)
        }
    }

    const currentStage = stageIndex
    const progressPercent = computeProgressPercent(stageIndex)

    if (!effectiveMatchId) {
        return (
            <BuyerLayout>
                <div className="p-6 text-center">
                    <p className="text-foreground">Resolving order details...</p>
                    <p className="text-sm text-muted-foreground mt-2">If you arrived here via an offer link, we&apos;re resolving the associated match. This may take a moment.</p>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </div>
            </BuyerLayout>
        )
    }

    if (loading && !itemDetails) {
        return (
            <BuyerLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </BuyerLayout>
        )
    }


    return (
        <BuyerLayout>
            <div className="max-w-5xl mx-auto space-y-6">
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
                                    <Badge variant="destructive" className="bg-destructive text-destructive-foreground">
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

                {/* Next Steps */}
                <Card className="p-6 bg-muted border-border">
                    <h3 className="font-semibold text-foreground mb-2">Next Steps</h3>
                    <p className="text-sm text-foreground">
                        Actions required to move your request forward:
                    </p>
                    {(() => {
                        const timeline = tracking?.timeline?.$values || []
                        const deliveredItem = timeline.find(t => t.status === "Delivered")
                        const paidItem = timeline.find(t => t.status === "Paid")
                        // Enable if Delivered is current (meaning we are waiting for delivery confirmation)
                        const canConfirmDelivery = deliveredItem?.isCurrent === true
                        // Check if payment is completed to enable chat
                        const paymentCompleted = paidItem?.isCompleted === true

                        const handleChatWithTraveler = async () => {
                            if (!paymentCompleted || !effectiveMatchId || !itemDetails) {
                                console.log('❌ Cannot start chat:', { paymentCompleted, effectiveMatchId, itemDetails })
                                return
                            }

                            if (!itemDetails.requestId || !itemDetails.travelerId) {
                                console.error('❌ Missing required IDs:', { requestId: itemDetails.requestId, travelerId: itemDetails.travelerId })
                                toast.error('Unable to start chat - missing information')
                                return
                            }

                            try {
                                setActionLoading(true)

                                // First, try to resolve existing conversation
                                let conversationId = await resolveConversation(itemDetails.requestId, itemDetails.travelerId)

                                // If no conversation exists, initialize one
                                if (!conversationId) {
                                    console.log('🔵 No existing conversation, initializing new one...')
                                    await initiateConversation(itemDetails.requestId, itemDetails.travelerId)
                                    // Try to resolve again after initialization
                                    conversationId = await resolveConversation(itemDetails.requestId, itemDetails.travelerId)
                                }

                                console.log('✅ Conversation ready:', conversationId)
                                // Navigate to chat page
                                router.push('/buyer/chat')
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
                                    className={`mt-4 ${paymentCompleted ? "bg-[#0088cc] hover:bg-[#0077b3]" : "bg-gray-400 cursor-not-allowed"} text-white`}
                                    onClick={handleChatWithTraveler}
                                    disabled={!paymentCompleted || actionLoading}
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                                    Chat with Traveler
                                </Button>

                                <Button
                                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                                    onClick={handleGenerateOtp}
                                    disabled={!canConfirmDelivery}
                                >
                                    Confirm Delivery
                                </Button>
                                {!canConfirmDelivery && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Wait for the traveler to arrive to confirm delivery.
                                    </p>
                                )}
                            </>
                        )
                    })()}
                </Card>

                {/* OTP Dialog */}
                <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delivery Confirmation Code</DialogTitle>
                        </DialogHeader>
                        <div className="py-6 text-center space-y-4">
                            <p className="text-muted-foreground">
                                Share this code with the traveler to confirm you have received the item.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <div className="text-4xl font-mono font-bold tracking-wider text-foreground bg-muted px-6 py-3 rounded-lg border border-border">
                                    {otp}
                                </div>
                                <Button variant="outline" size="icon" onClick={() => {
                                    if (otp) {
                                        navigator.clipboard.writeText(otp)
                                        toast.success("Code copied to clipboard")
                                    }
                                }}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This code will expire in 10 minutes.
                            </p>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button>Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </BuyerLayout>
    )
}

export default function OrderStatusPage() {
    return (
        <Suspense fallback={
            <BuyerLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </BuyerLayout>
        }>
            <OrderStatusContent />
        </Suspense>
    )
}
