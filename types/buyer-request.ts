// Buyer Request-related TypeScript types

export interface BuyerRequest {
  id: string
  $id?: string
  title: string
  description?: string
  category?: string
  itemValue?: number
  fromCountry: string
  fromCity: string
  toCountry: string
  toCity: string
  targetArrivalDate?: string // ISO 8601 datetime string
  budgetMax?: number
  urgency?: string
  totalPackages?: number
  estimatedTotalWeightKg?: number
  isFragile?: boolean
  batteryType?: string
  status?: string // e.g., "Pending", "Active", "Completed", "Cancelled"
  createdAt?: string
  updatedAt?: string
  photos?: string[] // URLs to photos
  offerId?: string // ID of the accepted offer/match for this request
  matchId?: string // Alternative name for offerId
}

export interface GetMyRequestsResponse {
  $id?: string
  isSuccess?: boolean
  message?: string
  requests?: BuyerRequest[]
  data?: {
    $id?: string
    $values?: BuyerRequest[]
  }
}

export interface GetRequestResponse {
  $id?: string
  isSuccess?: boolean
  message?: string
  request?: BuyerRequest
  data?: BuyerRequest
}

export interface DeleteRequestResponse {
  $id?: string
  isSuccess: boolean
  message: string
  errors?: any
}

