/**
 * AI-powered offer generator using the OpenRouter API.
 *
 * Calls an LLM to produce offers matching the OfferTemplate shape, then
 * parses the JSONL response line-by-line. Any parse error, network error,
 * or schema mismatch causes the caller to fall back to the static pool.
 */
import type { GameType } from "../types/offer";

// ─── Public types (matches OfferTemplate in offerStream.ts) ─────────────────

export interface GeneratedOfferTemplate {
  gameType: GameType;
  title: string;
  description: string;
  icon: string;
  reward: number;
  progress: number;
  progressLabel: string;
  variant: "hot" | "premium" | "default";
  tags: string[];
}

// ─── Configuration ──────────────────────────────────────────────────────────

/** Strip surrounding quotes/whitespace — dotenv leaves them in place on some setups. */
function cleanEnv(v: string | undefined): string {
  return (v ?? "").trim().replace(/^['"]|['"]$/g, "");
}

const API_KEY = cleanEnv(process.env.EXPO_PUBLIC_OPENROUTER_API_KEY);
const PROXY_URL = cleanEnv(process.env.EXPO_PUBLIC_OPENROUTER_PROXY_URL);
const ENDPOINT = PROXY_URL || "https://openrouter.ai/api/v1/chat/completions";
const MODEL = cleanEnv(process.env.EXPO_PUBLIC_OPENROUTER_MODEL) || "nvidia/nemotron-3-super-120b-a12b:free";
// Free-tier models can cold-start slowly — give them up to 30s before giving up.
const REQUEST_TIMEOUT_MS = 10_000;

const ALLOWED_GAME_TYPES: GameType[] = ["Tap-to-Stop", "Tap-to-Speed", "Stack-Align"];
const ALLOWED_VARIANTS: Array<"hot" | "premium" | "default"> = ["hot", "premium", "default"];

// ─── Prompt construction ────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return [
    "You generate mobile-game offer cards for a play-to-earn app called TapNation.",
    "Each offer advertises a short, fun, casual mini-game that rewards the user in AVAX tokens.",
    "You MUST output JSONL (one JSON object per line), nothing else — no markdown, no code fences, no commentary.",
    "Every object must be a complete, valid JSON value on a single line.",
  ].join(" ");
}

function buildUserPrompt(gameTypes: GameType[]): string {
  const allowedTypes = ALLOWED_GAME_TYPES.join(" | ");
  const requestedTypes = gameTypes.join(", ");
  return [
    `Generate exactly ${gameTypes.length} offers, one for each of these gameType values in order: ${requestedTypes}.`,
    "Each line must be a valid JSON object with EXACTLY these keys:",
    `{`,
    `  "gameType": "${allowedTypes}",`,
    `  "title": string (2-4 words, catchy, no emoji),`,
    `  "description": string (short, 3-7 words, use " · " as a bullet separator),`,
    `  "icon": string (exactly one emoji character),`,
    `  "reward": number (between 0.05 and 0.40, up to 2 decimals — AVAX amount),`,
    `  "progress": number (integer between 10 and 90),`,
    `  "progressLabel": string (e.g. "3 / 10" or "38 / 50"),`,
    `  "variant": "hot" | "premium" | "default",`,
    `  "tags": string[] (1-3 tags, short, emoji-prefixed OK)`,
    `}`,
    "Output only raw JSON lines, no markdown, no extra text.",
  ].join("\n");
}

// ─── Validation ─────────────────────────────────────────────────────────────

function isValidOffer(
  obj: unknown,
  expectedGameType?: GameType,
): obj is GeneratedOfferTemplate {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;

  if (typeof o.gameType !== "string" || !ALLOWED_GAME_TYPES.includes(o.gameType as GameType)) return false;
  if (expectedGameType && o.gameType !== expectedGameType) return false;
  if (typeof o.title !== "string" || o.title.length === 0) return false;
  if (typeof o.description !== "string" || o.description.length === 0) return false;
  if (typeof o.icon !== "string" || o.icon.length === 0) return false;
  if (typeof o.reward !== "number" || o.reward <= 0 || o.reward > 1) return false;
  if (typeof o.progress !== "number" || o.progress < 0 || o.progress > 100) return false;
  if (typeof o.progressLabel !== "string" || o.progressLabel.length === 0) return false;
  if (typeof o.variant !== "string" || !ALLOWED_VARIANTS.includes(o.variant as "hot" | "premium" | "default")) return false;
  if (!Array.isArray(o.tags) || !o.tags.every((t) => typeof t === "string")) return false;

  return true;
}

/** Parse JSONL content — one JSON value per non-empty line. Invalid lines are dropped. */
function parseJsonlOffers(content: string): GeneratedOfferTemplate[] {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    // Strip potential markdown fence remnants if the model ignored instructions
    .filter((l) => !l.startsWith("```"));

  const out: GeneratedOfferTemplate[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (isValidOffer(obj)) out.push(obj);
    } catch {
      // Skip malformed lines silently
    }
  }
  return out;
}

// ─── OpenRouter call ────────────────────────────────────────────────────────

async function callOpenRouter(gameTypes: GameType[]): Promise<string> {
  if (!API_KEY) {
    throw new Error("Missing EXPO_PUBLIC_OPENROUTER_API_KEY — falling back to static offers");
  }

  const requestBody = {
    model: MODEL,
    // Cap output length — each offer line is ~200 chars, 3 offers fits well under 600 tokens.
    max_tokens: 800,
    temperature: 0.9,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(gameTypes) },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://tapnation.local",
        "X-Title": "TapNation",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`OpenRouter HTTP ${res.status}`);
    }

    const json = await res.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned no content");
    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate N offers via the AI, one per requested gameType.
 * Returns an empty array on any failure so callers can fall back to the
 * static offer pool.
 */
export async function generateOffers(
  gameTypes: GameType[],
): Promise<GeneratedOfferTemplate[]> {
  if (gameTypes.length === 0) return [];
  try {
    const content = await callOpenRouter(gameTypes);
    const offers = parseJsonlOffers(content);

    // Ensure we have one offer per requested game type, in the requested order.
    const byType = new Map<GameType, GeneratedOfferTemplate>();
    for (const offer of offers) {
      if (!byType.has(offer.gameType)) {
        byType.set(offer.gameType, offer);
      }
    }
    const ordered: GeneratedOfferTemplate[] = [];
    for (const type of gameTypes) {
      const match = byType.get(type);
      if (match) ordered.push(match);
    }
    return ordered;
  } catch (e) {
    console.warn("[offerGenerator] AI generation failed, using fallback:", e);
    return [];
  }
}

/** Generate a single offer of the given gameType. Returns null on failure. */
export async function generateOffer(
  gameType: GameType,
): Promise<GeneratedOfferTemplate | null> {
  const [offer] = await generateOffers([gameType]);
  return offer ?? null;
}
