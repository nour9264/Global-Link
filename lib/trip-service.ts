/**
 * Trip service for API calls
 */
import apiClient from "./api-client"
import type {
  CreateTripRequest,
  CreateTripResponse,
  UpdateTripRequest,
  UpdateTripResponse,
  DeleteTripResponse,
  TravelerAddressesResponse,
  TravelerAddress,
  Trip,
  GetMyTripsResponse,
  AvailableTrip,
  GetAvailableTripsResponse,
  TravelerSummary,
} from "@/types/trip"
import type { Offer } from "@/types/offer"
import type { ApiError } from "@/types/auth"

/**
 * Create a new traveler trip
 * Endpoint: POST /api/TravelerTrip
 * 
 * IMPORTANT: Check your API documentation to confirm the expected field naming convention.
 * Most .NET APIs accept camelCase for JSON, but some may require PascalCase.
 * 
 * If you get a 400 Bad Request error suggesting field name issues, try switching
 * USE_PASCAL_CASE to true below.
 */
const USE_PASCAL_CASE = false // Set to true if API requires PascalCase field names

export async function createTrip(request: CreateTripRequest): Promise<CreateTripResponse> {
  try {
    console.log("🚀 [createTrip] Creating trip with data:", request)
    console.log("📋 [createTrip] Using field naming convention:", USE_PASCAL_CASE ? "PascalCase" : "camelCase")

    // Prepare request body with appropriate naming convention
    const requestBody = USE_PASCAL_CASE
      ? {
        // PascalCase (if API requires it)
        FromCountry: request.fromCountry,
        FromCity: request.fromCity,
        ToCountry: request.toCountry,
        ToCity: request.toCity,
        DepartureDate: request.departureDate,
        ReturnDate: request.returnDate,
        CapacityKg: request.capacityKg,
        MaxPackageWeightKg: request.maxPackageWeightKg,
        ReceiveAddressId: request.receiveAddressId,
        ReceiveWindowStartUtc: request.receiveWindowStartUtc,
        ReceiveByDeadlineUtc: request.receiveByDeadlineUtc,
        Notes: request.notes,
      }
      : {
        // camelCase (standard for JSON APIs)
        fromCountry: request.fromCountry,
        fromCity: request.fromCity,
        toCountry: request.toCountry,
        toCity: request.toCity,
        departureDate: request.departureDate,
        returnDate: request.returnDate,
        capacityKg: request.capacityKg,
        maxPackageWeightKg: request.maxPackageWeightKg,
        receiveAddressId: request.receiveAddressId,
        receiveWindowStartUtc: request.receiveWindowStartUtc,
        receiveByDeadlineUtc: request.receiveByDeadlineUtc,
        notes: request.notes,
      }

    console.log("📤 [createTrip] Sending request to /api/TravelerTrip:", {
      endpoint: "/api/TravelerTrip",
      method: "POST",
      fieldNaming: USE_PASCAL_CASE ? "PascalCase" : "camelCase",
      data: requestBody,
    })

    const response = await apiClient.post<CreateTripResponse>("/api/TravelerTrip", requestBody)

    console.log("✅ [createTrip] Trip creation response:", response.data)

    // Validate response structure
    if (!response.data) {
      throw new Error("Invalid response from server: no data received")
    }

    return response.data
  } catch (error: any) {
    console.error("❌ [createTrip] Error creating trip:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      fullError: error,
    })

    const apiError = error as ApiError

    // Provide more detailed error message
    if (error?.response?.data) {
      const errorData = error.response.data

      // Check if it's a field naming issue (400 Bad Request often indicates this)
      if (error?.response?.status === 400) {
        console.warn("⚠️ [createTrip] 400 Bad Request - This might indicate a field naming issue.")
        console.warn("⚠️ [createTrip] Try setting USE_PASCAL_CASE to", !USE_PASCAL_CASE, "in trip-service.ts")
      }

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
        throw new Error(errorMessages || apiError.message || "Failed to create trip")
      }
    }

    throw new Error(apiError.message || "Failed to create trip. Please check your connection and try again.")
  }
}

/**
 * Fetch traveler addresses from user profile
 * Endpoint: GET /api/UserProfile/addresses
 * 
 * Alternative endpoints to try if this fails:
 * - GET /api/UserProfile
 * - GET /api/Address
 * - GET /api/Traveler/addresses
 */
