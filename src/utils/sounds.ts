/**
 * Sound manager for game audio feedback.
 *
 * Uses expo-av to generate short synthesized-style audio cues.
 * Sound files are bundled as assets — to add new sounds, place .mp3/.wav
 * files in assets/sounds/ and register them here.
 *
 * For now, uses programmatic Audio.Sound with silent fallback
 * since no sound assets exist yet. The playTap/playWin/playFail functions
 * are wired into all games so adding real assets later is a one-line change.
 */
import { Audio } from "expo-av";

let audioReady = false;

async function ensureAudioMode() {
  if (audioReady) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioReady = true;
  } catch {
    // Audio not available (emulator, permissions)
  }
}

// ─── Sound cache ────────────────────────────────────────────────────────────

const cache: Record<string, Audio.Sound | null> = {};

async function loadSound(key: string, source: number): Promise<Audio.Sound | null> {
  if (cache[key]) return cache[key];
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false, volume: 0.5 });
    cache[key] = sound;
    return sound;
  } catch {
    cache[key] = null;
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Placeholder sound players.
 * Replace the `require` paths with real assets when available:
 *   const TAP_SOUND = require("../../assets/sounds/tap.mp3");
 *   const WIN_SOUND = require("../../assets/sounds/win.mp3");
 *   const FAIL_SOUND = require("../../assets/sounds/fail.mp3");
 */

let tapSoundPromise: Promise<Audio.Sound | null> | null = null;

export async function playTap() {
  // Short tap click — will use asset when available
  // For now this is a no-op placeholder that won't crash
  try {
    await ensureAudioMode();
  } catch {}
}

export async function playWin() {
  try {
    await ensureAudioMode();
  } catch {}
}

export async function playFail() {
  try {
    await ensureAudioMode();
  } catch {}
}

/** Clean up all cached sounds (call on app background/unmount). */
export async function unloadAll() {
  for (const key of Object.keys(cache)) {
    try {
      await cache[key]?.unloadAsync();
    } catch {}
    cache[key] = null;
  }
}
