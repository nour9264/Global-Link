import apiClient from "./api-client"
import { getRequestById } from "./buyer-request-service"
import { ensureAbsoluteUrl } from "./utils"

export interface MatchItemDetails {
    matchId?: string
    buyerId?: string
    travelerId?: string
    requestId?: string
    title: string
    description: string
    quantity: number
    price: number
    weight: number
    dimensions: string
    imageUrl: string
    fromCity: string
    toCity: string
    deliveryDate: string
    buyerName: string
    travelerName: string
    isFragile?: boolean
    category?: string
    urgency?: string
}

export interface MatchTracking {
    status: string
    updatedAt: string
    timeline?: {
        $id?: string
        $values: {
            $id?: string
            status: string
            title: string
            description: string
            isCompleted: boolean
            isCurrent: boolean
            completedAt: string | null
        }[]
    }
    history: {
        status: string
        timestamp: string
        description: string
    }[]
}

export async function getMatchItemDetails(matchId: string): Promise<MatchItemDetails> {
    // console.log(`🔍 [getMatchItemDetails] Fetching details for match: ${matchId}`)
    const response = await apiClient.get(`/api/Match/${matchId}/item-details`)
    // console.log("📦 [getMatchItemDetails] Raw response:", response.data)

    const data = response.data
    const req = data.requestItemDetails || {}

    // Extract requestId to fetch full details if needed
    const requestId = req.requestId || req.id || req.$id

    let fullRequest = null
    if (requestId) {
        // console.log(`🔄 [getMatchItemDetails] Found requestId: ${requestId}, fetching full request details...`)
        try {
            fullRequest = await getRequestById(requestId)
            // console.log("✅ [getMatchItemDetails] Fetched full request:", fullRequest)
        } catch (err) {
            console.error("⚠️ [getMatchItemDetails] Failed to fetch full request:", err)
        }
    }

    // Merge data, preferring fullRequest for missing fields
    const title = req.title || fullRequest?.title || ""
    const description = req.description || fullRequest?.description || ""
    const quantity = req.quantity || req.totalPackages || fullRequest?.totalPackages || 1
    const price = req.itemValue || req.price || fullRequest?.itemValue || 0
    const weight = req.weight || req.estimatedTotalWeightKg || fullRequest?.estimatedTotalWeightKg || 0
    const dimensions = req.dimensions || ""

    // Extra fields
    const isFragile = req.isFragile || fullRequest?.isFragile || false
    const category = req.category || fullRequest?.category || ""
    const urgency = req.urgency || fullRequest?.urgency || ""

    // Image handling
    let imageUrl = req.mainImageUrl || (req.photos && req.photos.length > 0 ? req.photos[0] : "")
    if (!imageUrl && fullRequest?.photos && fullRequest.photos.length > 0) {
        imageUrl = fullRequest.photos[0]
    }
    imageUrl = ensureAbsoluteUrl(imageUrl) || ""

    const fromCity = req.fromCity || fullRequest?.fromCity || ""
    const toCity = req.toCity || fullRequest?.toCity || ""
    const deliveryDate = req.targetArrivalDate || req.deliveryDate || fullRequest?.targetArrivalDate || ""

    // Extract buyer and traveler names from the response
    const buyerName = data.buyerName || ""
    const travelerName = data.travelerName || ""
    
    // Extract IDs from root level of response
    const responseMatchId = data.matchId || matchId
    const buyerId = data.buyerId || ""
    const travelerId = data.travelerId || ""
    const extractedRequestId = requestId || data.requestId || req.requestId || ""

    console.log("📊 [getMatchItemDetails] Final mapped details:", {
        matchId: responseMatchId, buyerId, travelerId, requestId: extractedRequestId,
        title, description, quantity, price, fromCity, toCity, deliveryDate, isFragile, buyerName, travelerName
    })

    return {
        matchId: responseMatchId,
        buyerId,
        travelerId,
        requestId: extractedRequestId,
        title,
        description,
        quantity,
        price,
        weight,
        dimensions,
        imageUrl,
        fromCity,
        toCity,
        deliveryDate,
        buyerName,
        travelerName,
        isFragile,
        category,
        urgency
    }
}

export async function getMatchTracking(matchId: string): Promise<MatchTracking> {
    console.log(`🔍 [getMatchTracking] Fetching tracking for match: ${matchId}`)
    const response = await apiClient.get(`/api/Match/${matchId}/tracking`)
    console.log("📦 [getMatchTracking] Raw tracking response:", response.data)
    console.log("📊 [getMatchTracking] Timeline data:", response.data?.timeline)
    console.log("📋 [getMatchTracking] Timeline $values:", response.data?.timeline?.$values)
    return response.data
}

export async function confirmItemReceived(matchId: string): Promise<void> {
    await apiClient.post(`/api/Match/${matchId}/confirm-item-received`)
}

export async function confirmPlaneArrived(matchId: string): Promise<void> {
    await apiClient.post(`/api/Match/${matchId}/confirm-plane-arrived`)
}

export async function generateReceiveOtp(matchId: string): Promise<{ otp: string }> {
    const response = await apiClient.post(`/api/Match/${matchId}/generate-receive-otp`)
    return response.data
}

export async function verifyReceiveOtp(matchId: string, otp: string): Promise<void> {
    await apiClient.post(`/api/Match/${matchId}/verify-receive-otp`, { otp })
}

// Resolve a matchId from an offerId
export async function getMatchIdByOffer(offerId: string): Promise<string | null> {
    try {
        console.log("🔎 [getMatchIdByOffer] Resolving matchId from offerId...", offerId)
        const response = await apiClient.get(`/api/Match/by-offer/${offerId}`)

        const data = response.data
        // Normalize common shapes: { matchId }, { id }, direct string
        const matchId = typeof data === "string" ? data
            : data?.matchId ?? data?.id ?? null

        console.log("✅ [getMatchIdByOffer] Resolved matchId:", matchId)
        return matchId
    } catch (err) {
        console.error("❌ [getMatchIdByOffer] Error:", err)
        return null
    }
}
