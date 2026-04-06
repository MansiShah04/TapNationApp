import type { Offer } from "./OfferCard";

// Simulates an AI streaming endpoint that pushes offers one-by-one
// Replace the loop body with a real fetch() SSE / OpenAI stream in production

export const streamOffers = async (
  onChunk: (offer: Offer) => void,
  onDone?: () => void
): Promise<void> => {
  const offers: Offer[] = [
    {
      id: "1",
      title: "Tap-to-Stop",
      description: "Reach Level 50 · Match 3",
      reward: 0.15,
      rewardUnit: "AVAX",
      progress: 76,
      progressLabel: "38 / 50",
      icon: "🍬",
      tags: ["🔥 Hot", "AVAX"],
      variant: "hot",
    },
    {
      id: "2",
      title: "Aviator Rush",
      description: "Cash out at 2× · 5 rounds",
      reward: 0.08,
      rewardUnit: "AVAX",
      progress: 40,
      progressLabel: "2 / 5",
      icon: "✈️",
      tags: ["AVAX", "AI Picks"],
      variant: "default",
    },
    {
      id: "3",
      title: "Load Runner X",
      description: "Run 10 km in-game · Endless",
      reward: 0.32,
      rewardUnit: "AVAX",
      progress: 20,
      progressLabel: "2 / 10 km",
      icon: "🏃",
      tags: ["Daily", "AVAX"],
      variant: "premium",
    },
  ];

  // Stream delays: first offer appears fast, subsequent ones feel "generated"
  const delays = [600, 1200, 1600];

  for (let i = 0; i < offers.length; i++) {
    await new Promise<void>((res) => setTimeout(res, delays[i]));
    onChunk(offers[i]);
  }

  onDone?.();
};