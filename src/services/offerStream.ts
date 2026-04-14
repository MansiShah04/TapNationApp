/**
 * Simulates an AI-powered offer service.
 * In production, replace with real SSE / fetch streaming.
 *
 * 12 unique offers across 3 game types. The app always shows 3 at a time,
 * each with a unique title/icon/description.
 */
import type { Offer, GameType } from "../types/offer";

// ─── 12 unique offer templates ──────────────────────────────────────────────

interface OfferTemplate {
  gameType: GameType;
  title: string;
  description: string;
  icon: string;
  reward: number;
  progress: number;
  progressLabel: string;
  variant: Offer["variant"];
  tags: string[];
}

const OFFER_POOL: OfferTemplate[] = [
  // Tap-to-Stop
  { gameType: "Tap-to-Stop", title: "Candy Crush Zone", description: "Reach Level 50 · Match 3", icon: "🍬", reward: 0.15, progress: 76, progressLabel: "38 / 50", variant: "hot", tags: ["⭐ Popular", "🏆 Top Rated"] },
  { gameType: "Tap-to-Stop", title: "Bullseye Master", description: "Hit the perfect spot · Precision", icon: "🎯", reward: 0.12, progress: 40, progressLabel: "2 / 5", variant: "default", tags: ["🏆 Top Rated"] },
  { gameType: "Tap-to-Stop", title: "Clock Stopper", description: "Freeze time at the right moment", icon: "⏱️", reward: 0.18, progress: 60, progressLabel: "6 / 10", variant: "premium", tags: ["🔥 Trending", "🏆 Top Rated"] },
  { gameType: "Tap-to-Stop", title: "Wave Rider", description: "Catch the perfect wave · Timing", icon: "🌊", reward: 0.10, progress: 25, progressLabel: "5 / 20", variant: "default", tags: ["🏆 Top Rated"] },
  // Tap-to-Speed
  { gameType: "Tap-to-Speed", title: "Aviator Rush", description: "Cash out at 2× · 5 rounds", icon: "✈️", reward: 0.08, progress: 40, progressLabel: "2 / 5", variant: "default", tags: ["🏆 Top Rated"] },
  { gameType: "Tap-to-Speed", title: "Lightning Fingers", description: "Break the speed record · Sprint", icon: "⚡", reward: 0.11, progress: 55, progressLabel: "11 / 20", variant: "hot", tags: ["⭐ Popular", "🏆 Top Rated"] },
  { gameType: "Tap-to-Speed", title: "Rocket Launch", description: "Turbo taps to orbit · Endurance", icon: "🚀", reward: 0.09, progress: 30, progressLabel: "3 / 10", variant: "default", tags: ["🔥 Trending", "🏆 Top Rated"] },
  { gameType: "Tap-to-Speed", title: "Drum Roll", description: "Fastest drummer alive · Challenge", icon: "🥁", reward: 0.14, progress: 80, progressLabel: "8 / 10", variant: "premium", tags: ["🏆 Top Rated"] },
  // Stack-Align
  { gameType: "Stack-Align", title: "Tower Architect", description: "Stack 8 blocks · Precision", icon: "🏗️", reward: 0.32, progress: 20, progressLabel: "2 / 10", variant: "premium", tags: ["🔥 Trending", "🏆 Top Rated"] },
  { gameType: "Stack-Align", title: "Skyline Builder", description: "Build the perfect tower · Heights", icon: "🏙️", reward: 0.25, progress: 50, progressLabel: "5 / 10", variant: "hot", tags: ["⭐ Popular", "🏆 Top Rated"] },
  { gameType: "Stack-Align", title: "Pixel Stack", description: "Align blocks in perfect sync · Classic", icon: "🟦", reward: 0.28, progress: 35, progressLabel: "7 / 20", variant: "default", tags: ["🏆 Top Rated"] },
  { gameType: "Stack-Align", title: "Block Balancer", description: "Line up the blocks · Focus", icon: "🧱", reward: 0.20, progress: 70, progressLabel: "14 / 20", variant: "default", tags: ["🔥 Trending", "🏆 Top Rated"] },
];

let nextId = 1;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function instantiate(t: OfferTemplate): Offer {
  return {
    id: String(nextId++),
    title: t.title,
    description: t.description,
    icon: t.icon,
    reward: t.reward,
    rewardUnit: "🏆 Top Rated",
    progress: t.progress,
    progressLabel: t.progressLabel,
    tags: t.tags,
    variant: t.variant,
    gameType: t.gameType,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

const STREAM_DELAYS = [0, 200, 400];
const GAME_TYPES: GameType[] = ["Tap-to-Stop", "Tap-to-Speed", "Stack-Align"];

/** Pick one random template for each game type — guarantees 3 different games. */
function pickOnePerGameType(): OfferTemplate[] {
  return shuffle(GAME_TYPES).map((type) => {
    const candidates = OFFER_POOL.filter((t) => t.gameType === type);
    return candidates[Math.floor(Math.random() * candidates.length)];
  });
}

/** Stream the initial 3 offers (one per game type) with staggered delays. */
export async function streamOffers(
  onChunk: (offer: Offer) => void,
  onDone?: () => void,
): Promise<void> {
  const batch = pickOnePerGameType().map(instantiate);
  for (let i = 0; i < batch.length; i++) {
    await new Promise<void>((res) => setTimeout(res, STREAM_DELAYS[i]));
    onChunk(batch[i]);
  }
  onDone?.();
}

/**
 * Pick a single new offer whose gameType is NOT present in `excludeGameTypes`,
 * and whose title is NOT in `excludeTitles`. This guarantees the 3 visible
 * offers always have 3 different game types.
 */
export function pickReplacementOffer(
  excludeGameTypes: GameType[],
  excludeTitles: string[],
): Offer | null {
  let candidates = OFFER_POOL.filter(
    (t) => !excludeGameTypes.includes(t.gameType) && !excludeTitles.includes(t.title),
  );
  // Fallback: if all gameTypes are excluded (shouldn't happen with 3 visible), allow any unseen title
  if (candidates.length === 0) {
    candidates = OFFER_POOL.filter((t) => !excludeTitles.includes(t.title));
  }
  if (candidates.length === 0) return null;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return instantiate(chosen);
}