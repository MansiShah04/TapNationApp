/**
 * Simulates an AI-powered offer service.
 * In production, replace with real SSE / fetch streaming.
 *
 * 12 unique offers across 3 game types. The app always shows 3 at a time,
 * each with a unique title/icon/description.
 */
import type { Offer, GameType } from "../types/offer";
import { generateOffers, generateOffer, type GeneratedOfferTemplate } from "./offerGenerator";

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

/** Convert a template-shaped object (AI or static) into a full Offer. */
function instantiateAny(t: OfferTemplate | GeneratedOfferTemplate): Offer {
  return instantiate(t as OfferTemplate);
}

/** Pick one random static template for each game type — guarantees 3 different games. */
function pickStaticOnePerGameType(gameTypes: GameType[]): OfferTemplate[] {
  return gameTypes.map((type) => {
    const candidates = OFFER_POOL.filter((t) => t.gameType === type);
    return candidates[Math.floor(Math.random() * candidates.length)];
  });
}

/** Stream the initial 3 offers (one per game type) with staggered delays. */
export async function streamOffers(
  onChunk: (offer: Offer) => void,
  onDone?: () => void,
): Promise<void> {
  const order = shuffle(GAME_TYPES);

  // Try the AI generator first; if it fails or returns a partial batch, fall back.
  let templates: Array<OfferTemplate | GeneratedOfferTemplate> = [];
  try {
    const ai = await generateOffers(order);
    if (ai.length === order.length) {
      templates = ai;
    }
  } catch {
    // Ignore — handled below
  }
  if (templates.length !== order.length) {
    templates = pickStaticOnePerGameType(order);
  }

  const batch = templates.map(instantiateAny);
  for (let i = 0; i < batch.length; i++) {
    await new Promise<void>((res) => setTimeout(res, STREAM_DELAYS[i]));
    onChunk(batch[i]);
  }
  onDone?.();
}

/** Static-pool fallback used when the AI call fails or returns nothing. */
function pickReplacementFromPool(
  excludeGameTypes: GameType[],
  excludeTitles: string[],
): Offer | null {
  let candidates = OFFER_POOL.filter(
    (t) => !excludeGameTypes.includes(t.gameType) && !excludeTitles.includes(t.title),
  );
  if (candidates.length === 0) {
    candidates = OFFER_POOL.filter((t) => !excludeTitles.includes(t.title));
  }
  if (candidates.length === 0) return null;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return instantiate(chosen);
}

/**
 * Async replacement offer — asks the AI for a fresh offer of a missing
 * game type; falls back to the static pool on any failure.
 */
export async function pickReplacementOfferAsync(
  excludeGameTypes: GameType[],
  excludeTitles: string[],
): Promise<Offer | null> {
  const missingType = GAME_TYPES.find((t) => !excludeGameTypes.includes(t));
  if (missingType) {
    try {
      const ai = await generateOffer(missingType);
      if (ai && !excludeTitles.includes(ai.title)) {
        return instantiateAny(ai);
      }
    } catch {
      // ignore — fall through to static pool
    }
  }
  return pickReplacementFromPool(excludeGameTypes, excludeTitles);
}

/**
 * Synchronous replacement from the static pool only — kept for callers that
 * can't await. Prefer pickReplacementOfferAsync for AI-first behaviour.
 */
export function pickReplacementOffer(
  excludeGameTypes: GameType[],
  excludeTitles: string[],
): Offer | null {
  return pickReplacementFromPool(excludeGameTypes, excludeTitles);
}