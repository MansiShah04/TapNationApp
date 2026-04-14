/**
 * GameScreen — renders the correct game component via the game registry.
 * Handles game session start/complete and result overlay.
 */
import React, { useCallback, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useWallet } from "../hooks/useWallet";
import { useAuth } from "../hooks/useAuth";
import { useOffers } from "../hooks/useOffers";
import { startSession, completeSession, GameSession } from "../services/gameSession";
import { GAME_REGISTRY, isRegisteredGame } from "../config/gameRegistry";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import ResultOverlay from "../components/ui/ResultOverlay";
import type { AppStackParamList } from "../navigation/types";

type GameRoute = RouteProp<AppStackParamList, "Game">;
type Nav = NativeStackNavigationProp<AppStackParamList, "Game">;

export default function GameScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<GameRoute>();
  const { gameType, offerId, reward } = route.params;
  const { walletAddress } = useAuth();
  const { addReward, recordGameWon } = useWallet();
  const { removeAndReplace } = useOffers();

  // Holds the in-flight startSession() promise for the current attempt. Using
  // a promise (not the resolved session) lets handleWin await it if the user
  // finishes before the network call returns.
  const sessionPromiseRef = useRef<Promise<GameSession | null> | null>(null);
  const resolvedRef = useRef(false);
  const [result, setResult] = useState<"win" | "fail" | null>(null);

  const handleStart = useCallback(() => {
    if (!isRegisteredGame(gameType)) return;
    resolvedRef.current = false;
    sessionPromiseRef.current = (async () => {
      try {
        return await startSession(gameType, offerId, walletAddress ?? "", reward);
      } catch (e) {
        console.error("Failed to start game session:", e);
        return null;
      }
    })();
  }, [gameType, offerId, walletAddress, reward]);

  const handleWin = useCallback(async () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    const sessionPromise = sessionPromiseRef.current;
    sessionPromiseRef.current = null;

    // Update UI state immediately so the game unmounts and offers list updates
    recordGameWon();
    removeAndReplace(offerId);
    setResult("win");

    // Server verification runs in the background — reward is added on response
    const session = sessionPromise ? await sessionPromise : null;
    if (session) {
      try {
        const res = await completeSession(session, true, {
          score: 1,
          endedAt: Date.now(),
          metadata: {},
        });
        if (res.verified && res.rewardWei !== "0") {
          addReward(res.rewardWei);
        }
      } catch (e) {
        console.error("Failed to verify game session:", e);
      }
    }
  }, [addReward, removeAndReplace, offerId, recordGameWon]);

  const handleLose = useCallback(async () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    const sessionPromise = sessionPromiseRef.current;
    sessionPromiseRef.current = null;

    setResult("fail");

    const session = sessionPromise ? await sessionPromise : null;
    if (session) {
      try {
        await completeSession(session, false, {
          score: 0,
          endedAt: Date.now(),
          metadata: {},
        });
      } catch (e) {
        console.error("Failed to report game loss:", e);
      }
    }
  }, []);

  const handleResultFinish = useCallback(() => {
    setResult(null);
    navigation.goBack();
  }, [navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleErrorReset = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (!isRegisteredGame(gameType)) {
    navigation.goBack();
    return null;
  }

  const entry = GAME_REGISTRY[gameType];
  const GameComponent = entry.component;

  return (
    <View style={s.root}>
      {!result && (
        <ErrorBoundary onReset={handleErrorReset}>
          <GameComponent
            onSuccess={handleWin}
            onClose={handleLose}
            onCancel={handleCancel}
            onStart={handleStart}
          />
        </ErrorBoundary>
      )}

      {result && <ResultOverlay result={result} onFinish={handleResultFinish} />}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
