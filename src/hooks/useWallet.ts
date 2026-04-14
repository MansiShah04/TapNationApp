/**
 * WalletContext + useWallet hook.
 *
 * Shared wallet balance state across all screens. Balance is stored as
 * bigint (wei) to avoid floating-point errors. Display formatting
 * happens at the UI layer via formatWei().
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

/**
 * Sequence's public node for the same network the WaaS wallet lives on
 * (arbitrum-sepolia — matches INITIAL_NETWORK in waasSetup.ts).
 * This matches the pattern used in 0xsequence/demo-waas-react-native.
 */
const RPC_URL = "https://nodes.sequence.app/arbitrum-sepolia";
const ACCESS_KEY = process.env.EXPO_PUBLIC_PROJECT_ACCESS_KEY ?? "";

/**
 * Fetch the native balance via a raw JSON-RPC call.
 * Using plain fetch instead of ethers.JsonRpcProvider avoids its
 * background network-detection polling which spams retry logs on failure.
 */
async function fetchBalanceWei(address: string): Promise<bigint> {
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Key": ACCESS_KEY,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    });
    if (!res.ok) {
      console.warn(`[useWallet] RPC ${RPC_URL} returned HTTP ${res.status}`);
      throw new Error(`RPC ${res.status}`);
    }
    const json = await res.json();
    if (json.error) {
      console.warn(`[useWallet] RPC error:`, json.error);
      throw new Error(json.error.message ?? "RPC error");
    }
    return BigInt(json.result);
  } catch (e) {
    console.warn(`[useWallet] Balance fetch failed for ${address}:`, e);
    throw e;
  }
}

/** Convert wei bigint to human-readable AVAX string (4 decimal places). */
export function formatWei(wei: bigint): string {
  const full = ethers.formatEther(wei);
  const dot = full.indexOf(".");
  if (dot === -1) return full + ".0000";
  return full.slice(0, dot + 5).padEnd(dot + 5, "0");
}

// ─── Context ────────────────────────────────────────────────────────────────

interface WalletContextValue {
  balanceWei: bigint;
  claimCount: number;
  gamesPlayed: number;
  gamesWon: number;
  loadBalance: (address?: string) => Promise<void>;
  addReward: (rewardWei: string) => void;
  claimBalance: () => void;
  recordGamePlayed: () => void;
  recordGameWon: () => void;
  trackAddress: (address: string | null) => void;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

// ─── Provider hook ──────────────────────────────────────────────────────────

export function useWalletProvider(): WalletContextValue {
  const [balanceWei, setBalanceWei] = useState<bigint>(0n);
  const [trackedAddress, setTrackedAddress] = useState<string | null>(null);
  const [claimCount, setClaimCount] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);

  const loadBalance = useCallback(async (address?: string) => {
    const addr = address ?? trackedAddress;
    if (!addr) return;
    try {
      const wei = await fetchBalanceWei(addr);
      setBalanceWei(wei);
    } catch (e) {
      console.log("Wallet balance error", e);
    }
  }, [trackedAddress]);

  const trackAddress = useCallback((address: string | null) => {
    setTrackedAddress(address);
    if (!address) {
      setBalanceWei(0n);
    }
  }, []);

  useEffect(() => {
    if (trackedAddress) loadBalance(trackedAddress);
  }, [trackedAddress, loadBalance]);

  const addReward = useCallback((rewardWei: string) => {
    setBalanceWei((prev) => prev + BigInt(rewardWei));
  }, []);

  /** Reset the in-app balance to zero and bump the claim counter. */
  const claimBalance = useCallback(() => {
    setBalanceWei(0n);
    setClaimCount((n) => n + 1);
  }, []);

  const recordGamePlayed = useCallback(() => {
    setGamesPlayed((n) => n + 1);
  }, []);

  const recordGameWon = useCallback(() => {
    setGamesWon((n) => n + 1);
  }, []);

  return {
    balanceWei,
    claimCount,
    gamesPlayed,
    gamesWon,
    loadBalance,
    addReward,
    claimBalance,
    recordGamePlayed,
    recordGameWon,
    trackAddress,
  };
}
