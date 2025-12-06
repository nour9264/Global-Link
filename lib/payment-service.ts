import apiClient from "./api-client"

export interface AddCardRequest {
    cardNumber: string
    cardHolderName: string
    expirationMonth: string
    expirationYear: string
    cvv: string
    isDefault: boolean
}

export interface Card {
    id: string
    cardNumber: string
    cardHolderName: string
    expirationMonth: string
    expirationYear: string
    isDefault: boolean
}

export async function addCard(cardData: AddCardRequest): Promise<{ success: boolean; message?: string }> {
    try {
        console.log("💳 [addCard] Adding new card...", { ...cardData, cardNumber: "****" + cardData.cardNumber.slice(-4), cvv: "***" })

        const response = await apiClient.post("/api/Payment/cards", cardData)

        console.log("✅ [addCard] Response:", response.data)

        if (response.status >= 200 && response.status < 300) {
            return { success: true, message: "Card added successfully" }
        }

        return { success: false, message: "Failed to add card" }
    } catch (error: any) {
        console.error("❌ [addCard] Error adding card:", error)
        return {
            success: false,
            message: error.response?.data?.message || error.message || "Failed to add card"
        }
    }
}

export async function getCards(): Promise<Card[]> {
    try {
        console.log("💳 [getCards] Fetching user cards...")
        const response = await apiClient.get("/api/Payment/cards")
        console.log("✅ [getCards] Response:", response.data)
        
        let cardsData: any[] = []
        
        // Handle different response structures
        if (Array.isArray(response.data)) {
            cardsData = response.data
        } else if (response.data?.data) {
            cardsData = Array.isArray(response.data.data) ? response.data.data : []
        } else if (response.data?.$values) {
            cardsData = Array.isArray(response.data.$values) ? response.data.$values : []
        }
        
        // Map and normalize card data to ensure all required fields exist
        return cardsData.map(card => ({
            id: card.id || card.cardId || "",
            cardNumber: card.cardNumber || card.last4 || "****",
            cardHolderName: card.cardHolderName || card.holderName || "Unknown",
            expirationMonth: card.expirationMonth || card.expMonth || "",
            expirationYear: card.expirationYear || card.expYear || "",
            isDefault: card.isDefault || false
        }))
    } catch (error: any) {
        console.error("❌ [getCards] Error fetching cards:", error)
        return []
    }
}

export async function setDefaultCard(cardId: string): Promise<{ success: boolean; message?: string }> {
    try {
        console.log("💳 [setDefaultCard] Setting card as default...", cardId)
        
        const response = await apiClient.put(`/api/Payment/cards/${cardId}`, {
            isDefault: true
        })

        console.log("✅ [setDefaultCard] Response:", response.data)

        if (response.status >= 200 && response.status < 300) {
            return { success: true, message: "Card set as default" }
        }

        return { success: false, message: "Failed to set default card" }
    } catch (error: any) {
        console.error("❌ [setDefaultCard] Error:", error)
        return {
            success: false,
            message: error.response?.data?.message || error.message || "Failed to set default card"
        }
    }
}

export async function deleteCard(cardId: string): Promise<{ success: boolean; message?: string }> {
    try {
        console.log("💳 [deleteCard] Deleting card...", cardId)
        
        const response = await apiClient.delete(`/api/Payment/cards/${cardId}`)

        console.log("✅ [deleteCard] Response:", response.data)

        if (response.status >= 200 && response.status < 300) {
            return { success: true, message: "Card deleted successfully" }
        }

        return { success: false, message: "Failed to delete card" }
    } catch (error: any) {
        console.error("❌ [deleteCard] Error:", error)
        return {
            success: false,
            message: error.response?.data?.message || error.message || "Failed to delete card"
        }
    }
}

export async function processPayment(matchId: string, agreedPrice: number, paymentMethodId: string, notes?: string): Promise<{ success: boolean; message?: string }> {
    try {
        console.log("💳 [processPayment] Processing payment for match...", { matchId, agreedPrice, paymentMethodId })
        
        const response = await apiClient.post(`/api/Payment/matches/${matchId}/pay`, {
            agreedPrice,
            paymentMethodId,
            notes
        })

        console.log("✅ [processPayment] Response:", response.data)

        if (response.status >= 200 && response.status < 300) {
            return { success: true, message: "Payment processed successfully" }
        }

        return { success: false, message: "Failed to process payment" }
    } catch (error: any) {
        console.error("❌ [processPayment] Error:", error)
        return {
            success: false,
            message: error.response?.data?.message || error.message || "Failed to process payment"
        }
    }
}
