import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";

// ─── Design tokens (matching OfferWall / OfferCard) ──────────────────────────
const C = {
  bg: "#0a0c1a",
  bg2: "#0f1128",
  bg3: "#080a16",
  border: "rgba(155,122,255,0.22)",
  text: "#e8e8ff",
  muted: "#6066a0",
  purple: "#9b7aff",
  cyan: "#3dffe0",
  gold: "#ffd63d",
  green: "#39ff9f",
  pink: "#ff5cf8",
  danger: "#ff4d6d",
};

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

export default function TapSpeedGame({ onSuccess, onClose }: Props) {
  const GAME_TIME = 5;
  const TARGET_TPS = 6;

  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [taps, setTaps] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const tapScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    let timer: any;
    if (running && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    if (timeLeft === 0 && running) {
      setRunning(false);
      setFinished(true);
      const tps = taps / GAME_TIME;
      setTimeout(() => {
        if (tps >= TARGET_TPS) {
          onSuccess();
        } else {
          onClose();
        }
      }, 600);
    }
    return () => clearTimeout(timer);
  }, [running, timeLeft]);

  // Animate progress bar
  useEffect(() => {
    if (running) {
      const progress = ((GAME_TIME - timeLeft) / GAME_TIME) * 100;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, running]);

  const startGame = () => {
    setTimeLeft(GAME_TIME);
    setTaps(0);
    setRunning(true);
    setFinished(false);
    progressAnim.setValue(0);
  };

  const handleTap = () => {
    if (!running) return;
    setTaps((prev) => prev + 1);
    Animated.sequence([
      Animated.spring(tapScale, { toValue: 0.88, useNativeDriver: true, speed: 50 }),
      Animated.spring(tapScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }),
    ]).start();
  };

  const tps = running ? taps / Math.max(GAME_TIME - timeLeft, 1) : taps / GAME_TIME;
  const tpsColor = tps >= TARGET_TPS ? C.green : tps >= TARGET_TPS * 0.7 ? C.gold : C.danger;

  return (
    <View style={s.overlay}>
      <Animated.View style={[s.card, { opacity: fadeIn, transform: [{ scale: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.icon}>⚡</Text>
          <Text style={s.title}>Tap Speed</Text>
        </View>
        <Text style={s.subtitle}>
          Tap {TARGET_TPS}+ times/sec to win! You have {GAME_TIME}s.
        </Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statChip}>
            <Text style={[s.statVal, { color: C.cyan }]}>{timeLeft}s</Text>
            <Text style={s.statKey}>TIME</Text>
          </View>
          <View style={s.statChip}>
            <Text style={[s.statVal, { color: C.gold }]}>{taps}</Text>
            <Text style={s.statKey}>TAPS</Text>
          </View>
          <View style={s.statChip}>
            <Text style={[s.statVal, { color: tpsColor }]}>
              {running || finished ? tps.toFixed(1) : "—"}
            </Text>
            <Text style={s.statKey}>TPS</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <Animated.View
            style={[
              s.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* Tap area or start button */}
        {running ? (
          <Animated.View
            style={[
              s.tapAreaWrap,
              {
                shadowColor: C.purple,
                shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
                shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [6, 20] }),
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: tapScale }] }}>
              <Pressable onPress={handleTap} style={s.tapArea}>
                <Text style={s.tapEmoji}>👆</Text>
                <Text style={s.tapText}>TAP!</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : (
          <Animated.View style={{ transform: [{ scale: btnScale }], width: "100%" }}>
            <Pressable
              onPress={startGame}
              onPressIn={() => Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start()}
              onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()}
              style={s.startBtn}
            >
              <Text style={s.startBtnText}>{finished ? "PLAY AGAIN" : "START"}</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Result */}
        {finished && (
          <View style={s.resultRow}>
            <Text style={[s.resultText, { color: tps >= TARGET_TPS ? C.green : C.danger }]}>
              {tps >= TARGET_TPS ? "Target reached!" : `Need ${TARGET_TPS} TPS`}
            </Text>
          </View>
        )}

        {/* Close */}
        <Pressable onPress={onClose} style={s.closeBtn}>
          <Text style={s.closeBtnText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  card: {
    width: "88%",
    backgroundColor: C.bg2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  icon: { fontSize: 28 },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: C.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 18,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 16,
  },
  statChip: {
    flex: 1,
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  statVal: {
    fontSize: 18,
    fontWeight: "900",
  },
  statKey: {
    fontSize: 8,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },

  // Progress
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 22,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.purple,
    borderRadius: 2,
  },

  // Tap area
  tapAreaWrap: {
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
    backgroundColor: C.bg,
    borderWidth: 2,
    borderColor: C.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  tapEmoji: { fontSize: 36, marginBottom: 4 },
  tapText: {
    color: C.purple,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // Start button
  startBtn: {
    backgroundColor: C.purple,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: C.purple,
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

  // Result
  resultRow: {
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Close
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  closeBtnText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});
