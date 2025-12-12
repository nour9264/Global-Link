// Trip-related TypeScript types

export interface CreateTripRequest {
  fromCountry: string
  fromCity: string
  toCountry: string
  toCity: string
  departureDate: string // ISO 8601 datetime string
  returnDate: string // ISO 8601 datetime string (required)
  capacityKg: number
  notes: string // Required
  maxPackageWeightKg: number
  receiveAddressId: string // UUID
  receiveWindowStartUtc: string // ISO 8601 datetime string
  receiveByDeadlineUtc: string // ISO 8601 datetime string
}

export interface UpdateTripRequest extends CreateTripRequest {
  // Same structure as CreateTripRequest
}

export interface CreateTripResponse {
  $id?: string
  isSuccess: boolean
  message: string
  tripId?: string
  data?: any
  errors?: any
}

export interface UpdateTripResponse {
  $id?: string
  isSuccess: boolean
  message: string
  data?: any
  errors?: any
}

export interface DeleteTripResponse {
  $id?: string
  isSuccess: boolean
  message: string
  errors?: any
}

export interface TravelerAddress {
  id: string
  address: string
  city: string
  country: string
  postalCode?: string
  isDefault?: boolean
  // Add other address fields as needed
}

export interface TravelerAddressesResponse {
  $id?: string
  isSuccess: boolean
  message: string
  addresses?: TravelerAddress[]
  data?: {
    $id?: string
    $values?: TravelerAddress[]
  }
}

// Trip data structure
export interface Trip {
  id: string
  $id?: string
  fromCountry: string
  fromCity: string
  toCountry: string
  toCity: string
  departureDate: string // ISO 8601 datetime string
  returnDate: string // ISO 8601 datetime string
  capacityKg: number
  maxPackageWeightKg: number
  notes: string
  status?: string // e.g., "Active", "Completed", "Cancelled"
  createdAt?: string
  updatedAt?: string
  receiveAddressId?: string
  receiveWindowStartUtc?: string
  receiveByDeadlineUtc?: string
  // Request statistics (if available from API)
  totalRequests?: number
  pendingRequests?: number
  confirmedRequests?: number
}

export interface GetMyTripsResponse {
  $id?: string
  isSuccess: boolean
  message: string
  trips?: Trip[]
  data?: {
    $id?: string
    $values?: Trip[]
  }
}

export interface TravelerSummary {
  id?: string
  $id?: string
  name?: string
  travelerFullName?: string  // API returns this field name
  rating?: number
  avatarUrl?: string
  travelerAvatarUrl?: string  // API returns this field name
  languages?: string[]
  totalReviews?: number
  completedTrips?: number
  bio?: string
}

export interface AvailableTrip {
  id: string
  $id?: string
  fromCountry: string
  fromCity?: string
  toCountry: string
  toCity?: string
  departureDate: string
  returnDate?: string
  status?: string
  availableCapacityKg?: number
  maxPackageWeightKg?: number
  compensationMin?: number
  compensationMax?: number
  notes?: string
  traveler?: TravelerSummary
}

export interface GetAvailableTripsResponse {
  $id?: string
  isSuccess?: boolean
  data?: {
    $id?: string
    $values?: AvailableTrip[]
  }
  trips?: AvailableTrip[]
  availableTrips?: AvailableTrip[]
}

