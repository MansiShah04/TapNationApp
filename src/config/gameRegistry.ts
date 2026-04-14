/**
 * Data-driven game registry.
 *
 * Maps GameType strings to their React component. Adding a new game requires:
 *   1. Create the component in src/components/games/
 *   2. Add one entry here
 * No other files need to change — routing, session validation, and offer
 * matching all derive from this registry.
 */
import React from "react";
import type { GameType } from "../types/offer";
import TapGame from "../components/games/TapGame";
import TapSpeedGame from "../components/games/TapSpeedGame";
import StackGame from "../components/games/StackGame";

export interface GameComponentProps {
  onSuccess: () => void;
  onClose: () => void;
  onCancel?: () => void;
}

interface GameEntry {
  component: React.ComponentType<GameComponentProps>;
  icon: string;
  displayName: string;
}

export const GAME_REGISTRY: Record<GameType, GameEntry> = {
  "Tap-to-Stop": {
    component: TapGame,
    icon: "🎯",
    displayName: "Tap-to-Stop",
  },
  "Tap-to-Speed": {
    component: TapSpeedGame,
    icon: "⚡",
    displayName: "Tap Speed",
  },
  "Stack-Align": {
    component: StackGame,
    icon: "🧱",
    displayName: "Stack Align",
  },
};

/** Check whether a string is a registered GameType. */
export function isRegisteredGame(title: string): title is GameType {
  return title in GAME_REGISTRY;
}
