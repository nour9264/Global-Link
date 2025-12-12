/**
 * Buyer Request service for API calls
 */
import apiClient from "./api-client"
import { ensureAbsoluteUrl } from "@/lib/utils"
import type {
  BuyerRequest,
  GetMyRequestsResponse,
  GetRequestResponse,
  DeleteRequestResponse,
} from "@/types/buyer-request"
import type { Offer, GetOffersByRequestResponse } from "@/types/offer"
import type { ApiError } from "@/types/auth"

/**
 * Get all available requests (for travelers)
 * Endpoint: GET /api/BuyerRequest/all
 */
export async function getAllRequests(): Promise<BuyerRequest[]> {
  try {
    console.log("🔍 [getAllRequests] Fetching all requests from /api/BuyerRequest/all...")

    const response = await apiClient.get<any>("/api/BuyerRequest/all")

    console.log("📦 [getAllRequests] Raw API response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    })

    let requests: BuyerRequest[] = []

    // Handle different response formats
    if (Array.isArray(response.data)) {
      console.log("✅ [getAllRequests] Response is an array")
      requests = response.data.map((req: any) => mapRequestData(req))
    } else if (response.data?.data) {
      console.log("✅ [getAllRequests] Response has data property")
      requests = Array.isArray(response.data.data)
        ? response.data.data.map((req: any) => mapRequestData(req))
        : []
    } else if (response.data?.$values) {
      console.log("✅ [getAllRequests] Response has $values property")
      requests = Array.isArray(response.data.$values)
        ? response.data.$values.map((req: any) => mapRequestData(req))
        : []
    }

    console.log("📦 [getAllRequests] Mapped requests:", requests)
    return requests
  } catch (error: any) {
    console.error("❌ [getAllRequests] Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })
    // Return empty array instead of throwing to allow UI to show empty state
    return []
  }
}

/**
 * Get buyer's requests
 * Endpoint: GET /api/BuyerRequest/my-requests
 * @param status Optional status filter (query parameter)
 */
export async function getMyRequests(status?: string): Promise<BuyerRequest[]> {
  try {
    console.log("🔍 [getMyRequests] Fetching requests from /api/BuyerRequest/my-requests...")

    const params = status ? { status } : {}
    const response = await apiClient.get<GetMyRequestsResponse>("/api/BuyerRequest/my-requests", {
      params,
    })

    console.log("📦 [getMyRequests] Full API response:", response)
    console.log("📦 [getMyRequests] Response data:", response.data)

    if (!response.data) {
      console.warn("⚠️ [getMyRequests] Response data is null/undefined")
      return []
    }

    const data = response.data
    let requests: BuyerRequest[] = []

    // Case 1: Direct array response
    if (Array.isArray(data)) {
      console.log("✅ [getMyRequests] Found requests as direct array:", data)
      requests = data.map((req: any) => mapRequestData(req))
    }
    // Case 2: Response with isSuccess and requests array
    else if (data.isSuccess && data.requests && Array.isArray(data.requests)) {
      console.log("✅ [getMyRequests] Found requests in 'isSuccess.requests':", data.requests)
      requests = data.requests.map((req: any) => mapRequestData(req))
    }
    // Case 3: Nested data structure ($values)
    else if (data.data?.$values && Array.isArray(data.data.$values)) {
      console.log("✅ [getMyRequests] Found requests in 'data.$values':", data.data.$values)
      requests = data.data.$values.map((req: any) => mapRequestData(req))
    }
    // Case 4: Response with requests property (without isSuccess)
    else if (data.requests && Array.isArray(data.requests)) {
      console.log("✅ [getMyRequests] Found requests in 'requests' property:", data.requests)
      requests = data.requests.map((req: any) => mapRequestData(req))
    }
    // Case 5: Check for $values directly on data
    else if ((data as any).$values && Array.isArray((data as any).$values)) {
      console.log("✅ [getMyRequests] Found requests in '$values':", (data as any).$values)
      requests = (data as any).$values.map((req: any) => mapRequestData(req))
    }

    if (requests.length === 0) {
      console.warn("⚠️ [getMyRequests] No requests found. Response structure:", {
        keys: Object.keys(data),
        data: data,
        isArray: Array.isArray(data),
        hasRequests: "requests" in data,
        hasData: "data" in data,
        hasValues: "$values" in data,
      })
    } else {
      console.log(`✅ [getMyRequests] Successfully fetched ${requests.length} requests`)
    }

    return requests
  } catch (error: any) {
    console.error("❌ [getMyRequests] Error fetching requests:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      fullError: error,
    })

    // Return empty array to allow UI to show empty state
    return []
  }
}

/**
 * Get request details by ID
 * Endpoint: GET /api/BuyerRequest/{requestId}
 */
export async function getRequestById(requestId: string): Promise<BuyerRequest | null> {
  try {
    console.log(`🔍 [getRequestById] Fetching request details for ID: ${requestId}...`)

    const response = await apiClient.get<any>(`/api/BuyerRequest/${requestId}`)

    console.log("📦 [getRequestById] Full API response:", response)
    console.log("📦 [getRequestById] Response data:", response.data)

    if (!response.data) {
      console.warn("⚠️ [getRequestById] Response data is null/undefined")
      return null
    }

    const data = response.data
    let request: BuyerRequest | null = null

    // Handle different response structures
    // Case 1: Direct request object
    if (data.id || data.$id || data.requestId) {
      console.log("✅ [getRequestById] Found request as direct object:", data)
      request = mapRequestData(data)
    }
    // Case 2: Response with isSuccess and request data
    else if (data.isSuccess && (data.request || data.data)) {
      const requestData = data.request || data.data
      console.log("✅ [getRequestById] Found request in 'isSuccess.request/data':", requestData)
      request = mapRequestData(requestData)
    }

    if (!request) {
      console.warn("⚠️ [getRequestById] No request found. Response structure:", {
        keys: Object.keys(data),
        data: data,
        hasId: "id" in data || "$id" in data || "requestId" in data,
        hasRequest: "request" in data,
        hasData: "data" in data,
        isSuccess: data.isSuccess,
      })
    } else {
      console.log(`✅ [getRequestById] Successfully fetched request:`, request)
    }

    return request
  } catch (error: any) {
    console.error("❌ [getRequestById] Error fetching request:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      fullError: error,
    })

    return null
  }
}

