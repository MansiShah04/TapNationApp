/**
 * Tap-to-Speed mini-game.
 * Player must tap a circular target at 6+ taps/sec over 5 seconds.
 *
 * Uses reanimated for the glow pulse (shadow on UI thread),
 * RN Animated for tap scale + progress bar.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../theme/colors";
import { lightTap, successNotification, errorNotification } from "../../utils/haptics";
import { playTap } from "../../utils/sounds";
import { calculateTps, isTpsTargetMet } from "../../utils/gameLogic";
import { getGameConfig } from "../../config/gameConfig";
import GameOverlay from "../ui/GameOverlay";
import StatChips from "../ui/StatChips";
import ProgressBar from "../ui/ProgressBar";
import type { StatItem } from "../ui/StatChips";

const config = getGameConfig("Tap-to-Speed");
const GAME_TIME = config.gameDurationSec;
const TARGET_TPS = config.targetTps;

interface TapSpeedGameProps {
  onSuccess: () => void;
  onClose: () => void;
  onCancel?: () => void;
  onStart?: () => void;
}

export default function TapSpeedGame({ onSuccess, onClose, onCancel, onStart }: TapSpeedGameProps) {
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [taps, setTaps] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const tapScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Reanimated: glow pulse on UI thread
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 }),
      ),
      -1,
    );
  }, [glowProgress]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glowProgress.value * 0.5,
    shadowRadius: 6 + glowProgress.value * 14,
  }));

  // Game timer
  useEffect(() => {
    if (!running || timeLeft <= 0) return;

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [running, timeLeft]);

  // Game end check
  useEffect(() => {
    if (timeLeft !== 0 || !running) return;

    setRunning(false);
    const won = isTpsTargetMet(taps, GAME_TIME, TARGET_TPS);
    if (won) {
      successNotification();
      onSuccess();
    } else {
      setFinished(true);
      errorNotification();
    }
  }, [timeLeft, running, taps, onSuccess]);

  // Animate progress bar
  useEffect(() => {
    if (!running) return;
    Animated.timing(progressAnim, {
      toValue: ((GAME_TIME - timeLeft) / GAME_TIME) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, running, progressAnim]);

  const startGame = useCallback(() => {
    setTimeLeft(GAME_TIME);
    setTaps(0);
    setRunning(true);
    setFinished(false);
    progressAnim.setValue(0);
    onStart?.();
  }, [progressAnim, onStart]);

  const handleTap = useCallback(() => {
    if (!running) return;
    lightTap();
    playTap();
    setTaps((t) => t + 1);
    Animated.sequence([
      Animated.spring(tapScale, { toValue: 0.88, useNativeDriver: true, speed: 50 }),
      Animated.spring(tapScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }),
    ]).start();
  }, [running, tapScale]);

  const elapsed = GAME_TIME - timeLeft;
  const tps = calculateTps(taps, elapsed);
  const tpsColor = tps >= TARGET_TPS ? colors.green : tps >= TARGET_TPS * 0.7 ? colors.gold : colors.danger;

  const stats: StatItem[] = [
    { value: `${timeLeft}s`, label: "TIME", color: colors.cyan },
    { value: taps, label: "TAPS", color: colors.gold },
    { value: (running || finished) && elapsed >= 1 ? tps.toFixed(1) : "—", label: "TPS", color: tpsColor },
  ];

  return (
    <GameOverlay
      icon="⚡"
      title="Tap Speed"
      subtitle={`Tap ${TARGET_TPS}+ times/sec to win! You have ${GAME_TIME}s.`}
      onClose={onClose}
      onCancel={onCancel}
    >
      <StatChips items={stats} />

      <ProgressBar
        progress={progressAnim.interpolate({
          inputRange: [0, 100],
          outputRange: ["0%", "100%"],
        })}
      />

      {running ? (
        // Outer: reanimated glow — Inner: RN Animated tap scale
        <ReAnimated.View
          style={[
            s.tapAreaOuter,
            { shadowColor: colors.purple },
            glowStyle,
          ]}
        >
          <Animated.View style={{ transform: [{ scale: tapScale }] }}>
            <Pressable onPress={handleTap} style={s.tapArea}>
              <Text style={s.tapEmoji}>👆</Text>
              <Text style={s.tapText}>TAP!</Text>
            </Pressable>
          </Animated.View>
        </ReAnimated.View>
      ) : finished && tps < TARGET_TPS ? (
        // Failed — show result + play again
        <>
          <View style={s.resultRow}>
            <Text style={[s.resultText, { color: colors.danger }]}>
              {`Need ${TARGET_TPS} TPS — you got ${tps.toFixed(1)}`}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ scale: btnScale }], width: "100%" }}>
            <Pressable
              onPress={startGame}
              onPressIn={() =>
                Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start()
              }
              onPressOut={() =>
                Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()
              }
              style={s.startBtn}
            >
              <Text style={s.startBtnText}>PLAY AGAIN</Text>
            </Pressable>
          </Animated.View>
        </>
      ) : !finished ? (
        // Not started yet
        <Animated.View style={{ transform: [{ scale: btnScale }], width: "100%" }}>
          <Pressable
            onPress={startGame}
            onPressIn={() =>
              Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start()
            }
            onPressOut={() =>
              Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()
            }
            style={s.startBtn}
          >
            <Text style={s.startBtnText}>START</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </GameOverlay>
  );
}

const s = StyleSheet.create({
  tapAreaOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 16,
    elevation: 10,
  },
  tapArea: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  tapEmoji: { fontSize: 36, marginBottom: 4 },
  tapText: {
    color: colors.purple,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  startBtn: {
    backgroundColor: colors.purple,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: colors.purple,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  resultRow: { marginBottom: 8 },
  resultText: { fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
});
