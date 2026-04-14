/**
 * Pure game logic functions extracted from components.
 * Fully testable — no React, no Animated, no side effects.
 */

// ─── Scoring (TapToStop) ────────────────────────────────────────────────────

/** Check if the indicator position (0–1) is within the target zone. */
export function isInTargetZone(
  position: number,
  zoneMin: number,
  zoneMax: number,
): boolean {
  return position > zoneMin && position < zoneMax;
}

// ─── Scoring (TapSpeed) ─────────────────────────────────────────────────────

/** Calculate taps per second. Returns 0 if elapsed < 1s. */
export function calculateTps(taps: number, elapsedSec: number): number {
  return elapsedSec >= 1 ? taps / elapsedSec : 0;
}

/** Check if the player met the TPS target over the full game duration. */
export function isTpsTargetMet(
  totalTaps: number,
  gameDurationSec: number,
  targetTps: number,
): boolean {
  return totalTaps / gameDurationSec >= targetTps;
}

// ─── Stack alignment (StackGame) ────────────────────────────────────────────

export interface StackBlock {
  x: number;
  width: number;
}

export interface DropResult {
  /** The new block placed on the stack, or null if the drop missed entirely. */
  placed: StackBlock | null;
  /** Whether the drop was a "perfect" alignment (within tolerance). */
  perfect: boolean;
  /** Amount of width lost compared to the incoming block. */
  trimmed: number;
}

/**
 * Compute the result of dropping a moving block onto the last stacked block.
 * Returns the overlapping region (the new block's footprint), or null if
 * the drop missed the stack entirely.
 */
export function computeDropResult(
  lastBlock: StackBlock,
  incomingX: number,
  incomingWidth: number,
  perfectTolerance: number,
): DropResult {
  const overlapStart = Math.max(lastBlock.x, incomingX);
  const overlapEnd = Math.min(lastBlock.x + lastBlock.width, incomingX + incomingWidth);
  const overlapWidth = overlapEnd - overlapStart;

  if (overlapWidth <= 0) {
    return { placed: null, perfect: false, trimmed: incomingWidth };
  }

  const offset = Math.abs(incomingX - lastBlock.x);
  const perfect = offset <= perfectTolerance;
  const placed = perfect
    ? { x: lastBlock.x, width: lastBlock.width }
    : { x: overlapStart, width: overlapWidth };

  return {
    placed,
    perfect,
    trimmed: incomingWidth - placed.width,
  };
}

/** Clamp a position so the block stays entirely inside the game area. */
export function clampBlockX(x: number, blockWidth: number, areaWidth: number): number {
  return Math.max(0, Math.min(areaWidth - blockWidth, x));
}