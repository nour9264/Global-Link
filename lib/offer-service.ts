import apiClient from "./api-client";
import type { Offer } from "@/types/offer";

export async function getOfferById(offerId: string): Promise<Offer> {
  const response = await apiClient.get(`/api/Offer/${offerId}`);
  // If the API returns the offer directly, just return response.data
  // If it wraps in a property (e.g. data, $values), adjust accordingly
  return response.data;
}
