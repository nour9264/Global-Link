"use client";


import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getOfferById } from "@/lib/offer-service";

export default function OfferDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId");
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!offerId) return;
    setLoading(true);
    getOfferById(offerId)
      .then((data) => {
        setOffer(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
      })
      .finally(() => setLoading(false));
  }, [offerId]);

  return (
    <div className="max-w-xl mx-auto py-10">
      <button className="mb-4 text-blue-600" onClick={() => router.back()}>
        ← Back
      </button>
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading offer details...</span>
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : offer ? (
          <div className="space-y-3">
            <h2 className="text-xl font-bold mb-2">Offer Details</h2>
            <div>
              <span className="font-medium">Offer ID:</span> {offer.id}
            </div>
            <div>
              <span className="font-medium">Amount:</span> ${offer.price}
            </div>
            <div>
              <span className="font-medium">Status:</span> {offer.status}
            </div>
            <div>
              <span className="font-medium">Message:</span> {offer.message}
            </div>
            <div>
              <span className="font-medium">Created At:</span> {offer.createdAt ? new Date(offer.createdAt).toLocaleString() : "-"}
            </div>
            {/* Add more fields as needed */}
          </div>
        ) : (
          <div>No offer found.</div>
        )}
      </Card>
    </div>
  );
}
