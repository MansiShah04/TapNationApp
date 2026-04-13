/**
 * Hook managing the offer stream and active game state.
 */
import { useCallback, useEffect, useState } from "react";
import { streamOffers } from "../services/offerStream";
import type { Offer } from "../types/offer";

export function useOffers(walletConnected: boolean) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);

  // Start streaming when wallet connects
  useEffect(() => {
    if (!walletConnected) return;

    let cancelled = false;
    setIsStreaming(true);
    setOffers([]);

    streamOffers(
      (offer) => {
        if (!cancelled) setOffers((prev) => [...prev, offer]);
      },
      () => {
        if (!cancelled) setIsStreaming(false);
      },
    );

    return () => { cancelled = true; };
  }, [walletConnected]);

  const playOffer = useCallback((offer: Offer) => {
    setActiveOffer(offer);
  }, []);

  const clearActiveOffer = useCallback(() => {
    setActiveOffer(null);
  }, []);

  return { offers, isStreaming, activeOffer, playOffer, clearActiveOffer };
}
