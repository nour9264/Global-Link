// Offer-related TypeScript types

export interface Offer {
  id: string
  $id?: string
  requestId?: string
  tripId?: string
  travelerTripId?: string // New field from backend
  matchId?: string // Match ID when offer is accepted
  price: number
  message?: string
  status?: string // e.g., "Pending", "Accepted", "Rejected", "Delivered"
  travelerId?: string
  buyerId?: string
  travelerName?: string
  travelerRating?: number
  buyerName?: string // New field from backend
  requestTitle?: string
  request?: any // Nested request object from API with full details
  trip?: any // Nested trip object from API
  createdAt?: string
  updatedAt?: string
}

export interface GetOffersResponse {
  $id?: string
  isSuccess?: boolean
  message?: string
  offers?: Offer[]
  data?: {
    $id?: string
    $values?: Offer[]
  }
}

export interface GetOffersByRequestResponse {
  $id?: string
  isSuccess?: boolean
  message?: string
  offers?: Offer[]
  data?: {
    $id?: string
    $values?: Offer[]
  }
}
