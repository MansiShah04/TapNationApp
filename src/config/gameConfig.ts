
import type { GameType } from "../types/offer";

export interface TapToStopConfig {
  zoneMin: number;
  zoneMax: number;
  oscillationDurationMs: number;
}

export interface TapSpeedConfig {
  gameDurationSec: number;
  targetTps: number;
}

export interface StackAlignConfig {
  targetStacks: number;
  blockHeight: number;
  initialBlockWidth: number;
  initialSpeed: number;
  speedIncrement: number;
  tickIntervalMs: number;
  perfectTolerance: number;
}

export interface GameConfig {
  "Tap-to-Stop": TapToStopConfig;
  "Tap-to-Speed": TapSpeedConfig;
  "Stack-Align": StackAlignConfig;
}


const DEFAULT_CONFIG: GameConfig = {
  "Tap-to-Stop": {
    zoneMin: 0.4,
    zoneMax: 0.6,
    oscillationDurationMs: 2000,
  },
  "Tap-to-Speed": {
    gameDurationSec: 5,
    targetTps: 6,
  },
  "Stack-Align": {
    targetStacks: 5,
    blockHeight: 30,
    initialBlockWidth: 160,
    initialSpeed: 3.5,
    speedIncrement: 0.35,
    tickIntervalMs: 16,
    perfectTolerance: 4,
  },
};



export function getGameConfig<T extends GameType>(gameType: T): GameConfig[T] {
  return DEFAULT_CONFIG[gameType];
}


export function getAllGameConfigs(): GameConfig {
  return { ...DEFAULT_CONFIG };
}