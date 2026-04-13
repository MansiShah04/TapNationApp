/**
 * Runtime polyfills — MUST be imported before any module that uses crypto
 * (ethers, @0xsequence/waas). This file has NO ethers imports so the polyfill
 * runs before ethers initializes its internal crypto check.
 */
import * as ExpoCrypto from "expo-crypto";
import { ReadableStream } from "web-streams-polyfill";

if (!globalThis.ReadableStream) {
  (globalThis as any).ReadableStream = ReadableStream;
}

if (!globalThis.crypto) {
  (globalThis as any).crypto = {} as Crypto;
}

if (!globalThis.crypto.getRandomValues) {
  (globalThis.crypto as any).getRandomValues = <T extends ArrayBufferView>(array: T): T => {
    const bytes = ExpoCrypto.getRandomBytes(array.byteLength);
    const target = new Uint8Array(
      array.buffer as ArrayBuffer,
      array.byteOffset,
      array.byteLength,
    );
    target.set(bytes);
    return array;
  };
}

(global as any).getRandomValues = globalThis.crypto.getRandomValues;
