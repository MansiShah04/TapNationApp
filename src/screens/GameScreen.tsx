/**
 * GameScreen — renders the correct game component via the game registry.
 * Handles game session start/complete and result overlay.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
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

  const sessionRef = useRef<GameSession | null>(null);
  const resolvedRef = useRef(false);
  const [result, setResult] = useState<"win" | "fail" | null>(null);

  // Start session on mount
  useEffect(() => {
    if (!isRegisteredGame(gameType)) return;
    (async () => {
      try {
        const session = await startSession(gameType, offerId, walletAddress ?? "", reward);
        sessionRef.current = session;
      } catch (e) {
        console.error("Failed to start game session:", e);
      }
    })();
  }, [gameType, offerId, walletAddress, reward]);

  const handleWin = useCallback(async () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    const session = sessionRef.current;
    sessionRef.current = null;

    // Update UI state immediately so the game unmounts and offers list updates
    recordGameWon();
    removeAndReplace(offerId);
    setResult("win");

    // Server verification runs in the background — reward is added on response
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

    const session = sessionRef.current;
    sessionRef.current = null;

    setResult("fail");

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
          <GameComponent onSuccess={handleWin} onClose={handleLose} onCancel={handleCancel} />
        </ErrorBoundary>
      )}

      {result && <ResultOverlay result={result} onFinish={handleResultFinish} />}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
