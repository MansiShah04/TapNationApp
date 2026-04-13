/**
 * Hook encapsulating wallet state: address, balance, and refresh logic.
 */
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { sequenceWaas } from "../config/waasSetup";

const RPC = "https://api.avax-test.network/ext/bc/C/rpc";
const provider = new ethers.JsonRpcProvider(RPC);

export function useWallet() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");

  // Check if already signed in on mount
  useEffect(() => {
    (async () => {
      const signed = await sequenceWaas.isSignedIn();
      if (signed) {
        const address = await sequenceWaas.getAddress();
        setWalletAddress(address);
      }
    })();
  }, []);

  const loadBalance = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const wei = await provider.getBalance(walletAddress);
      setBalance(ethers.formatEther(wei));
    } catch (e) {
      console.log("Wallet balance error", e);
    }
  }, [walletAddress]);

  // Load balance when wallet connects
  useEffect(() => {
    if (walletAddress) loadBalance();
  }, [walletAddress, loadBalance]);

  const addReward = useCallback(
    (amount: number) => {
      setBalance((prev) => (parseFloat(prev) + amount).toFixed(4));
    },
    [],
  );

  const signOut = useCallback(async () => {
    await sequenceWaas.dropSession();
    setWalletAddress(null);
    setBalance("0");
  }, []);

  return { walletAddress, setWalletAddress, balance, loadBalance, addReward, signOut };
}
