/**
 * Simulates an AI-powered offer streaming endpoint.
 * In production, replace the delay loop with real SSE / fetch streaming.
 */
import type { Offer } from "../types/offer";

const MOCK_OFFERS: Offer[] = [
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
    title: "Tap-to-Speed",
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
    title: "Avoid-Obstacles",
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

/** Stream delays: first offer appears fast, subsequent ones feel "generated" */
const STREAM_DELAYS = [600, 1200, 1600];

export async function streamOffers(
  onChunk: (offer: Offer) => void,
  onDone?: () => void,
): Promise<void> {
  for (let i = 0; i < MOCK_OFFERS.length; i++) {
    await new Promise<void>((res) => setTimeout(res, STREAM_DELAYS[i]));
    onChunk(MOCK_OFFERS[i]);
  }
  onDone?.();
}
