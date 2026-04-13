/**
 * Core offer types used across the offer wall, offer cards, and mock stream.
 */

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
}

export type GameType = "Tap-to-Stop" | "Tap-to-Speed" | "Avoid-Obstacles";
