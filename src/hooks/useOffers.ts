/**
 * OffersContext + useOffers hook.
 *
 * Maintains exactly 3 unique offers at any time. On win, the played offer
 * is removed, the remaining two are shuffled, and a new unique offer is
 * appended — so the user always sees 3 different games.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { streamOffers, pickReplacementOffer } from "../services/offerStream";
import type { Offer } from "../types/offer";

interface OffersContextValue {
  offers: Offer[];
  isStreaming: boolean;
  removeAndReplace: (offerId: string) => void;
}

export const OffersContext = createContext<OffersContextValue | null>(null);

export function useOffers(): OffersContextValue {
  const ctx = useContext(OffersContext);
  if (!ctx) throw new Error("useOffers must be used within OffersProvider");
  return ctx;
}

export function useOffersProvider(walletConnected: boolean): OffersContextValue {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Stream initial 3 when wallet connects
  useEffect(() => {
    if (!walletConnected) {
      setOffers([]);
      return;
    }

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

  /**
   * Remove the given offer, shuffle the remaining two, append a new offer
   * whose game type differs from the two visible ones. Guarantees the
   * 3 displayed offers always have 3 different game types.
   */
  const removeAndReplace = useCallback((offerId: string) => {
    setOffers((prev) => {
      const remaining = prev.filter((o) => o.id !== offerId);
      // Shuffle remaining two
      if (remaining.length >= 2 && Math.random() < 0.5) {
        [remaining[0], remaining[1]] = [remaining[1], remaining[0]];
      }
      const visibleGameTypes = remaining.map((o) => o.gameType);
      const visibleTitles = remaining.map((o) => o.title);
      const replacement = pickReplacementOffer(visibleGameTypes, visibleTitles);
      if (replacement) {
        return [...remaining, replacement];
      }
      return remaining;
    });
  }, []);

  return { offers, isStreaming, removeAndReplace };
}