// Utility to map timeline status to Lucide icons
import { Package, CreditCard, Plane, Truck, Home, LucideIcon } from "lucide-react"

export function getIconForStatus(status: string): LucideIcon {
    const statusLower = status.toLowerCase()

    if (statusLower.includes("created") || statusLower.includes("offer")) {
        return Package
    }
    if (statusLower.includes("paid") || statusLower.includes("payment")) {
        return CreditCard
    }
    if (statusLower.includes("itemreceived") || statusLower.includes("item received") || statusLower.includes("traveler")) {
        return Truck
    }
    if (statusLower.includes("planearrived") || statusLower.includes("plane arrived") || statusLower.includes("plane")) {
        return Plane
    }
    if (statusLower.includes("delivered")) {
        return Home
    }

    // Default fallback
    return Package
}
