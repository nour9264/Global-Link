// Shared order tracking utilities (buyer + traveler)
// Centralizes stage definitions, status normalization, and mapping logic.

import { Package, CreditCard, Plane, Truck, Home } from "lucide-react"

// Canonical ordered list of delivery lifecycle stages.
// Icons chosen for consistency across buyer/traveler views.
export const ORDER_STAGES = [
  { id: 0, key: "REQUEST_POSTED", name: "Request Posted", icon: Package },
  { id: 1, key: "OFFER_RECEIVED", name: "Offer Received", icon: Package },
  { id: 2, key: "PAYMENT_SUCCESSFUL", name: "Payment Successful", icon: CreditCard },
  { id: 3, key: "ITEM_WITH_TRAVELER", name: "Item With Traveler", icon: Truck },
  { id: 4, key: "PLANE_ARRIVED", name: "Plane Arrived", icon: Plane },
  { id: 5, key: "ITEM_DELIVERED", name: "Item Delivered", icon: Home },
] as const

export type OrderStageKey = typeof ORDER_STAGES[number]["key"]
export type OrderStageName = typeof ORDER_STAGES[number]["name"]

// Mapping of various backend/raw status strings to canonical stage name.
// Extend this if backend uses alternative spellings.
const STATUS_ALIASES: Record<string, OrderStageName> = {
  "Request Posted": "Request Posted",
  "Offer Received": "Offer Received",
  "Payment Successful": "Payment Successful",
  "Item With Traveler": "Item With Traveler",
  "Plane Arrived": "Plane Arrived",
  "Item Delivered": "Item Delivered",
  // Potential alternative raw values (examples):
  "ItemWithTraveler": "Item With Traveler",
  "PlaneArrived": "Plane Arrived",
  "Delivered": "Item Delivered",
}

// Normalize any raw status string to a canonical stage name.
export function normalizeStatus(raw?: string | null): OrderStageName | null {
  if (!raw) return null
  const direct = STATUS_ALIASES[raw]
  if (direct) return direct
  // Try loose matching (case-insensitive, spaces removed)
  const cleaned = raw.replace(/[_\s-]+/g, "").toLowerCase()
  const found = Object.entries(STATUS_ALIASES).find(([k]) => k.replace(/[_\s-]+/g, "").toLowerCase() === cleaned)
  return found ? found[1] : null
}

// Precompute name→index map for O(1) lookups.
const NAME_TO_INDEX: Record<OrderStageName, number> = ORDER_STAGES.reduce((acc, stage, idx) => {
  acc[stage.name] = idx
  return acc
}, {} as Record<OrderStageName, number>)

// Get numeric index for a raw status string.
export function getStageIndex(rawStatus?: string | null): number {
  const normalized = normalizeStatus(rawStatus)
  if (!normalized) return 0 // default to first stage when unknown
  return NAME_TO_INDEX[normalized] ?? 0
}

// Compute progress percent given a current stage index.
export function computeProgressPercent(stageIndex: number): number {
  if (stageIndex <= 0) return 0
  const lastIndex = ORDER_STAGES.length - 1
  return Math.min(100, (stageIndex / lastIndex) * 100)
}

// Determine adaptive polling interval based on stage index.
// Earlier stages refresh faster; later stages slower.
export function getPollingInterval(stageIndex: number): number {
  if (stageIndex < 2) return 15_000   // Every 15s until payment
  if (stageIndex < 4) return 30_000   // Every 30s while in transit
  if (stageIndex < 5) return 45_000   // Every 45s near arrival
  return 60_000                       // Delivered: occasional refresh
}

// Simple DEBUG flag to silence logs in production easily.
export const ORDER_TRACKING_DEBUG = false

export function debugLog(...args: any[]) {
  if (ORDER_TRACKING_DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[order-tracking]", ...args)
  }
}