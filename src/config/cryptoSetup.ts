/**
 * Loads polyfills first, then re-exports ethers.
 * Import this file (or just ./polyfills) before any ethers usage.
 */
import "./polyfills";
export * from "ethers";
