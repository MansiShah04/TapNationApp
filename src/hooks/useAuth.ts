/**
 * AuthContext + useAuth hook.
 * Centralizes all auth state so components don't need prop-drilling.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { EmailConflictInfo } from "@0xsequence/waas";
import { sequenceWaas } from "../config/waasSetup";
import { signInWithGoogle, signInWithApple, signInAsGuest } from "../services/auth";

interface AuthState {
  walletAddress: string | null;
  isLoggingIn: boolean;
  isEmailAuthInProgress: boolean;
  emailConflictInfo: EmailConflictInfo | undefined;
  isEmailConflictOpen: boolean;
}

interface AuthActions {
  setWalletAddress: (address: string) => void;
  handleGuestLogin: () => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  handleAppleLogin: () => Promise<void>;
  openEmailAuth: () => void;
  closeEmailAuth: () => void;
  onEmailAuthSuccess: (address: string) => void;
  closeEmailConflict: () => void;
  confirmEmailConflict: () => void;
  signOut: () => Promise<void>;
}

export type AuthContextValue = AuthState & AuthActions;

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAuthProvider(): AuthContextValue {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isEmailAuthInProgress, setIsEmailAuthInProgress] = useState(false);
  const [emailConflictInfo, setEmailConflictInfo] = useState<EmailConflictInfo | undefined>();
  const [isEmailConflictOpen, setIsEmailConflictOpen] = useState(false);
  const forceCreateRef = useRef<(() => Promise<void>) | null>(null);

  // Auto-restore session on mount
  useEffect(() => {
    (async () => {
      const signed = await sequenceWaas.isSignedIn();
      if (signed) {
        const address = await sequenceWaas.getAddress();
        setWalletAddress(address);
      }
    })();
  }, []);

  // Email conflict listener
  useEffect(() => {
    return sequenceWaas.onEmailConflict(async (info, forceCreate) => {
      forceCreateRef.current = forceCreate;
      setEmailConflictInfo(info);
      setIsEmailConflictOpen(true);
    });
  }, []);

  const handleGuestLogin = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      const wallet = await signInAsGuest();
      if (wallet) setWalletAddress(wallet);
    } catch (e) {
      console.error("Guest sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithGoogle();
      if (result?.walletAddress) setWalletAddress(result.walletAddress);
    } catch (e) {
      console.error("Google sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const handleAppleLogin = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithApple();
      if (result?.walletAddress) setWalletAddress(result.walletAddress);
    } catch (e) {
      console.error("Apple sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const openEmailAuth = useCallback(() => setIsEmailAuthInProgress(true), []);
  const closeEmailAuth = useCallback(() => setIsEmailAuthInProgress(false), []);

  const onEmailAuthSuccess = useCallback((address: string) => {
    setIsEmailAuthInProgress(false);
    setWalletAddress(address);
  }, []);

  const closeEmailConflict = useCallback(() => {
    setIsEmailAuthInProgress(false);
    setIsEmailConflictOpen(false);
    setEmailConflictInfo(undefined);
    forceCreateRef.current = null;
  }, []);

  const confirmEmailConflict = useCallback(() => {
    setIsEmailConflictOpen(false);
    setEmailConflictInfo(undefined);
    forceCreateRef.current?.();
  }, []);

  const signOut = useCallback(async () => {
    // Clear local state immediately so UI navigates back to the auth stack,
    // even if the remote dropSession call fails or is slow.
    setWalletAddress(null);
    try {
      await sequenceWaas.dropSession();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  }, []);

  return {
    walletAddress,
    isLoggingIn,
    isEmailAuthInProgress,
    emailConflictInfo,
    isEmailConflictOpen,
    setWalletAddress,
    handleGuestLogin,
    handleGoogleLogin,
    handleAppleLogin,
    openEmailAuth,
    closeEmailAuth,
    onEmailAuthSuccess,
    closeEmailConflict,
    confirmEmailConflict,
    signOut,
  };
}