/**
 * Delete a request
 * Endpoint: DELETE /api/BuyerRequest/{requestId}
 */
export async function deleteRequest(requestId: string): Promise<DeleteRequestResponse> {
  try {
    console.log(`🗑️ [deleteRequest] Deleting request ${requestId}...`)

    const response = await apiClient.delete<DeleteRequestResponse>(
      `/api/BuyerRequest/${requestId}`
    )

    console.log("✅ [deleteRequest] Request deletion response:", response.data)

    // Validate response structure
    if (!response.data) {
      // Some APIs return 204 No Content on successful delete
      if (response.status === 204) {
        return {
          isSuccess: true,
          message: "Request deleted successfully",
        }
      }
      throw new Error("Invalid response from server: no data received")
    }

    return response.data
  } catch (error: any) {
    console.error("❌ [deleteRequest] Error deleting request:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      fullError: error,
    })

    const apiError = error as ApiError

    // Handle 204 No Content (successful deletion)
    if (error?.response?.status === 204) {
      return {
        isSuccess: true,
        message: "Request deleted successfully",
      }
    }

    // Provide more detailed error message
    if (error?.response?.data) {
      const errorData = error.response.data
      if (errorData.message) {
        throw new Error(errorData.message)
      }
      if (errorData.errors) {
        const errorMessages = Object.entries(errorData.errors)
          .map(([key, value]: [string, any]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(", ")}`
            }
            return `${key}: ${value}`
          })
          .join("; ")
        throw new Error(errorMessages || apiError.message || "Failed to delete request")
      }
    }

    throw new Error(apiError.message || "Failed to delete request. Please check your connection and try again.")
  }
}

/**
 * Make an offer for a buyer request (traveler -> buyer)
 * Endpoint: POST /api/Offer/request/{requestId}
 */
export async function makeOfferForRequest(
  requestId: string,
  payload: { price: number; message?: string; travelerTripId: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`💬 [makeOfferForRequest] Posting offer for request ${requestId}...`, payload)

    const body: any = {
      price: payload.price,
      travelerTripId: payload.travelerTripId,
    }
    if (payload.message !== undefined) body.message = payload.message

    const response = await apiClient.post<any>(`/api/Offer/request/${requestId}`, body)

    console.log('✅ [makeOfferForRequest] Response:', {
      status: response.status,
      data: response.data,
    })

    // Treat 200 / 201 / 204 as success
    if (response.status >= 200 && response.status < 300) {
      return { success: true }
    }

    return { success: false, message: 'Failed to send offer. Please try again.' }
  } catch (error: any) {
    console.error('❌ [makeOfferForRequest] Full error object:', error)
    console.error('❌ [makeOfferForRequest] Error response:', error?.response)
    console.error('❌ [makeOfferForRequest] Error response data:', error?.response?.data)

    // Extract user-friendly error message from API response
    let errorMessage = 'Failed to send offer. Please try again.'

    if (error?.response?.data) {
      const errorData = error.response.data
      console.log('📍 [makeOfferForRequest] Parsing error data, type:', typeof errorData)
      console.log('📍 [makeOfferForRequest] Error data keys:', Object.keys(errorData))
      console.log('📍 [makeOfferForRequest] Full error data:', JSON.stringify(errorData, null, 2))

      // Handle different error response formats

      // 1. Direct string response
      if (typeof errorData === 'string') {
        errorMessage = errorData
        console.log('📍 [makeOfferForRequest] Found as direct string')
      }
      // 2. Standard error object with message property
      else if (errorData.message && typeof errorData.message === 'string' && errorData.message.trim()) {
        errorMessage = errorData.message
        console.log('📍 [makeOfferForRequest] Found in message property')
      }
      // 3. Error with error property
      else if (errorData.error && typeof errorData.error === 'string' && errorData.error.trim()) {
        errorMessage = errorData.error
        console.log('📍 [makeOfferForRequest] Found in error property')
      }
      // 4. Problem details (RFC 7231) - title or detail
      else if (errorData.title && typeof errorData.title === 'string' && errorData.title.trim()) {
        errorMessage = errorData.title
        console.log('📍 [makeOfferForRequest] Found in title property')
      }
      else if (errorData.detail && typeof errorData.detail === 'string' && errorData.detail.trim()) {
        errorMessage = errorData.detail
        console.log('📍 [makeOfferForRequest] Found in detail property')
      }
      // 5. Errors object with validation errors
      else if (errorData.errors && typeof errorData.errors === 'object') {
        console.log('📍 [makeOfferForRequest] Has errors object, keys:', Object.keys(errorData.errors))
        const firstErrorKey = Object.keys(errorData.errors)[0]
        if (firstErrorKey) {
          const firstError = errorData.errors[firstErrorKey]
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0]
            console.log('📍 [makeOfferForRequest] Found in errors array')
          } else if (typeof firstError === 'string' && firstError.trim()) {
            errorMessage = firstError
            console.log('📍 [makeOfferForRequest] Found in errors string')
          }
        }
      }
      // 6. Check for any string property that might be the message
      else {
        for (const [key, value] of Object.entries(errorData)) {
          if (typeof value === 'string' && value.trim() && value.length > 5) {
            errorMessage = value
            console.log(`📍 [makeOfferForRequest] Found in property "${key}"`)
            break
          }
        }
      }
    }
    // Try message from error itself
    else if (error?.message && typeof error.message === 'string' && error.message.trim()) {
      errorMessage = error.message
      console.log('📍 [makeOfferForRequest] Found in error.message')
    }

    console.log('📍 [makeOfferForRequest] Final extracted error message:', errorMessage)
    return { success: false, message: errorMessage }
  }
}

/**
 * Get offers for a specific request (offers from travellers on a buyer's request)
 * Endpoint: GET /api/Offer/request/{requestId}
 */
export async function getOffersByRequestId(requestId: string): Promise<Offer[]> {
  try {
    console.log(`🔍 [getOffersByRequestId] Fetching offers for request ${requestId}...`)

    const response = await apiClient.get<any>(`/api/Offer/request/${requestId}`)

    console.log('📦 [getOffersByRequestId] Raw API response:', {
      status: response.status,
      data: response.data,
    })

    let offers: Offer[] = []

    // Handle different response formats
    if (Array.isArray(response.data)) {
      console.log('✅ [getOffersByRequestId] Response is an array')
      offers = response.data.map((offer: any) => mapOfferData(offer))
    } else if (response.data?.data) {
      console.log('✅ [getOffersByRequestId] Response has data property')
      offers = Array.isArray(response.data.data)
        ? response.data.data.map((offer: any) => mapOfferData(offer))
        : Array.isArray((response.data.data as any)?.$values)
          ? (response.data.data as any).$values.map((offer: any) => mapOfferData(offer))
          : []
    } else if ((response.data as any)?.$values) {
      console.log('✅ [getOffersByRequestId] Response has $values property')
      offers = Array.isArray((response.data as any).$values)
        ? (response.data as any).$values.map((offer: any) => mapOfferData(offer))
        : []
    } else if (response.data?.offers) {
      console.log('✅ [getOffersByRequestId] Response has offers property')
      offers = Array.isArray(response.data.offers)
        ? response.data.offers.map((offer: any) => mapOfferData(offer))
        : []
    }

    console.log(`✅ [getOffersByRequestId] Successfully fetched ${offers.length} offers`)
    return offers
  } catch (error: any) {
    console.error('❌ [getOffersByRequestId] Error fetching offers:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    })
    return []
  }
}

/**
 * Get match ID by offer ID (for buyer-to-traveler offers)
 * Endpoint: GET /api/Match/by-offer/{offerId}
 */
export async function getMatchIdByOfferId(offerId: string): Promise<string | null> {
  try {
    console.log(`🔍 [getMatchIdByOfferId] Fetching match ID for offer ${offerId}...`);

    const response = await apiClient.get<any>(`/api/Match/by-offer/${offerId}`);

    console.log('📦 [getMatchIdByOfferId] Raw API response:', response.data);

    // Handle different response formats
    const matchId = response.data?.matchId || response.data?.id || response.data?.$id || null;

    if (matchId) {
      console.log(`✅ [getMatchIdByOfferId] Found match ID: ${matchId}`);
    } else {
      console.warn(`⚠️ [getMatchIdByOfferId] No match ID found in response`);
    }

    return matchId;
  } catch (error: any) {
    console.error('❌ [getMatchIdByOfferId] Error fetching match ID:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    return null;
  }
}

/**
 * Get buyer's offers (offers sent to travelers)
 * Endpoint: GET /api/Offer/my-offers
 */
export async function getMyOffers(): Promise<Offer[]> {
  try {
    console.log(`🔍 [getMyOffers] Fetching my offers...`)

    const response = await apiClient.get<any>(`/api/Offer/my-offers`)

    console.log('📦 [getMyOffers] Raw API response:', {
      status: response.status,
      data: response.data,
    })

    let offers: Offer[] = []

    // Handle different response formats
    if (Array.isArray(response.data)) {
      console.log('✅ [getMyOffers] Response is an array')
      offers = response.data.map((offer: any) => mapOfferData(offer))
    } else if (response.data?.data) {
      console.log('✅ [getMyOffers] Response has data property')
      offers = Array.isArray(response.data.data)
        ? response.data.data.map((offer: any) => mapOfferData(offer))
        : Array.isArray((response.data.data as any)?.$values)
          ? (response.data.data as any).$values.map((offer: any) => mapOfferData(offer))
          : []
    } else if ((response.data as any)?.$values) {
      console.log('✅ [getMyOffers] Response has $values property')
      offers = Array.isArray((response.data as any).$values)
        ? (response.data as any).$values.map((offer: any) => mapOfferData(offer))
        : []
    } else if (response.data?.offers) {
      console.log('✅ [getMyOffers] Response has offers property')
      offers = Array.isArray(response.data.offers)
        ? response.data.offers.map((offer: any) => mapOfferData(offer))
        : []
    }

    console.log(`✅ [getMyOffers] Successfully fetched ${offers.length} offers`)
    return offers
  } catch (error: any) {
    console.error('❌ [getMyOffers] Error fetching offers:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    })
    return []
  }
}

/**
 * Helper function to map API response data to Offer type
 */
function mapOfferData(data: any): Offer {
  return {
    id: data.id || data.$id || data.offerId || String(Math.random()),
    $id: data.$id,
    requestId: data.requestId || data.RequestId,
    tripId: data.tripId || data.TripId,
    travelerTripId: data.travelerTripId || data.TravelerTripId,
    matchId: data.matchId || data.MatchId,
    price: data.price !== undefined ? data.price : data.Price || 0,
    message: data.message || data.Message || "",
    status: data.status || data.Status || "Pending",
    travelerId: data.travelerId || data.TravelerId,
    buyerId: data.buyerId || data.BuyerId,
    travelerName: data.travelerName || data.TravelerName || "Unknown",
    travelerRating: data.travelerRating !== undefined ? data.travelerRating : data.TravelerRating,
    buyerName: data.buyerName || data.BuyerName,
    requestTitle: data.requestTitle || data.RequestTitle,
    request: data.request || data.Request,
    trip: data.trip || data.Trip,
    createdAt: data.createdAt || data.CreatedAt || data.createdAtUtc || data.CreatedAtUtc,
    updatedAt: data.updatedAt || data.UpdatedAt || data.updatedAtUtc || data.UpdatedAtUtc,
  }
}

/**
 * Helper function to map API response data to BuyerRequest type
 */
function mapRequestData(data: any): BuyerRequest {
  return {
    id: data.id || data.$id || data.requestId || String(Math.random()),
    $id: data.$id,
    title: data.title || data.Title || "",
    description: data.description || data.Description || "",
    category: data.category || data.Category || "",
    itemValue: data.itemValue !== undefined ? data.itemValue : data.ItemValue,
    fromCountry: data.fromCountry || data.FromCountry || "",
    fromCity: data.fromCity || data.FromCity || "",
    toCountry: data.toCountry || data.ToCountry || "",
    toCity: data.toCity || data.ToCity || "",
    targetArrivalDate: data.targetArrivalDate || data.TargetArrivalDate || "",
    budgetMax: data.budgetMax !== undefined ? data.budgetMax : data.BudgetMax,
    urgency: data.urgency || data.Urgency || "",
    totalPackages: data.totalPackages !== undefined ? data.totalPackages : data.TotalPackages,
    estimatedTotalWeightKg:
      data.estimatedTotalWeightKg !== undefined
        ? data.estimatedTotalWeightKg
        : data.EstimatedTotalWeightKg,
    isFragile: data.isFragile !== undefined ? data.isFragile : data.IsFragile || false,
    batteryType: data.batteryType || data.BatteryType || "",
    status: data.status || data.Status || "Pending",
    createdAt: data.createdAt || data.CreatedAt || data.createdAtUtc || data.CreatedAtUtc,
    updatedAt: data.updatedAt || data.UpdatedAt || data.updatedAtUtc || data.UpdatedAtUtc,
    photos: ((): string[] => {
      const photosArray: string[] = []

      // Case 1: imageUrl (singular) from backend - primary image field
      const imageUrl = data.imageUrl || data.ImageUrl
      if (imageUrl) {
        photosArray.push(imageUrl)
      }

      // Case 2: photos array of objects with fileUrl property
      const photosData = data.photos || data.Photos
      if (Array.isArray(photosData) && photosData.length > 0) {
        photosData.forEach((photo: any) => {
          // Handle both object format {fileUrl: "..."} and string format
          const url = photo?.fileUrl || photo?.FileUrl || photo?.url || (typeof photo === "string" ? photo : null)
          if (url && typeof url === "string") {
            photosArray.push(url)
          }
        })
      }

      // Case 3: photoUrls array of strings (legacy support)
      const photoUrls = data.photoUrls || data.PhotoUrls
      if (Array.isArray(photoUrls) && photoUrls.length > 0) {
        photoUrls.forEach((url: any) => {
          if (url && typeof url === "string") {
            photosArray.push(url)
          }
        })
      }

      // Normalize all URLs to absolute and remove duplicates
      return Array.from(new Set(
        photosArray
          .map(p => ensureAbsoluteUrl(p))
          .filter(Boolean) as string[]
      ))
    })(),
  }
}

