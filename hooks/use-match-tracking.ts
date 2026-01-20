import { useEffect, useRef, useState } from "react"
import { getMatchItemDetails, getMatchTracking, getMatchIdByOffer, MatchItemDetails, MatchTracking } from "@/lib/match-service"
import { getStageIndex, getPollingInterval, debugLog } from "@/lib/order-tracking"
import { getOfferById } from "@/lib/offer-service"
import { getRequestById } from "@/lib/buyer-request-service"

interface UseMatchTrackingParams {
  matchIdParam?: string | null
  offerIdParam?: string | null
}

interface UseMatchTrackingResult {
  matchId: string | null
  itemDetails: MatchItemDetails | null
  tracking: MatchTracking | null
  stageIndex: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Hook encapsulating: matchId resolution (offer→match), initial fetch, adaptive polling, and stage derivation.
export function useMatchTracking({ matchIdParam, offerIdParam }: UseMatchTrackingParams): UseMatchTrackingResult {
  const [resolvedMatchId, setResolvedMatchId] = useState<string | null>(matchIdParam || null)
  const [itemDetails, setItemDetails] = useState<MatchItemDetails | null>(null)
  const [tracking, setTracking] = useState<MatchTracking | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)
  const firstLoadRef = useRef<boolean>(true)
  const itemDetailsLoadedRef = useRef<boolean>(false)

  // Resolve matchId from offerId if needed.
  useEffect(() => {
    if (!resolvedMatchId && offerIdParam) {
      ; (async () => {
        try {
          debugLog("Resolving matchId from offerId", offerIdParam)
          const mId = await getMatchIdByOffer(offerIdParam)
          if (mId) {
            setResolvedMatchId(mId)
            try { sessionStorage.setItem("lastOfferId", offerIdParam) } catch { }
          } else {
            setError("Unable to resolve match id for given offer id")
          }
        } catch (e: any) {
          setError(e?.message || "Failed to resolve match id")
        }
      })()
    }
  }, [offerIdParam, resolvedMatchId])

  const effectiveMatchId = resolvedMatchId

  // Stable fetch function for polling
  const fetchTrackingOnly = async () => {
    if (!effectiveMatchId) return null
    try {
      const track = await getMatchTracking(effectiveMatchId)
      setTracking(track)
      return track
    } catch (e) {
      console.error("Polling error", e)
      return null
    }
  }

  const fetchAll = async () => {
    if (!effectiveMatchId) return
    try {
      if (firstLoadRef.current) setLoading(true)

      // Only fetch details if not already loaded
      let details = itemDetails
      if (!itemDetailsLoadedRef.current) {
        debugLog("Fetching item details for", effectiveMatchId)
        details = await getMatchItemDetails(effectiveMatchId)

        // Robust Fallback: If details are missing key fields (like description or deliveryDate)
        // AND we have an offerId, try to fetch the request directly via the offer.
        if (offerIdParam && (!details.description || !details.deliveryDate || !details.requestId)) {
          console.log("⚠️ [useMatchTracking] Missing key details, attempting fallback fetch via offerId:", offerIdParam)
          try {
            const offer = await getOfferById(offerIdParam)
            if (offer && offer.requestId) {
              const fullRequest = await getRequestById(offer.requestId)
              console.log("✅ [useMatchTracking] Fallback fetched full request:", fullRequest)

              if (fullRequest) {
                // Merge missing fields
                details = {
                  ...details,
                  requestId: fullRequest.id || fullRequest.$id || details.requestId,
                  description: details.description || fullRequest.description || "",
                  title: details.title || fullRequest.title || "",
                  deliveryDate: details.deliveryDate || fullRequest.targetArrivalDate || "",
                  fromCity: details.fromCity || fullRequest.fromCity || "",
                  toCity: details.toCity || fullRequest.toCity || "",
                  imageUrl: details.imageUrl || (fullRequest.photos && fullRequest.photos.length > 0 ? fullRequest.photos[0] : "") || "",
                  quantity: details.quantity || fullRequest.totalPackages || 1,
                  price: details.price || fullRequest.itemValue || 0,
                  weight: details.weight || fullRequest.estimatedTotalWeightKg || 0,
                  isFragile: details.isFragile ?? fullRequest.isFragile,
                  category: details.category || fullRequest.category || "",
                  urgency: details.urgency || fullRequest.urgency || "",
                }
              }
            }
          } catch (fbError) {
            console.error("❌ [useMatchTracking] Fallback fetch failed:", fbError)
          }
        }

        setItemDetails(details)
        itemDetailsLoadedRef.current = true
      }

      const track = await getMatchTracking(effectiveMatchId)
      setTracking(track)
      setError(null)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch tracking")
    } finally {
      setLoading(false)
      firstLoadRef.current = false
    }
  }

  // Initial fetch + adaptive polling
  useEffect(() => {
    if (!effectiveMatchId) return

    // Do initial fetch
    fetchAll().then((initialTrack) => {
      // Setup adaptive polling based on stage
      const currentStage = getStageIndex(tracking?.status) // Use state or initialTrack? initialTrack is safer if state update is async
      // But getStageIndex handles undefined.
      // Let's use the track we just fetched if possible, but fetchAll returns void in original signature? 
      // I updated fetchAll to return void in the interface but I can make it return track internally.
      // Actually, let's just use the state in the next render cycle or setup interval after a short delay like before.

      // Reverting to the previous pattern of setting up interval after a delay to ensure state is settled
      // But using fetchTrackingOnly in the interval to avoid re-fetching details.
    })

    function setupInterval(currentStage: number) {
      const intervalMs = getPollingInterval(currentStage)
      debugLog("Setting polling interval", intervalMs)

      if (intervalRef.current) window.clearInterval(intervalRef.current)

      intervalRef.current = window.setInterval(async () => {
        const track = await fetchTrackingOnly()
        const newStage = getStageIndex(track?.status)

        // If stage advanced and interval policy changes, reset interval.
        const desired = getPollingInterval(newStage)
        if (desired !== intervalMs) {
          debugLog("Stage advanced; reconfiguring polling interval", desired)
          setupInterval(newStage)
        }
      }, intervalMs)
    }

    // Configure interval after first fetch resolves tracking
    const timeout = window.setTimeout(() => {
      const currentStage = getStageIndex(tracking?.status)
      setupInterval(currentStage)
    }, 1500)

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      window.clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMatchId])

  const stageIndex = getStageIndex(tracking?.status)

  return {
    matchId: effectiveMatchId,
    itemDetails,
    tracking,
    stageIndex,
    loading,
    error,
    refetch: fetchAll,
  }
}

export default useMatchTracking