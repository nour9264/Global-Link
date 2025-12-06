import apiClient from "./api-client";

export async function acceptOffer(offerId: string) {
  console.log(`✅ [acceptOffer] Accepting offer ${offerId}...`);
  const response = await apiClient.post(`/api/Offer/${offerId}/accept`);
  console.log(`✅ [acceptOffer] Response:`, response.data);
  return response.data;
}

export async function rejectOffer(offerId: string) {
  const response = await apiClient.post(`/api/Offer/${offerId}/reject`);
  return response.data;
}
