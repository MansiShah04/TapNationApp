/**
 * Avoid-Obstacles mini-game.
 * Player dodges falling obstacles for 10 seconds using left/right controls.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Dimensions } from "react-native";
import { colors } from "../../theme/colors";
import GameOverlay from "../ui/GameOverlay";
import StatChips from "../ui/StatChips";
import ProgressBar from "../ui/ProgressBar";
import type { StatItem } from "../ui/StatChips";

const SCREEN_W = Dimensions.get("window").width;
const GAME_AREA_W = SCREEN_W * 0.82;
const GAME_AREA_H = 400;
const PLAYER_SIZE = 44;
const OBSTACLE_SIZE = 36;
const GAME_TIME = 10;
const MOVE_STEP = 44;

interface Obstacle {
  id: number;
  x: number;
  y: number;
}

interface AvoidObstaclesGameProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AvoidObstaclesGame({ onSuccess, onClose }: AvoidObstaclesGameProps) {
  const [playerX, setPlayerX] = useState(GAME_AREA_W / 2 - PLAYER_SIZE / 2);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  const btnScale = useRef(new Animated.Value(1)).current;
  const leftScale = useRef(new Animated.Value(1)).current;
  const rightScale = useRef(new Animated.Value(1)).current;
  const gameLoop = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    setPlayerX(GAME_AREA_W / 2 - PLAYER_SIZE / 2);
    setObstacles([]);
    setTimeLeft(GAME_TIME);
    setRunning(true);
  }, []);

  const animateControl = useCallback((scale: Animated.Value) => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 8 }),
    ]).start();
  }, []);

  const moveLeft = useCallback(() => {
    if (!running) return;
    animateControl(leftScale);
    setPlayerX((prev) => Math.max(0, prev - MOVE_STEP));
  }, [running, animateControl, leftScale]);

  const moveRight = useCallback(() => {
    if (!running) return;
    animateControl(rightScale);
    setPlayerX((prev) => Math.min(GAME_AREA_W - PLAYER_SIZE, prev + MOVE_STEP));
  }, [running, animateControl, rightScale]);

  // Game loop: move obstacles, spawn new ones, check collisions
  useEffect(() => {
    if (!running) return;

    gameLoop.current = setInterval(() => {
      setObstacles((prev) => {
        const moved = prev
          .map((obs) => ({ ...obs, y: obs.y + 10 }))
          .filter((obs) => obs.y < GAME_AREA_H);

        // Collision check against current playerX via closure
        for (const obs of moved) {
          if (
            obs.y + OBSTACLE_SIZE > GAME_AREA_H - PLAYER_SIZE - 8 &&
            obs.x < playerX + PLAYER_SIZE &&
            obs.x + OBSTACLE_SIZE > playerX
          ) {
            setRunning(false);
            setTimeout(onClose, 300);
            return [];
          }
        }

        // Spawn new obstacle (~30% chance per tick)
        if (Math.random() < 0.3) {
          moved.push({
            x: Math.random() * (GAME_AREA_W - OBSTACLE_SIZE),
            y: 0,
            id: Date.now(),
          });
        }

        return moved;
      });
    }, 50);

    return () => {
      if (gameLoop.current) clearInterval(gameLoop.current);
    };
  }, [running, playerX, onClose]);

  // Countdown timer
  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setTimeout(onSuccess, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, onSuccess]);

  const progress = ((GAME_TIME - timeLeft) / GAME_TIME) * 100;

  const stats: StatItem[] = [
    { value: `${timeLeft}s`, label: "TIME", color: timeLeft <= 3 ? colors.danger : colors.cyan },
    { value: obstacles.length, label: "ACTIVE", color: colors.gold },
    { value: `${Math.round(progress)}%`, label: "DONE", color: colors.green },
  ];

  return (
    <GameOverlay
      icon="🏃"
      title="Avoid Obstacles"
      subtitle={`Survive ${GAME_TIME} seconds to win!`}
      onClose={onClose}
    >
      <StatChips items={stats} />
      <ProgressBar progress={progress} color={colors.green} />

      {/* Game area */}
      <View style={s.gameArea}>
        {[0.25, 0.5, 0.75].map((p) => (
          <View key={p} style={[s.gridLine, { top: `${p * 100}%` as any }]} />
        ))}

        <View style={[s.player, { left: playerX }]}>
          <Text style={s.playerEmoji}>🛡️</Text>
        </View>

        {obstacles.map((obs) => (
          <View key={obs.id} style={[s.obstacle, { left: obs.x, top: obs.y }]}>
            <Text style={s.obstacleEmoji}>💥</Text>
          </View>
        ))}

        {!running && timeLeft === GAME_TIME && (
          <View style={s.gameOverlay}>
            <Text style={s.gameOverlayText}>Ready?</Text>
          </View>
        )}
      </View>

      {/* Controls */}
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
      )}
    </GameOverlay>
  );
}

const s = StyleSheet.create({
  gameArea: {
    width: GAME_AREA_W,
    height: GAME_AREA_H,
    backgroundColor: colors.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: "hidden",
    marginBottom: 14,
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
    borderColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  playerEmoji: { fontSize: 22 },
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
  obstacleEmoji: { fontSize: 18 },
  gameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,12,26,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverlayText: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginBottom: 10,
  },
  controlWrap: { flex: 1 },
  controlBtn: {
    backgroundColor: colors.bgDeep,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  controlText: { fontSize: 22, color: colors.purple, fontWeight: "900" },
  startBtn: {
    backgroundColor: colors.purple,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: colors.purple,
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
});
