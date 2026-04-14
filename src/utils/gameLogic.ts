export function isInTargetZone(
  position: number,
  zoneMin: number,
  zoneMax: number,
): boolean {
  return position > zoneMin && position < zoneMax;
}

//#region  Scoring- Calculate taps per second. Returns 0 if elapsed < 1s

export function calculateTps(taps: number, elapsedSec: number): number {
  return elapsedSec >= 1 ? taps / elapsedSec : 0;
}
//#endregion

//#region Check if the player met the TPS target over the full game duration.
export function isTpsTargetMet(
  totalTaps: number,
  gameDurationSec: number,
  targetTps: number,
): boolean {
  return totalTaps / gameDurationSec >= targetTps;
}
//#endregion

export interface StackBlock {
  x: number;
  width: number;
}

export interface DropResult {
  placed: StackBlock | null;
  perfect: boolean;
  trimmed: number;
}

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

export function clampBlockX(x: number, blockWidth: number, areaWidth: number): number {
  return Math.max(0, Math.min(areaWidth - blockWidth, x));
}