export async function getTravelerAddresses(): Promise<TravelerAddress[]> {
  const endpointsToTry = [
    "/api/UserProfile/addresses",
    "/api/UserProfile",
    "/api/Address",
    "/api/Traveler/addresses",
  ]

  for (const endpoint of endpointsToTry) {
    try {
      console.log(`🔍 [getTravelerAddresses] Trying endpoint: ${endpoint}...`)

      const response = await apiClient.get<any>(endpoint)

      console.log(`📦 [getTravelerAddresses] Response from ${endpoint}:`, response.data)
      console.log(`📦 [getTravelerAddresses] Response data type:`, typeof response.data)
      console.log(`📦 [getTravelerAddresses] Is array?`, Array.isArray(response.data))

      if (!response.data) {
        console.warn(`⚠️ [getTravelerAddresses] Response data is null/undefined from ${endpoint}`)
        continue // Try next endpoint
      }

      // Handle different response structures
      const data = response.data
      let addresses: TravelerAddress[] = []

      // Case 1: Direct array response
      if (Array.isArray(data)) {
        console.log(`✅ [getTravelerAddresses] Found addresses as direct array from ${endpoint}:`, data)
        addresses = data.map((addr: any, index: number) => ({
          id: addr.id || addr.$id || addr.addressId || `${endpoint}-addr-${index}`,
          address: addr.address || addr.street || addr.addressLine || addr.Address || "",
          city: addr.city || addr.City || "",
          country: addr.country || addr.Country || "",
          postalCode: addr.postalCode || addr.zipCode || addr.PostalCode || addr.ZipCode || "",
          isDefault: addr.isDefault || addr.IsDefault || index === 0,
        }))
      }
      // Case 2: Response with isSuccess and addresses array
      else if (data.isSuccess && data.addresses && Array.isArray(data.addresses)) {
        console.log(`✅ [getTravelerAddresses] Found addresses in 'isSuccess.addresses' from ${endpoint}:`, data.addresses)
        addresses = data.addresses.map((addr: any, index: number) => ({
          id: addr.id || addr.$id || addr.addressId || `${endpoint}-addr-${index}`,
          address: addr.address || addr.street || addr.addressLine || addr.Address || "",
          city: addr.city || addr.City || "",
          country: addr.country || addr.Country || "",
          postalCode: addr.postalCode || addr.zipCode || addr.PostalCode || addr.ZipCode || "",
          isDefault: addr.isDefault || addr.IsDefault || index === 0,
        }))
      }
      // Case 3: Nested data structure ($values)
      else if (data.data?.$values && Array.isArray(data.data.$values)) {
        console.log(`✅ [getTravelerAddresses] Found addresses in 'data.$values' from ${endpoint}:`, data.data.$values)
        addresses = data.data.$values.map((addr: any, index: number) => ({
          id: addr.id || addr.$id || addr.addressId || `${endpoint}-addr-${index}`,
          address: addr.address || addr.street || addr.addressLine || addr.Address || "",
          city: addr.city || addr.City || "",
          country: addr.country || addr.Country || "",
          postalCode: addr.postalCode || addr.zipCode || addr.PostalCode || addr.ZipCode || "",
          isDefault: addr.isDefault || addr.IsDefault || index === 0,
        }))
      }
      // Case 4: Response with addresses property (without isSuccess)
      else if (data.addresses && Array.isArray(data.addresses)) {
        console.log(`✅ [getTravelerAddresses] Found addresses in 'addresses' property from ${endpoint}:`, data.addresses)
        addresses = data.addresses.map((addr: any, index: number) => ({
          id: addr.id || addr.$id || addr.addressId || `${endpoint}-addr-${index}`,
          address: addr.address || addr.street || addr.addressLine || addr.Address || "",
          city: addr.city || addr.City || "",
          country: addr.country || addr.Country || "",
          postalCode: addr.postalCode || addr.zipCode || addr.PostalCode || addr.ZipCode || "",
          isDefault: addr.isDefault || addr.IsDefault || index === 0,
        }))
      }
      // Case 5: Check for $values directly on data
      else if (data.$values && Array.isArray(data.$values)) {
        console.log(`✅ [getTravelerAddresses] Found addresses in '$values' from ${endpoint}:`, data.$values)
        addresses = data.$values.map((addr: any, index: number) => ({
          id: addr.id || addr.$id || addr.addressId || `${endpoint}-addr-${index}`,
          address: addr.address || addr.street || addr.addressLine || addr.Address || "",
          city: addr.city || addr.City || "",
          country: addr.country || addr.Country || "",
          postalCode: addr.postalCode || addr.zipCode || addr.PostalCode || addr.ZipCode || "",
          isDefault: addr.isDefault || addr.IsDefault || index === 0,
        }))
      }
      // Case 6: User profile structure with nested addresses
      else if (data.user?.addresses?.$values && Array.isArray(data.user.addresses.$values)) {
        console.log(`✅ [getTravelerAddresses] Found addresses in 'user.addresses.$values' from ${endpoint}:`, data.user.addresses.$values)
        addresses = data.user.addresses.$values.map((addr: any, index: number) => ({
          id: addr.id || addr.$id || addr.addressId || `${endpoint}-addr-${index}`,
          address: addr.address || addr.street || addr.addressLine || addr.Address || "",
          city: addr.city || addr.City || "",
          country: addr.country || addr.Country || "",
          postalCode: addr.postalCode || addr.zipCode || addr.PostalCode || addr.ZipCode || "",
          isDefault: addr.isDefault || addr.IsDefault || index === 0,
        }))
      }
      // Case 7: Check if addresses are directly in user object
      else if (data.addresses?.$values && Array.isArray(data.addresses.$values)) {
        console.log(`✅ [getTravelerAddresses] Found addresses in 'addresses.$values' from ${endpoint}:`, data.addresses.$values)
        addresses = data.addresses.$values.map((addr: any, index: number) => ({
          id: addr.id || addr.$id || addr.addressId || `${endpoint}-addr-${index}`,
          address: addr.address || addr.street || addr.addressLine || addr.Address || "",
          city: addr.city || addr.City || "",
          country: addr.country || addr.Country || "",
          postalCode: addr.postalCode || addr.zipCode || addr.PostalCode || addr.ZipCode || "",
          isDefault: addr.isDefault || addr.IsDefault || index === 0,
        }))
      }

      // If we found addresses, return them
      if (addresses.length > 0) {
        console.log(`✅ [getTravelerAddresses] Successfully fetched ${addresses.length} addresses from ${endpoint}`)
        return addresses
      }

      // Log all keys to help debug if no addresses found
      console.warn(`⚠️ [getTravelerAddresses] No addresses found in ${endpoint}. Response structure:`, {
        keys: Object.keys(data),
        data: data,
        isArray: Array.isArray(data),
        hasAddresses: 'addresses' in data,
        hasData: 'data' in data,
        hasValues: '$values' in data,
        hasUser: 'user' in data,
      })

    } catch (error: any) {
      // Log error but continue to next endpoint
      console.warn(`⚠️ [getTravelerAddresses] Error with endpoint ${endpoint}:`, {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      })

      // If it's not a 404 or 401, and it's the first endpoint, log the full error
      if (endpoint === endpointsToTry[0] && error?.response?.status !== 404 && error?.response?.status !== 401) {
        console.error(`❌ [getTravelerAddresses] Detailed error from ${endpoint}:`, {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
        })
      }

      // Continue to next endpoint
      continue
    }
  }

  // If all endpoints failed, return empty array
  console.error("❌ [getTravelerAddresses] All endpoints failed. No addresses found.")
  return []
}

