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

export async function unloadAll() {
  for (const key of Object.keys(cache)) {
    try {
      await cache[key]?.unloadAsync();
    } catch {}
    cache[key] = null;
  }
}
