"use client"

import { BuyerLayout } from "@/components/buyer-layout"
import { Button } from "@/components/ui/button"
import { Card as UICard } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Wallet, Building2, CheckCircle2, Loader2, Package, Trash2, Edit2 } from "lucide-react"
import { useState, useEffect } from "react"
import { getMyRequests, getOffersByRequestId, getMatchIdByOfferId } from "@/lib/buyer-request-service"
import { addCard, type AddCardRequest, getCards, setDefaultCard, deleteCard, processPayment, type Card } from "@/lib/payment-service"
import { BuyerRequest } from "@/types/buyer-request"
import { toast } from "sonner"

export default function BuyerPaymentPage() {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [showCardsManager, setShowCardsManager] = useState(false)
  const [acceptedRequests, setAcceptedRequests] = useState<BuyerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const [cardData, setCardData] = useState<AddCardRequest>({
    cardNumber: "",
    cardHolderName: "",
    expirationMonth: "",
    expirationYear: "",
    cvv: "",
    isDefault: true
  })

  useEffect(() => {
    fetchAcceptedRequests()
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      setCardsLoading(true)
      const fetchedCards = await getCards()
      setCards(fetchedCards)
      console.log(`📇 Fetched ${fetchedCards.length} cards`)
    } catch (error) {
      console.error("Failed to fetch cards:", error)
      toast.error("Failed to load saved cards")
    } finally {
      setCardsLoading(false)
    }
  }

  const fetchAcceptedRequests = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching all requests to find accepted offers...")

      // 1. Fetch all requests
      const allRequests = await getMyRequests()
      console.log(`📦 Fetched ${allRequests.length} requests`)

      const requestsWithAcceptedOffers: BuyerRequest[] = []

      // 2. For each request, check if it has an accepted offer and get the match ID
      for (const request of allRequests) {
        try {
          // Check offers for this request
          const offers = await getOffersByRequestId(request.id)
          const acceptedOffer = offers.find(offer => offer.status === "Accepted" || offer.status === "accepted")

          if (acceptedOffer) {
            console.log(`✅ Request ${request.id} has accepted offer (Offer ID: ${acceptedOffer.id})`)

            // Try to get match ID - first check if it's already in the offer object
            let matchId = acceptedOffer.matchId

            // If not in offer object, fetch it from the API
            if (!matchId) {
              console.log(`🔍 Match ID not in offer object, fetching from API...`)
              matchId = (await getMatchIdByOfferId(acceptedOffer.id)) ?? undefined
            }

            if (matchId) {
              console.log(`✅ Found Match ID: ${matchId} for offer ${acceptedOffer.id}`)
              const requestWithOffer: BuyerRequest = {
                ...request,
                offerId: acceptedOffer.id,
                matchId: matchId // ✅ CORRECT: Using the actual match ID from API
              }
              requestsWithAcceptedOffers.push(requestWithOffer)
            } else {
              console.warn(`⚠️ Could not find match ID for offer ${acceptedOffer.id}`)
            }
          }
        } catch (err) {
          console.error(`Error checking offers for request ${request.id}:`, err)
        }
      }

      console.log(`🎉 Found ${requestsWithAcceptedOffers.length} requests with accepted offers and match IDs`)
      setAcceptedRequests(requestsWithAcceptedOffers)

      // Set the first item as selected by default
      if (requestsWithAcceptedOffers.length > 0) {
        setSelectedItemId(requestsWithAcceptedOffers[0].id)
        console.log(`✨ Default selected item: ${requestsWithAcceptedOffers[0].title}`)
      }
    } catch (error) {
      console.error("Failed to fetch accepted requests:", error)
      toast.error("Failed to load item details")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target

    // Map input IDs to state keys
    const keyMap: Record<string, keyof AddCardRequest> = {
      "card-number": "cardNumber",
      "card-holder": "cardHolderName",
      "expiry-year": "expirationYear",
      "cvv": "cvv"
    }

    if (keyMap[id]) {
      let formattedValue = value;

      // Input formatting logic
      if (id === "card-number") {
        // Remove non-digits
        const digits = value.replace(/\D/g, '');
        // Limit to 16 digits
        const truncated = digits.slice(0, 16);
        // Add spaces every 4 digits
        formattedValue = truncated.replace(/(\d{4})(?=\d)/g, '$1 ');
      } else if (id === "expiry-year") {
        // Limit to 4 digits, allow only numbers
        formattedValue = value.replace(/\D/g, '').slice(0, 4);
      } else if (id === "cvv") {
        // Limit to 4 digits, allow only numbers
        formattedValue = value.replace(/\D/g, '').slice(0, 4);
      }

      setCardData(prev => ({ ...prev, [keyMap[id]]: formattedValue }))
    }
  }

  const handleMonthChange = (value: string) => {
    setCardData(prev => ({ ...prev, expirationMonth: value }))
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      setProcessing(true)
      const result = await deleteCard(cardId)

      if (result.success) {
        toast.success("Card deleted successfully")
        await fetchCards()
      } else {
        toast.error(result.message || "Failed to delete card")
      }
    } catch (error) {
      toast.error("An error occurred while deleting the card")
    } finally {
      setProcessing(false)
    }
  }

  const handleSetDefaultCard = async (cardId: string) => {
    try {
      setProcessing(true)
      const result = await setDefaultCard(cardId)

      if (result.success) {
        toast.success("Default card updated")
        await fetchCards()
      } else {
        toast.error(result.message || "Failed to set default card")
      }
    } catch (error) {
      toast.error("An error occurred while updating default card")
    } finally {
      setProcessing(false)
    }
  }

  const handleAddCardSuccess = async () => {
    setCardData({
      cardNumber: "",
      cardHolderName: "",
      expirationMonth: "",
      expirationYear: "",
      cvv: "",
      isDefault: true
    })
    setIsAddingCard(false)
    setEditingCardId(null)
    await fetchCards()
  }

  const handleEditCard = (card: Card) => {
    setEditingCardId(card.id)
    setCardData({
      cardNumber: card.cardNumber,
      cardHolderName: card.cardHolderName,
      expirationMonth: card.expirationMonth,
      expirationYear: card.expirationYear,
      cvv: "",
      isDefault: card.isDefault
    })
    setIsAddingCard(true)
    setShowCardsManager(false)
  }

  const handleConfirmPayment = async () => {
    if (cards.length === 0) {
      toast.error("Please add a card first")
      return
    }

    if (!selectedItemId) {
      toast.error("Please select an item to pay for")
      return
    }

    const selectedRequest = acceptedRequests.find(r => r.id === selectedItemId)
    if (!selectedRequest) {
      toast.error("Selected item not found")
      return
    }

    if (!selectedRequest.matchId) {
      toast.error("Match ID not found for this item")
      return
    }

    try {
      setProcessing(true)

      // Get the default card or first card
      const defaultCard = cards.find(c => c.isDefault) || cards[0]
      if (!defaultCard) {
        toast.error("No payment method available")
        return
      }

      // Calculate amount for selected item only
      const itemAmount = selectedRequest.itemValue || 0
      const totalAmount = itemAmount * 1.05 // Include 5% service fee

      const matchId = selectedRequest.matchId

      console.log("💳 Processing payment...")
      console.log(`📦 Item: ${selectedRequest.title}`)
      console.log(`💰 Item Amount: $${itemAmount}`)
      console.log(`💵 Total with Fee: $${totalAmount.toFixed(2)}`)
      console.log(`✅ Match ID: ${matchId}`)
      console.log(`🎫 Card ID: ${defaultCard.id}`)

      const result = await processPayment(
        matchId,
        totalAmount,
        defaultCard.id,
        `Payment for ${selectedRequest.title}`
      )

      if (result.success) {
        toast.success(
          `Payment has been successfully made! You can now proceed to chat with your traveler. A confirmation email has been sent to your email address.`,
          {
            duration: 6000,
            style: {
              background: '#10b981',
              color: 'white',
              border: '1px solid #059669',
            },
          }
        )
        // You can redirect or show success state here
        // router.push("/buyer/escrow") or similar
      } else {
        toast.error(result.message || "Payment failed")
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error("An error occurred while processing payment")
    } finally {
      setProcessing(false)
    }
  }

  const validatePaymentForm = (): boolean => {
    // 1. Card Number: Must be 16 digits (ignoring spaces)
    const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanCardNumber)) {
      toast.error("Card number must be 16 digits");
      return false;
    }

    // 2. Card Holder Name: Must not be empty
    if (!cardData.cardHolderName.trim()) {
      toast.error("Please enter the card holder's name");
      return false;
    }

    // 3. Expiry Month: 01-12
    const month = parseInt(cardData.expirationMonth, 10);
    if (!/^\d{2}$/.test(cardData.expirationMonth) || month < 1 || month > 12) {
      toast.error("Invalid expiry month (01-12)");
      return false;
    }

    // 4. Expiry Year: YYYY, not in the past
    const year = parseInt(cardData.expirationYear, 10);
    const currentYear = new Date().getFullYear();
    if (!/^\d{4}$/.test(cardData.expirationYear) || year < currentYear) {
      toast.error("Invalid expiry year (must be current or future year)");
      return false;
    }

    // Check for expired card (if current year, month must be >= current month)
    if (year === currentYear) {
      const currentMonth = new Date().getMonth() + 1;
      if (month < currentMonth) {
        toast.error("Card has expired");
        return false;
      }
    }

    // 5. CVV: 3 or 4 digits
    if (!/^\d{3,4}$/.test(cardData.cvv)) {
      toast.error("CVV must be 3 or 4 digits");
      return false;
    }

    return true;
  }

  const handlePayment = async () => {
    if (!validatePaymentForm()) {
      return;
    }

    try {
      setProcessing(true)
      // Clean card number before sending
      const dataToSend = {
        ...cardData,
        cardNumber: cardData.cardNumber.replace(/\s/g, '')
      };

      const result = await addCard(dataToSend)

      if (result.success) {
        toast.success("Payment method added successfully!")
        await handleAddCardSuccess()
      } else {
        toast.error(result.message || "Payment failed")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <BuyerLayout>
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-foreground">Payment & Escrow</h1>

        {/* Payment Summary */}
        <UICard className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Payment Summary</h2>
          <p className="text-sm text-muted-foreground mb-6">Review your transaction details before proceeding.</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Item Details */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Item Details</h3>

              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading items...
                </div>
              ) : acceptedRequests.length > 0 ? (
                <div className="space-y-4">
                  {/* Item Selector Dropdown */}
                  <div>
                    <Label htmlFor="item-selector" className="text-sm font-semibold text-foreground mb-2">
                      Select Item to Pay For
                    </Label>
                    <Select value={selectedItemId || ""} onValueChange={setSelectedItemId}>
                      <SelectTrigger id="item-selector" className="mt-2">
                        <SelectValue placeholder="Choose an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {acceptedRequests.map((request) => (
                          <SelectItem key={request.id} value={request.id}>
                            <div className="flex items-center gap-2">
                              <span>{request.title}</span>
                              <span className="text-xs text-muted-foreground">→ {request.toCity}, {request.toCountry}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Display Selected Item Details */}
                  {selectedItemId && acceptedRequests.find(r => r.id === selectedItemId) && (
                    <div className="border rounded-lg p-4 bg-muted border-border">
                      {(() => {
                        const selectedItem = acceptedRequests.find(r => r.id === selectedItemId)!
                        console.log(`📦 Selected item: ${selectedItem.title}, Match ID: ${selectedItem.matchId}`)
                        return (
                          <div className="space-y-3">
                            <div className="flex gap-4">
                              {selectedItem.photos && selectedItem.photos.length > 0 ? (
                                <img
                                  src={selectedItem.photos[0]}
                                  alt={selectedItem.title}
                                  className="w-20 h-20 object-cover rounded border border-border"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-muted rounded border border-border flex items-center justify-center">
                                  <Package className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-bold text-foreground">{selectedItem.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{selectedItem.category}</p>
                                <p className="text-xs text-muted-foreground">
                                  {selectedItem.fromCity}, {selectedItem.fromCountry} → {selectedItem.toCity}, {selectedItem.toCountry}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                              <div>
                                <p className="text-xs text-muted-foreground">Value</p>
                                <p className="text-lg font-bold text-[#0088cc]">${selectedItem.itemValue}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Weight</p>
                                <p className="text-lg font-bold text-foreground">{selectedItem.estimatedTotalWeightKg}kg</p>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Other items (non-selected) shown in compact view */}
                  {acceptedRequests.length > 1 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground font-semibold mb-2">OTHER ITEMS</p>
                      <div className="space-y-2">
                        {acceptedRequests
                          .filter(r => r.id !== selectedItemId)
                          .map((request) => (
                            <div key={request.id} className="flex items-center gap-3 p-2 bg-muted rounded border border-border cursor-pointer hover:bg-card" onClick={() => setSelectedItemId(request.id)}>
                              {request.photos && request.photos.length > 0 ? (
                                <img
                                  src={request.photos[0]}
                                  alt={request.title}
                                  className="w-12 h-12 object-cover rounded border border-border"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded border border-border flex items-center justify-center">
                                  <Package className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{request.title}</p>
                                <p className="text-xs text-muted-foreground">${request.itemValue}</p>
                              </div>
                              <div className="text-xs text-muted-foreground">→ {request.toCity}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground italic">No accepted requests found pending payment.</div>
              )}
            </div>

            {/* Transaction Overview */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Transaction Overview</h3>
              <div className="space-y-3">
                {(() => {
                  const selectedItem = acceptedRequests.find(r => r.id === selectedItemId)
                  const itemAmount = selectedItem?.itemValue || 0
                  const serviceFee = itemAmount * 0.05
                  const totalAmount = itemAmount + serviceFee

                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Item Subtotal:</span>
                        <span className="font-semibold text-[#0088cc]">${itemAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Fee (5%):</span>
                        <span className="font-medium text-foreground">${serviceFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-border pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-foreground">Total to Pay:</span>
                          <span className="font-bold text-[#0088cc] text-lg">${totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </UICard>

        {/* Payment Method */}
        <UICard className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Payment Method</h2>
          <p className="text-sm text-muted-foreground mb-6">Add a credit or debit card to proceed.</p>

          {showCardsManager && cards.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-foreground">Your Saved Cards</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCardsManager(false)}
                  className="text-gray-600 border-gray-300"
                >
                  Back
                </Button>
              </div>

              {cardsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading cards...
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => {
                    const lastFourDigits = card.cardNumber?.slice(-4) || "****"
                    return (
                      <div key={card.id} className="border rounded-lg p-4 bg-muted hover:bg-card transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white">
                              <CreditCard className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-foreground text-lg">
                                  •••• •••• •••• {lastFourDigits}
                                </p>
                                {card.isDefault && (
                                  <span className="inline-flex items-center gap-1 bg-muted text-[#0088cc] px-2 py-1 rounded text-xs font-semibold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {card.cardHolderName || "Unknown"} • Expires {card.expirationMonth || "?"}/{card.expirationYear || "?"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCard(card)}
                              disabled={processing}
                              className="border-border text-foreground hover:bg-muted"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            {!card.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefaultCard(card.id)}
                                disabled={processing}
                                className="border-border text-muted-foreground hover:bg-muted"
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCard(card.id)}
                              disabled={processing}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-[#0088cc] text-[#0088cc] hover:bg-muted"
                onClick={() => setIsAddingCard(true)}
              >
                Add Another Card
              </Button>
            </div>
          ) : !isAddingCard ? (
            <>
              {cards.length === 0 ? (
                <div className="bg-muted rounded-lg p-8 text-center mb-6 border border-dashed border-border">
                  <div className="w-16 h-16 mx-auto mb-4 bg-card rounded-full flex items-center justify-center shadow-sm">
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">No card linked</h3>
                  <p className="text-sm text-muted-foreground mb-4">You do not have any credit or debit card linked to your account.</p>
                  <Button onClick={() => setIsAddingCard(true)} variant="outline" className="border-[#0088cc] text-[#0088cc] hover:bg-muted">
                    Enter Card Details
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-border text-muted-foreground hover:bg-muted"
                  onClick={() => setShowCardsManager(true)}
                >
                  View Saved Cards ({cards.length})
                </Button>
              )}
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-foreground">
                  {editingCardId ? "Edit Card Details" : "Enter Card Details"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingCard(false)
                    setEditingCardId(null)
                    setCardData({
                      cardNumber: "",
                      cardHolderName: "",
                      expirationMonth: "",
                      expirationYear: "",
                      cvv: "",
                      isDefault: true
                    })
                  }}
                  className="text-muted-foreground h-8"
                >
                  Cancel
                </Button>
              </div>

              <div>
                <Label htmlFor="card-holder">Card Holder Name</Label>
                <Input
                  id="card-holder"
                  placeholder="John Doe"
                  className="mt-1"
                  value={cardData.cardHolderName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="XXXX XXXX XXXX XXXX"
                  className="mt-1"
                  value={cardData.cardNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expiry-month">Exp. Month</Label>
                  <Select value={cardData.expirationMonth} onValueChange={handleMonthChange}>
                    <SelectTrigger id="expiry-month" className="mt-1">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = String(i + 1).padStart(2, '0');
                        return (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expiry-year">Exp. Year</Label>
                  <Input
                    id="expiry-year"
                    placeholder="YYYY"
                    className="mt-1"
                    value={cardData.expirationYear}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="CVC"
                    className="mt-1"
                    value={cardData.cvv}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-[#0088cc]" />
                <span>Your payment information is securely encrypted.</span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setIsAddingCard(false)
                    setEditingCardId(null)
                    setCardData({
                      cardNumber: "",
                      cardHolderName: "",
                      expirationMonth: "",
                      expirationYear: "",
                      cvv: "",
                      isDefault: true
                    })
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#0088cc] hover:bg-[#0077b3] text-white"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {editingCardId ? "Updating..." : "Adding..."}</>
                  ) : (
                    editingCardId ? "Update Card" : "Add Card"
                  )}
                </Button>
              </div>
            </div>
          )}
        </UICard>

        {/* Understanding Escrow */}
        <UICard className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Understanding Escrow</h2>
          <p className="text-sm text-gray-600 mb-6">How GlobalLink secures your transaction.</p>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#0088cc]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Funds Held Safely</h3>
                <p className="text-sm text-gray-600">
                  Your payment is held in a secure escrow account and is only released to the traveler once you confirm
                  successful delivery of your item.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#0088cc]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Dispute Resolution</h3>
                <p className="text-sm text-gray-600">
                  In case of any issues with your delivery, our dispute resolution team will mediate to ensure a fair
                  outcome, protecting both parties.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#0088cc]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Peace of Mind</h3>
                <p className="text-sm text-gray-600">
                  GlobalLink's escrow service ensures that both buyers and travelers can transact with confidence,
                  knowing their interests are protected.
                </p>
              </div>
            </div>
          </div>
        </UICard>

        {/* Confirm Button */}
        <div className="flex justify-end">
          <Button
            className="bg-[#0088cc] hover:bg-[#0077b3] text-white px-8"
            size="lg"
            onClick={handleConfirmPayment}
            disabled={processing || loading || acceptedRequests.length === 0 || cards.length === 0}
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : cards.length === 0 ? (
              "Add Payment Method First"
            ) : (
              "Confirm Payment & Proceed to Escrow"
            )}
          </Button>
        </div>
      </div>
    </BuyerLayout>
  )
}