/**
 * Get traveler's trips
 * Endpoint: GET /api/TravelerTrip/my-trips
 */
export async function getMyTrips(): Promise<Trip[]> {
  try {
    console.log("🔍 [getMyTrips] Fetching trips from /api/TravelerTrip/my-trips...")

    const response = await apiClient.get<GetMyTripsResponse>("/api/TravelerTrip/my-trips")

    console.log("📦 [getMyTrips] Full API response:", response)
    console.log("📦 [getMyTrips] Response data:", response.data)

    if (!response.data) {
      console.warn("⚠️ [getMyTrips] Response data is null/undefined")
      return []
    }

    const data = response.data
    let trips: Trip[] = []

    // Case 1: Direct array response
    if (Array.isArray(data)) {
      console.log("✅ [getMyTrips] Found trips as direct array:", data)
      trips = data.map((trip: any) => ({
        id: trip.id || trip.$id || trip.tripId || String(Math.random()),
        $id: trip.$id,
        fromCountry: trip.fromCountry || trip.FromCountry || "",
        fromCity: trip.fromCity || trip.FromCity || "",
        toCountry: trip.toCountry || trip.ToCountry || "",
        toCity: trip.toCity || trip.ToCity || "",
        departureDate: trip.departureDate || trip.DepartureDate || "",
        returnDate: trip.returnDate || trip.ReturnDate || "",
        capacityKg: trip.capacityKg || trip.CapacityKg || 0,
        maxPackageWeightKg: trip.maxPackageWeightKg || trip.MaxPackageWeightKg || 0,
        notes: trip.notes || trip.Notes || "",
        status: trip.status || trip.Status || "Active",
        createdAt: trip.createdAt || trip.CreatedAt || trip.createdAtUtc || trip.CreatedAtUtc,
        updatedAt: trip.updatedAt || trip.UpdatedAt || trip.updatedAtUtc || trip.UpdatedAtUtc,
        receiveAddressId: trip.receiveAddressId || trip.ReceiveAddressId,
        receiveWindowStartUtc: trip.receiveWindowStartUtc || trip.ReceiveWindowStartUtc,
        receiveByDeadlineUtc: trip.receiveByDeadlineUtc || trip.ReceiveByDeadlineUtc,
        totalRequests: trip.totalRequests || trip.TotalRequests || 0,
        pendingRequests: trip.pendingRequests || trip.PendingRequests || 0,
        confirmedRequests: trip.confirmedRequests || trip.ConfirmedRequests || 0,
      }))
    }
    // Case 2: Response with isSuccess and trips array
    else if (data.isSuccess && data.trips && Array.isArray(data.trips)) {
      console.log("✅ [getMyTrips] Found trips in 'isSuccess.trips':", data.trips)
      trips = data.trips.map((trip: any) => ({
        id: trip.id || trip.$id || trip.tripId || String(Math.random()),
        $id: trip.$id,
        fromCountry: trip.fromCountry || trip.FromCountry || "",
        fromCity: trip.fromCity || trip.FromCity || "",
        toCountry: trip.toCountry || trip.ToCountry || "",
        toCity: trip.toCity || trip.ToCity || "",
        departureDate: trip.departureDate || trip.DepartureDate || "",
        returnDate: trip.returnDate || trip.ReturnDate || "",
        capacityKg: trip.capacityKg || trip.CapacityKg || 0,
        maxPackageWeightKg: trip.maxPackageWeightKg || trip.MaxPackageWeightKg || 0,
        notes: trip.notes || trip.Notes || "",
        status: trip.status || trip.Status || "Active",
        createdAt: trip.createdAt || trip.CreatedAt || trip.createdAtUtc || trip.CreatedAtUtc,
        updatedAt: trip.updatedAt || trip.UpdatedAt || trip.updatedAtUtc || trip.UpdatedAtUtc,
        receiveAddressId: trip.receiveAddressId || trip.ReceiveAddressId,
        receiveWindowStartUtc: trip.receiveWindowStartUtc || trip.ReceiveWindowStartUtc,
        receiveByDeadlineUtc: trip.receiveByDeadlineUtc || trip.ReceiveByDeadlineUtc,
        totalRequests: trip.totalRequests || trip.TotalRequests || 0,
        pendingRequests: trip.pendingRequests || trip.PendingRequests || 0,
        confirmedRequests: trip.confirmedRequests || trip.ConfirmedRequests || 0,
      }))
    }
    // Case 3: Nested data structure ($values)
    else if (data.data?.$values && Array.isArray(data.data.$values)) {
      console.log("✅ [getMyTrips] Found trips in 'data.$values':", data.data.$values)
      trips = data.data.$values.map((trip: any) => ({
        id: trip.id || trip.$id || trip.tripId || String(Math.random()),
        $id: trip.$id,
        fromCountry: trip.fromCountry || trip.FromCountry || "",
        fromCity: trip.fromCity || trip.FromCity || "",
        toCountry: trip.toCountry || trip.ToCountry || "",
        toCity: trip.toCity || trip.ToCity || "",
        departureDate: trip.departureDate || trip.DepartureDate || "",
        returnDate: trip.returnDate || trip.ReturnDate || "",
        capacityKg: trip.capacityKg || trip.CapacityKg || 0,
        maxPackageWeightKg: trip.maxPackageWeightKg || trip.MaxPackageWeightKg || 0,
        notes: trip.notes || trip.Notes || "",
        status: trip.status || trip.Status || "Active",
        createdAt: trip.createdAt || trip.CreatedAt || trip.createdAtUtc || trip.CreatedAtUtc,
        updatedAt: trip.updatedAt || trip.UpdatedAt || trip.updatedAtUtc || trip.UpdatedAtUtc,
        receiveAddressId: trip.receiveAddressId || trip.ReceiveAddressId,
        receiveWindowStartUtc: trip.receiveWindowStartUtc || trip.ReceiveWindowStartUtc,
        receiveByDeadlineUtc: trip.receiveByDeadlineUtc || trip.ReceiveByDeadlineUtc,
        totalRequests: trip.totalRequests || trip.TotalRequests || 0,
        pendingRequests: trip.pendingRequests || trip.PendingRequests || 0,
        confirmedRequests: trip.confirmedRequests || trip.ConfirmedRequests || 0,
      }))
    }
    // Case 4: Response with trips property (without isSuccess)
    else if (data.trips && Array.isArray(data.trips)) {
      console.log("✅ [getMyTrips] Found trips in 'trips' property:", data.trips)
      trips = data.trips.map((trip: any) => ({
        id: trip.id || trip.$id || trip.tripId || String(Math.random()),
        $id: trip.$id,
        fromCountry: trip.fromCountry || trip.FromCountry || "",
        fromCity: trip.fromCity || trip.FromCity || "",
        toCountry: trip.toCountry || trip.ToCountry || "",
        toCity: trip.toCity || trip.ToCity || "",
        departureDate: trip.departureDate || trip.DepartureDate || "",
        returnDate: trip.returnDate || trip.ReturnDate || "",
        capacityKg: trip.capacityKg || trip.CapacityKg || 0,
        maxPackageWeightKg: trip.maxPackageWeightKg || trip.MaxPackageWeightKg || 0,
        notes: trip.notes || trip.Notes || "",
        status: trip.status || trip.Status || "Active",
        createdAt: trip.createdAt || trip.CreatedAt || trip.createdAtUtc || trip.CreatedAtUtc,
        updatedAt: trip.updatedAt || trip.UpdatedAt || trip.updatedAtUtc || trip.UpdatedAtUtc,
        receiveAddressId: trip.receiveAddressId || trip.ReceiveAddressId,
        receiveWindowStartUtc: trip.receiveWindowStartUtc || trip.ReceiveWindowStartUtc,
        receiveByDeadlineUtc: trip.receiveByDeadlineUtc || trip.ReceiveByDeadlineUtc,
        totalRequests: trip.totalRequests || trip.TotalRequests || 0,
        pendingRequests: trip.pendingRequests || trip.PendingRequests || 0,
        confirmedRequests: trip.confirmedRequests || trip.ConfirmedRequests || 0,
      }))
    }
    // Case 5: Check for $values directly on data (type assertion needed)
    else if ((data as any).$values && Array.isArray((data as any).$values)) {
      console.log("✅ [getMyTrips] Found trips in '$values':", (data as any).$values)
      trips = (data as any).$values.map((trip: any) => ({
        id: trip.id || trip.$id || trip.tripId || String(Math.random()),
        $id: trip.$id,
        fromCountry: trip.fromCountry || trip.FromCountry || "",
        fromCity: trip.fromCity || trip.FromCity || "",
        toCountry: trip.toCountry || trip.ToCountry || "",
        toCity: trip.toCity || trip.ToCity || "",
        departureDate: trip.departureDate || trip.DepartureDate || "",
        returnDate: trip.returnDate || trip.ReturnDate || "",
        capacityKg: trip.capacityKg || trip.CapacityKg || 0,
        maxPackageWeightKg: trip.maxPackageWeightKg || trip.MaxPackageWeightKg || 0,
        notes: trip.notes || trip.Notes || "",
        status: trip.status || trip.Status || "Active",
        createdAt: trip.createdAt || trip.CreatedAt || trip.createdAtUtc || trip.CreatedAtUtc,
        updatedAt: trip.updatedAt || trip.UpdatedAt || trip.updatedAtUtc || trip.UpdatedAtUtc,
        receiveAddressId: trip.receiveAddressId || trip.ReceiveAddressId,
        receiveWindowStartUtc: trip.receiveWindowStartUtc || trip.ReceiveWindowStartUtc,
        receiveByDeadlineUtc: trip.receiveByDeadlineUtc || trip.ReceiveByDeadlineUtc,
        totalRequests: trip.totalRequests || trip.TotalRequests || 0,
        pendingRequests: trip.pendingRequests || trip.PendingRequests || 0,
        confirmedRequests: trip.confirmedRequests || trip.ConfirmedRequests || 0,
      }))
    }

    if (trips.length === 0) {
      console.warn("⚠️ [getMyTrips] No trips found. Response structure:", {
        keys: Object.keys(data),
        data: data,
        isArray: Array.isArray(data),
        hasTrips: 'trips' in data,
        hasData: 'data' in data,
        hasValues: '$values' in data,
      })
    } else {
      console.log(`✅ [getMyTrips] Successfully fetched ${trips.length} trips`)
    }

    return trips
  } catch (error: any) {
    console.error("❌ [getMyTrips] Error fetching trips:", {
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
 * Get trip details by ID
 * Endpoint: GET /api/TravelerTrip/{tripId}
 */
export async function getTripById(tripId: string): Promise<Trip | null> {
  try {
    console.log(`🔍 [getTripById] Fetching trip details for ID: ${tripId}...`)

    const response = await apiClient.get<any>(`/api/TravelerTrip/${tripId}`)

    console.log("📦 [getTripById] Full API response:", response)
    console.log("📦 [getTripById] Response data:", response.data)

    if (!response.data) {
      console.warn("⚠️ [getTripById] Response data is null/undefined")
      return null
    }

    const data = response.data
    let trip: Trip | null = null

    // Handle different response structures
    // Case 1: Direct trip object
    if (data.id || data.$id || data.tripId) {
      console.log("✅ [getTripById] Found trip as direct object:", data)
      trip = {
        id: data.id || data.$id || data.tripId || tripId,
        $id: data.$id,
        fromCountry: data.fromCountry || data.FromCountry || "",
        fromCity: data.fromCity || data.FromCity || "",
        toCountry: data.toCountry || data.ToCountry || "",
        toCity: data.toCity || data.ToCity || "",
        departureDate: data.departureDate || data.DepartureDate || "",
        returnDate: data.returnDate || data.ReturnDate || "",
        capacityKg: data.capacityKg || data.CapacityKg || 0,
        maxPackageWeightKg: data.maxPackageWeightKg || data.MaxPackageWeightKg || 0,
        notes: data.notes || data.Notes || "",
        status: data.status || data.Status || "Active",
        createdAt: data.createdAt || data.CreatedAt || data.createdAtUtc || data.CreatedAtUtc,
        updatedAt: data.updatedAt || data.UpdatedAt || data.updatedAtUtc || data.UpdatedAtUtc,
        receiveAddressId: data.receiveAddressId || data.ReceiveAddressId,
        receiveWindowStartUtc: data.receiveWindowStartUtc || data.ReceiveWindowStartUtc,
        receiveByDeadlineUtc: data.receiveByDeadlineUtc || data.ReceiveByDeadlineUtc,
        totalRequests: data.totalRequests || data.TotalRequests || 0,
        pendingRequests: data.pendingRequests || data.PendingRequests || 0,
        confirmedRequests: data.confirmedRequests || data.ConfirmedRequests || 0,
      }
    }
    // Case 2: Response with isSuccess and trip data
    else if (data.isSuccess && (data.trip || data.data)) {
      const tripData = data.trip || data.data
      console.log("✅ [getTripById] Found trip in 'isSuccess.trip/data':", tripData)
      trip = {
        id: tripData.id || tripData.$id || tripData.tripId || tripId,
        $id: tripData.$id,
        fromCountry: tripData.fromCountry || tripData.FromCountry || "",
        fromCity: tripData.fromCity || tripData.FromCity || "",
        toCountry: tripData.toCountry || tripData.ToCountry || "",
        toCity: tripData.toCity || tripData.ToCity || "",
        departureDate: tripData.departureDate || tripData.DepartureDate || "",
        returnDate: tripData.returnDate || tripData.ReturnDate || "",
        capacityKg: tripData.capacityKg || tripData.CapacityKg || 0,
        maxPackageWeightKg: tripData.maxPackageWeightKg || tripData.MaxPackageWeightKg || 0,
        notes: tripData.notes || tripData.Notes || "",
        status: tripData.status || tripData.Status || "Active",
        createdAt: tripData.createdAt || tripData.CreatedAt || tripData.createdAtUtc || tripData.CreatedAtUtc,
        updatedAt: tripData.updatedAt || tripData.UpdatedAt || tripData.updatedAtUtc || tripData.UpdatedAtUtc,
        receiveAddressId: tripData.receiveAddressId || tripData.ReceiveAddressId,
        receiveWindowStartUtc: tripData.receiveWindowStartUtc || tripData.ReceiveWindowStartUtc,
        receiveByDeadlineUtc: tripData.receiveByDeadlineUtc || tripData.ReceiveByDeadlineUtc,
        totalRequests: tripData.totalRequests || tripData.TotalRequests || 0,
        pendingRequests: tripData.pendingRequests || tripData.PendingRequests || 0,
        confirmedRequests: tripData.confirmedRequests || tripData.ConfirmedRequests || 0,
      }
    }

    if (!trip) {
      console.warn("⚠️ [getTripById] No trip found. Response structure:", {
        keys: Object.keys(data),
        data: data,
        hasId: 'id' in data || '$id' in data || 'tripId' in data,
        hasTrip: 'trip' in data,
        hasData: 'data' in data,
        isSuccess: data.isSuccess,
      })
    } else {
      console.log(`✅ [getTripById] Successfully fetched trip:`, trip)
    }

    return trip
  } catch (error: any) {
    console.error("❌ [getTripById] Error fetching trip:", {
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
 * Get available trips for buyers to browse travelers
 * Endpoint: GET /api/TravelerTrip/available
 */
export async function getAvailableTrips(params?: {
  fromCountry?: string
  toCountry?: string
  departureDate?: string
}): Promise<AvailableTrip[]> {
  try {
    console.log("🔍 [getAvailableTrips] Fetching available trips with params:", params)

    const response = await apiClient.get<GetAvailableTripsResponse | any>("/api/TravelerTrip/available", {
      params,
    })

    console.log("📦 [getAvailableTrips] Response:", response.data)

    if (!response.data) {
      console.warn("⚠️ [getAvailableTrips] Response data is null/undefined")
      return []
    }

    const data = response.data
    let trips: AvailableTrip[] = []

    const mapTraveler = (traveler: any): TravelerSummary | undefined => {
      if (!traveler) return undefined

      console.log('🔍 [mapTraveler] Input traveler object:', traveler)

      const mapped = {
        id: traveler.id || traveler.$id || traveler.userId,
        $id: traveler.$id,
        name: traveler.name || traveler.fullName || traveler.displayName || "",
        travelerFullName: traveler.travelerFullName,
        rating:
          traveler.rating !== undefined
            ? Number(traveler.rating)
            : traveler.averageRating !== undefined
              ? Number(traveler.averageRating)
              : undefined,
        avatarUrl: traveler.avatarUrl || traveler.profilePhotoUrl || traveler.photoUrl,
        travelerAvatarUrl: traveler.travelerAvatarUrl,
        languages:
          traveler.languages && Array.isArray(traveler.languages.$values)
            ? traveler.languages.$values
            : traveler.languages,
        totalReviews:
          traveler.totalReviews !== undefined ? traveler.totalReviews : traveler.reviewCount,
        completedTrips:
          traveler.completedTrips !== undefined ? traveler.completedTrips : traveler.completedTripCount,
        bio: traveler.bio || traveler.description,
      }

      console.log('✅ [mapTraveler] Mapped traveler object:', mapped)
      console.log('🖼️ [mapTraveler] Avatar URLs - travelerAvatarUrl:', mapped.travelerAvatarUrl, 'avatarUrl:', mapped.avatarUrl)

      return mapped
    }

    const fallbackId = () => Math.random().toString(36).substring(2, 11)

    const mapTrip = (trip: any): AvailableTrip => ({
      id: trip.id || trip.$id || trip.tripId || fallbackId(),
      $id: trip.$id,
      fromCountry: trip.fromCountry || trip.FromCountry || "",
      fromCity: trip.fromCity || trip.FromCity || "",
      toCountry: trip.toCountry || trip.ToCountry || "",
      toCity: trip.toCity || trip.ToCity || "",
      departureDate: trip.departureDate || trip.DepartureDate || "",
      returnDate: trip.returnDate || trip.ReturnDate || "",
      status: trip.status || trip.Status || trip.tripStatus || "",
      availableCapacityKg:
        trip.availableCapacityKg !== undefined ? trip.availableCapacityKg : trip.AvailableCapacityKg,
      maxPackageWeightKg:
        trip.maxPackageWeightKg !== undefined ? trip.maxPackageWeightKg : trip.MaxPackageWeightKg,
      compensationMin:
        trip.compensationMin !== undefined ? trip.compensationMin : trip.CompensationMin,
      compensationMax:
        trip.compensationMax !== undefined ? trip.compensationMax : trip.CompensationMax,
      notes: trip.notes || trip.Notes || "",
      traveler: trip.traveler || trip.Traveler
        ? mapTraveler(trip.traveler || trip.Traveler || trip.user || trip.User)
        : {
          // If no nested traveler object, pull fields directly from trip level
          id: trip.travelerId || trip.userId,
          name: trip.travelerName || trip.userName,
          travelerFullName: trip.travelerFullName,
          rating: trip.travelerRating,
          avatarUrl: trip.travelerAvatarUrl,
          travelerAvatarUrl: trip.travelerAvatarUrl,
          languages: trip.travelerLanguages,
          totalReviews: trip.travelerTotalReviews,
          completedTrips: trip.travelerCompletedTrips,
        }
    })

    if (Array.isArray(data)) {
      trips = data.map(mapTrip)
    } else if (data.availableTrips && Array.isArray(data.availableTrips)) {
      trips = data.availableTrips.map(mapTrip)
    } else if (data.trips && Array.isArray(data.trips)) {
      trips = data.trips.map(mapTrip)
    } else if (data.isSuccess && data.data?.$values && Array.isArray(data.data.$values)) {
      trips = data.data.$values.map(mapTrip)
    } else if (data.$values && Array.isArray(data.$values)) {
      trips = data.$values.map(mapTrip)
    } else if (data.data && Array.isArray(data.data)) {
      trips = data.data.map(mapTrip)
    }

    if (trips.length === 0) {
      console.warn("⚠️ [getAvailableTrips] No trips found. Response structure:", {
        keys: Object.keys(data),
        data,
      })
    } else {
      console.log(`✅ [getAvailableTrips] Successfully fetched ${trips.length} trips`)
    }

    return trips
  } catch (error: any) {
    console.error("❌ [getAvailableTrips] Error fetching available trips:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      fullError: error,
    })
    return []
  }
}

/**
 * Make an offer on a trip
 * Endpoint: POST /api/Offer/trip/{tripId}
 * 
        * @param tripId - The ID of the traveler's trip
      * @param payload - { requestId: string, price: number, message?: string }
      * requestId: The buyer's request/item that this offer is for
      * price: The price offered to deliver this request
      * message: Optional message to the buyer
      * @returns { success: boolean, message?: string } - success flag and error message if failed
        */
export async function makeOffer(
  tripId: string,
  payload: { requestId: string; price: number; message?: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`📤 [makeOffer] Sending offer for trip ${tripId}:`, payload)

    if (!payload.requestId) {
      const errorMsg = 'Missing request selection. Please select a request first.'
      console.error('❌ [makeOffer] Missing requestId in payload')
      return { success: false, message: errorMsg }
    }

    const body = {
      requestId: payload.requestId,
      price: payload.price,
      message: payload.message || undefined,
    }

    // strip undefined
    const requestBody: any = Object.entries(body).reduce((acc: any, [k, v]) => {
      if (v !== undefined && v !== null) acc[k] = v
      return acc
    }, {})

    console.log(`📤 [makeOffer] Request body:`, requestBody)

    const res = await apiClient.post(`/api/Offer/trip/${tripId}`, requestBody)

    console.log('✅ [makeOffer] Response:', { status: res.status, data: res.data })
    if (res.status === 200 || res.status === 201 || res.status === 204) {
      return { success: true }
    }
    if (res.data) {
      return { success: true }
    }
    return { success: false, message: 'Failed to send offer. Please try again.' }
  } catch (error: any) {
    console.error('❌ [makeOffer] Full error object:', error)
    console.error('❌ [makeOffer] Error response:', error?.response)
    console.error('❌ [makeOffer] Error response data:', error?.response?.data)

    // Extract user-friendly error message from API response
    let errorMessage = 'Failed to send offer. Please try again.'

    if (error?.response?.data) {
      const errorData = error.response.data
      console.log('📍 [makeOffer] Parsing error data, type:', typeof errorData)
      console.log('📍 [makeOffer] Error data keys:', Object.keys(errorData))
      console.log('📍 [makeOffer] Full error data:', JSON.stringify(errorData, null, 2))

      // Handle different error response formats

      // 1. Direct string response
      if (typeof errorData === 'string') {
        errorMessage = errorData
        console.log('📍 [makeOffer] Found as direct string')
      }
      // 2. Standard error object with message property
      else if (errorData.message && typeof errorData.message === 'string' && errorData.message.trim()) {
        errorMessage = errorData.message
        console.log('📍 [makeOffer] Found in message property')
      }
      // 3. Error with error property
      else if (errorData.error && typeof errorData.error === 'string' && errorData.error.trim()) {
        errorMessage = errorData.error
        console.log('📍 [makeOffer] Found in error property')
      }
      // 4. Problem details (RFC 7231) - title or detail
      else if (errorData.title && typeof errorData.title === 'string' && errorData.title.trim()) {
        errorMessage = errorData.title
        console.log('📍 [makeOffer] Found in title property')
      }
      else if (errorData.detail && typeof errorData.detail === 'string' && errorData.detail.trim()) {
        errorMessage = errorData.detail
        console.log('📍 [makeOffer] Found in detail property')
      }
      // 5. Errors object with validation errors
      else if (errorData.errors && typeof errorData.errors === 'object') {
        console.log('📍 [makeOffer] Has errors object, keys:', Object.keys(errorData.errors))
        const firstErrorKey = Object.keys(errorData.errors)[0]
        if (firstErrorKey) {
          const firstError = errorData.errors[firstErrorKey]
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0]
            console.log('📍 [makeOffer] Found in errors array')
          } else if (typeof firstError === 'string' && firstError.trim()) {
            errorMessage = firstError
            console.log('📍 [makeOffer] Found in errors string')
          }
        }
      }
      // 6. Check for any string property that might be the message
      else {
        for (const [key, value] of Object.entries(errorData)) {
          if (typeof value === 'string' && value.trim() && value.length > 5) {
            errorMessage = value
            console.log(`📍 [makeOffer] Found in property "${key}"`)
            break
          }
        }
      }
    }
    // Try message from error itself
    else if (error?.message && typeof error.message === 'string' && error.message.trim()) {
      errorMessage = error.message
      console.log('📍 [makeOffer] Found in error.message')
    }

    console.log('📍 [makeOffer] Final extracted error message:', errorMessage)
    return { success: false, message: errorMessage }
  }
}

/**
 * Update a trip
 * Endpoint: PUT /api/TravelerTrip/{tripId}
 */
export async function updateTrip(tripId: string, request: UpdateTripRequest): Promise<UpdateTripResponse> {
  try {
    console.log(`🚀 [updateTrip] Updating trip ${tripId} with data:`, request)
    console.log("📋 [updateTrip] Using field naming convention:", USE_PASCAL_CASE ? "PascalCase" : "camelCase")

    // Prepare request body with appropriate naming convention
    const requestBody = USE_PASCAL_CASE
      ? {
        // PascalCase (if API requires it)
        FromCountry: request.fromCountry,
        FromCity: request.fromCity,
        ToCountry: request.toCountry,
        ToCity: request.toCity,
        DepartureDate: request.departureDate,
        ReturnDate: request.returnDate,
        CapacityKg: request.capacityKg,
        MaxPackageWeightKg: request.maxPackageWeightKg,
        ReceiveAddressId: request.receiveAddressId,
        ReceiveWindowStartUtc: request.receiveWindowStartUtc,
        ReceiveByDeadlineUtc: request.receiveByDeadlineUtc,
        Notes: request.notes,
      }
      : {
        // camelCase (standard for JSON APIs)
        fromCountry: request.fromCountry,
        fromCity: request.fromCity,
        toCountry: request.toCountry,
        toCity: request.toCity,
        departureDate: request.departureDate,
        returnDate: request.returnDate,
        capacityKg: request.capacityKg,
        maxPackageWeightKg: request.maxPackageWeightKg,
        receiveAddressId: request.receiveAddressId,
        receiveWindowStartUtc: request.receiveWindowStartUtc,
        receiveByDeadlineUtc: request.receiveByDeadlineUtc,
        notes: request.notes,
      }

    console.log(`📤 [updateTrip] Sending PUT request to /api/TravelerTrip/${tripId}:`, {
      endpoint: `/api/TravelerTrip/${tripId}`,
      method: "PUT",
      fieldNaming: USE_PASCAL_CASE ? "PascalCase" : "camelCase",
      data: requestBody,
    })

    const response = await apiClient.put<UpdateTripResponse>(`/api/TravelerTrip/${tripId}`, requestBody)

    console.log("✅ [updateTrip] Trip update response:", response.data)    // Validate response structure
    if (!response.data) {
      throw new Error("Invalid response from server: no data received")
    }

    return response.data
  } catch (error: any) {
    console.error("❌ [updateTrip] Error updating trip:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      fullError: error,
    })

    const apiError = error as ApiError

    // Provide more detailed error message
    if (error?.response?.data) {
      const errorData = error.response.data

      // Check if it's a field naming issue (400 Bad Request often indicates this)
      if (error?.response?.status === 400) {
        console.warn("⚠️ [updateTrip] 400 Bad Request - This might indicate a field naming issue.")
        console.warn("⚠️ [updateTrip] Try setting USE_PASCAL_CASE to", !USE_PASCAL_CASE, "in trip-service.ts")
      }

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
        throw new Error(errorMessages || apiError.message || "Failed to update trip")
      }
    }

    throw new Error(apiError.message || "Failed to update trip. Please check your connection and try again.")
  }
}

/**
 * Delete a trip
 * Endpoint: DELETE /api/TravelerTrip/{tripId}
 */
export async function deleteTrip(tripId: string): Promise<DeleteTripResponse> {
  try {
    console.log(`🗑️ [deleteTrip] Deleting trip ${tripId}...`)

    const response = await apiClient.delete<DeleteTripResponse>(`/api/TravelerTrip/${tripId}`)

    console.log("✅ [deleteTrip] Trip deletion response:", response.data)

    // Validate response structure
    if (!response.data) {
      // Some APIs return 204 No Content on successful delete
      if (response.status === 204) {
        return {
          isSuccess: true,
          message: "Trip deleted successfully",
        }
      }
      throw new Error("Invalid response from server: no data received")
    }

    return response.data
  } catch (error: any) {
    console.error("❌ [deleteTrip] Error deleting trip:", {
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
        message: "Trip deleted successfully",
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
        throw new Error(errorMessages || apiError.message || "Failed to delete trip")
      }
    }

    throw new Error(apiError.message || "Failed to delete trip. Please check your connection and try again.")
  }
}

/**
 * Get offers for a specific trip (offers from buyers on a traveler's trip)
 * Endpoint: GET /api/Offer/trip/{tripId}
 */
export async function getOffersByTripId(tripId: string): Promise<Offer[]> {
  try {
    console.log(`🔍 [getOffersByTripId] Fetching offers for trip ${tripId}...`)

    const response = await apiClient.get<any>(`/api/Offer/trip/${tripId}`)

    console.log('📦 [getOffersByTripId] Raw API response:', {
      status: response.status,
      data: response.data,
    })

    let offers: Offer[] = []

    // Handle different response formats
    if (Array.isArray(response.data)) {
      console.log('✅ [getOffersByTripId] Response is an array')
      offers = response.data.map((offer: any) => mapOfferData(offer))
    } else if (response.data?.data) {
      console.log('✅ [getOffersByTripId] Response has data property')
      offers = Array.isArray(response.data.data)
        ? response.data.data.map((offer: any) => mapOfferData(offer))
        : Array.isArray((response.data.data as any)?.$values)
          ? (response.data.data as any).$values.map((offer: any) => mapOfferData(offer))
          : []
    } else if ((response.data as any)?.$values) {
      console.log('✅ [getOffersByTripId] Response has $values property')
      offers = Array.isArray((response.data as any).$values)
        ? (response.data as any).$values.map((offer: any) => mapOfferData(offer))
        : []
    } else if (response.data?.offers) {
      console.log('✅ [getOffersByTripId] Response has offers property')
      offers = Array.isArray(response.data.offers)
        ? response.data.offers.map((offer: any) => mapOfferData(offer))
        : []
    }

    console.log(`✅ [getOffersByTripId] Successfully fetched ${offers.length} offers`)
    return offers
  } catch (error: any) {
    console.error('❌ [getOffersByTripId] Error fetching offers:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    })
    return []
  }
}

/**
 * Get traveler's offers (offers sent to buyers)
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

