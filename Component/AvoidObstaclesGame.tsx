import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

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

const GAME_AREA_W = SCREEN_W * 0.84;
const GAME_AREA_H = 420;
const PLAYER_SIZE = 44;
const OBSTACLE_SIZE = 36;

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

export default function AvoidObstaclesGame({ onSuccess, onClose }: Props) {
  const GAME_TIME = 10;

  const [playerX, setPlayerX] = useState(GAME_AREA_W / 2 - PLAYER_SIZE / 2);
  const [obstacles, setObstacles] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const leftScale = useRef(new Animated.Value(1)).current;
  const rightScale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const gameLoop = useRef<any>(null);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const startGame = () => {
    setPlayerX(GAME_AREA_W / 2 - PLAYER_SIZE / 2);
    setObstacles([]);
    setTimeLeft(GAME_TIME);
    setRunning(true);
  };

  const moveLeft = () => {
    if (!running) return;
    Animated.sequence([
      Animated.spring(leftScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(leftScale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 8 }),
    ]).start();
    setPlayerX((prev) => Math.max(0, prev - 44));
  };

  const moveRight = () => {
    if (!running) return;
    Animated.sequence([
      Animated.spring(rightScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(rightScale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 8 }),
    ]).start();
    setPlayerX((prev) => Math.min(GAME_AREA_W - PLAYER_SIZE, prev + 44));
  };

  // Game loop
  useEffect(() => {
    if (!running) return;
    gameLoop.current = setInterval(() => {
      setObstacles((prev) =>
        prev
          .map((obs) => ({ ...obs, y: obs.y + 10 }))
          .filter((obs) => obs.y < GAME_AREA_H)
      );
      if (Math.random() < 0.3) {
        setObstacles((prev) => [
          ...prev,
          { x: Math.random() * (GAME_AREA_W - OBSTACLE_SIZE), y: 0, id: Date.now() },
        ]);
      }
      setObstacles((prev) => {
        for (const obs of prev) {
          if (
            obs.y + OBSTACLE_SIZE > GAME_AREA_H - PLAYER_SIZE - 8 &&
            obs.x < playerX + PLAYER_SIZE &&
            obs.x + OBSTACLE_SIZE > playerX
          ) {
            setRunning(false);
            setTimeout(() => onClose(), 300);
            return [];
          }
        }
        return prev;
      });
    }, 50);
    return () => clearInterval(gameLoop.current);
  }, [running, playerX]);

  // Timer
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setTimeout(() => onSuccess(), 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const progress = ((GAME_TIME - timeLeft) / GAME_TIME) * 100;

  return (
    <View style={s.overlay}>
      <Animated.View style={[s.card, { opacity: fadeIn, transform: [{ scale: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.icon}>🏃</Text>
          <Text style={s.title}>Avoid Obstacles</Text>
        </View>
        <Text style={s.subtitle}>Survive {GAME_TIME} seconds to win!</Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statChip}>
            <Text style={[s.statVal, { color: timeLeft <= 3 ? C.danger : C.cyan }]}>{timeLeft}s</Text>
            <Text style={s.statKey}>TIME</Text>
          </View>
          <View style={s.statChip}>
            <Text style={[s.statVal, { color: C.gold }]}>{obstacles.length}</Text>
            <Text style={s.statKey}>ACTIVE</Text>
          </View>
          <View style={s.statChip}>
            <Text style={[s.statVal, { color: C.green }]}>{Math.round(progress)}%</Text>
            <Text style={s.statKey}>DONE</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress}%` as any }]} />
        </View>

        {/* Game Area */}
        <Animated.View
          style={[
            s.gameArea,
            {
              shadowColor: C.purple,
              shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }),
              shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [4, 14] }),
            },
          ]}
        >
          {/* Grid lines for depth */}
          {[0.25, 0.5, 0.75].map((p) => (
            <View key={p} style={[s.gridLine, { top: `${p * 100}%` as any }]} />
          ))}

          {/* Player */}
          <View style={[s.player, { left: playerX }]}>
            <Text style={{ fontSize: 22 }}>🛡️</Text>
          </View>

          {/* Obstacles */}
          {obstacles.map((obs) => (
            <View key={obs.id} style={[s.obstacle, { left: obs.x, top: obs.y }]}>
              <Text style={{ fontSize: 18 }}>💥</Text>
            </View>
          ))}

          {/* Start overlay */}
          {!running && timeLeft === GAME_TIME && (
            <View style={s.gameOverlay}>
              <Text style={s.gameOverlayText}>Ready?</Text>
            </View>
          )}
        </Animated.View>

        {/* Controls or Start */}
        {running ? (
          <View style={s.controlsRow}>
            <Animated.View style={[s.controlWrap, { transform: [{ scale: leftScale }] }]}>
              <Pressable onPress={moveLeft} style={s.controlBtn}>
                <Text style={s.controlText}>◀</Text>
              </Pressable>
            </Animated.View>
            <Animated.View style={[s.controlWrap, { transform: [{ scale: rightScale }] }]}>
              <Pressable onPress={moveRight} style={s.controlBtn}>
                <Text style={s.controlText}>▶</Text>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: btnScale }], width: "100%" }}>
            <Pressable
              onPress={startGame}
              onPressIn={() => Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start()}
              onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()}
              style={s.startBtn}
            >
              <Text style={s.startBtnText}>START</Text>
            </Pressable>
          </Animated.View>
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
    width: "92%",
    backgroundColor: C.bg2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  icon: { fontSize: 26 },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 14,
    textAlign: "center",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  statVal: { fontSize: 16, fontWeight: "900" },
  statKey: {
    fontSize: 8,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 1,
  },

  // Progress
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.green,
    borderRadius: 2,
  },

  // Game area
  gameArea: {
    width: GAME_AREA_W,
    height: GAME_AREA_H,
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: 14,
    elevation: 6,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(155,122,255,0.06)",
  },
  player: {
    position: "absolute",
    bottom: 8,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: 10,
    backgroundColor: "rgba(155,122,255,0.18)",
    borderWidth: 1.5,
    borderColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  obstacle: {
    position: "absolute",
    width: OBSTACLE_SIZE,
    height: OBSTACLE_SIZE,
    borderRadius: 8,
    backgroundColor: "rgba(255,77,109,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  gameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,12,26,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverlayText: {
    color: C.muted,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Controls
  controlsRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginBottom: 10,
  },
  controlWrap: { flex: 1 },
  controlBtn: {
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  controlText: {
    fontSize: 22,
    color: C.purple,
    fontWeight: "900",
  },

  // Start
  startBtn: {
    backgroundColor: C.purple,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: C.purple,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Close
  closeBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  closeBtnText: { color: C.muted, fontSize: 13, fontWeight: "600" },
});
