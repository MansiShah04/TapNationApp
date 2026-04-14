/**
 * Core offer types used across the offer wall, offer cards, and mock stream.
 */

export type GameType = "Tap-to-Stop" | "Tap-to-Speed" | "Stack-Align";

export interface Offer {
  id: string;
  title: string;
  description: string;
  reward: number;
  rewardUnit?: string;
  progress: number;
  progressLabel?: string;
  icon: string;
  tags?: string[];
  variant?: "hot" | "premium" | "default";
  /** Which game this offer launches. */
  gameType: GameType;
}
