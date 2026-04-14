/**
 * Game session service for server-side reward validation.
 *
 * Flow:
 *   1. Client calls startSession() before game begins → server returns sessionId + serverSeed
 *   2. Player plays the game locally
 *   3. Client calls completeSession() with game result + proof data
 *   4. Server validates the result (timing, score plausibility, anti-cheat checks)
 *   5. Server returns verified reward amount (or rejection)
 *
 * Until a real backend exists, this module provides a local mock that mirrors
 * the real API contract so the rest of the app can be wired up now.
 */
import * as ExpoCrypto from "expo-crypto";
import { ethers } from "ethers";
import type { GameType } from "../types/offer";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GameSession {
  sessionId: string;
  gameType: GameType;
  offerId: string;
  serverSeed: string;
  startedAt: number;
  /** Reward this session pays out on win, in wei (string). */
  rewardWei: string;
}

export interface GameProof {
  /** Final score / result from the game */
  score: number;
  /** Client timestamp when game ended */
  endedAt: number;
  /** Game-specific data for server validation */
  metadata: Record<string, unknown>;
}

export interface SessionResult {
  verified: boolean;
  /** Reward in wei (string to avoid float issues). "0" if rejected. */
  rewardWei: string;
  reason?: string;
}

// ─── Plausibility bounds per game type ──────────────────────────────────────

const GAME_RULES: Record<GameType, { minDurationMs: number; maxDurationMs: number; maxScore: number }> = {
  "Tap-to-Stop":   { minDurationMs: 500,    maxDurationMs: 30_000,  maxScore: 1 },
  "Tap-to-Speed":  { minDurationMs: 4_500,  maxDurationMs: 10_000,  maxScore: 1 },
  "Stack-Align":   { minDurationMs: 4_000,  maxDurationMs: 60_000,  maxScore: 1 },
};

/** Convert a decimal AVAX amount (e.g. 0.15) to a wei string. */
export function avaxToWei(avax: number): string {
  // ethers.parseEther handles up to 18 decimals safely
  return ethers.parseEther(avax.toString()).toString();
}

const API_URL = process.env.EXPO_PUBLIC_GAME_SESSION_API_URL;

// ─── API client ─────────────────────────────────────────────────────────────

/**
 * Start a new game session. The server records the start time and returns
 * a session ID + server seed for result verification.
 */
export async function startSession(
  gameType: GameType,
  offerId: string,
  walletAddress: string,
  rewardAvax: number,
): Promise<GameSession> {
  const rewardWei = avaxToWei(rewardAvax);

  if (API_URL) {
    const res = await fetch(`${API_URL}/v1/game/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameType, offerId, walletAddress, rewardWei }),
    });
    if (!res.ok) {
      throw new Error(`Failed to start session: ${res.status}`);
    }
    return res.json();
  }

  // ── Mock: generate session locally ──────────────────────────────────────
  const randomBytes = await ExpoCrypto.getRandomBytesAsync(16);
  const sessionId = Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const seedBytes = await ExpoCrypto.getRandomBytesAsync(16);
  const serverSeed = Array.from(seedBytes, (b) => b.toString(16).padStart(2, "0")).join("");

  return {
    sessionId,
    gameType,
    offerId,
    serverSeed,
    startedAt: Date.now(),
    rewardWei,
  };
}

/**
 * Submit game result for server-side validation.
 * The server checks timing plausibility, score bounds, and anti-cheat signals
 * before distributing the reward.
 */
export async function completeSession(
  session: GameSession,
  won: boolean,
  proof: GameProof,
): Promise<SessionResult> {
  if (API_URL) {
    const res = await fetch(`${API_URL}/v1/game/session/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.sessionId,
        won,
        proof,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to complete session: ${res.status}`);
    }
    return res.json();
  }

  // ── Mock: validate locally with same rules the server would use ─────────
  if (!won) {
    return { verified: true, rewardWei: "0", reason: "loss" };
  }

  const rules = GAME_RULES[session.gameType];
  const duration = proof.endedAt - session.startedAt;

  // Timing plausibility check
  if (duration < rules.minDurationMs) {
    return { verified: false, rewardWei: "0", reason: "completed_too_fast" };
  }
  if (duration > rules.maxDurationMs) {
    return { verified: false, rewardWei: "0", reason: "session_expired" };
  }

  // Score bounds check
  if (proof.score < 0 || proof.score > rules.maxScore) {
    return { verified: false, rewardWei: "0", reason: "invalid_score" };
  }

  return {
    verified: true,
    rewardWei: session.rewardWei,
  };
}
