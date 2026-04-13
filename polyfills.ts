// This file MUST be imported before anything that uses crypto (ethers, @0xsequence/waas).
// It has NO imports from ethers so the polyfill runs before ethers initializes.

import * as ExpoCrypto from "expo-crypto";
import { ReadableStream } from "web-streams-polyfill";

// Polyfill ReadableStream
if (!globalThis.ReadableStream) {
  (globalThis as any).ReadableStream = ReadableStream;
}

// Polyfill crypto.getRandomValues using expo-crypto
if (!globalThis.crypto) {
  (globalThis as any).crypto = {} as Crypto;
}

if (!globalThis.crypto.getRandomValues) {
  (globalThis.crypto as any).getRandomValues = <T extends ArrayBufferView>(array: T): T => {
    const bytes = ExpoCrypto.getRandomBytes(array.byteLength);
    const target = new Uint8Array(
      array.buffer as ArrayBuffer,
      array.byteOffset,
      array.byteLength
    );
    target.set(bytes);
    return array;
  };
}

(global as any).getRandomValues = globalThis.crypto.getRandomValues;
