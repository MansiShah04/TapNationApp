/**
 * Stack Game (Perfect Alignment).
 *
 * A block slides back and forth at the top of the stack. Player taps DROP
 * to land it. Misalignment trims the block to the overlapping footprint,
 * shrinking the next moving block. Miss the stack entirely and you lose.
 * Stack the target number of blocks to win.
 *
 * The moving block is driven by Animated.Value (no per-frame React renders)
 * so the DROP button stays instantly responsive.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Dimensions } from "react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../theme/colors";
import { lightTap, mediumTap, successNotification, errorNotification } from "../../utils/haptics";
import { playTap, playFail } from "../../utils/sounds";
import { computeDropResult, type StackBlock } from "../../utils/gameLogic";
import { getGameConfig } from "../../config/gameConfig";
import GameOverlay from "../ui/GameOverlay";
import StatChips from "../ui/StatChips";
import ProgressBar from "../ui/ProgressBar";
import type { StatItem } from "../ui/StatChips";

const cfg = getGameConfig("Stack-Align");
const SCREEN_W = Dimensions.get("window").width;
const GAME_AREA_W = SCREEN_W * 0.82;
const BLOCK_HEIGHT = cfg.blockHeight;
const GAME_AREA_H = BLOCK_HEIGHT * (cfg.targetStacks + 1);

const BLOCK_COLORS = [colors.purple, colors.cyan, colors.green, colors.gold, colors.pink];

function pxPerTickToDurationMs(pxPerTick: number, distance: number): number {
  const pxPerMs = pxPerTick / cfg.tickIntervalMs;
  return Math.max(250, distance / pxPerMs);
}

interface StackGameProps {
  onSuccess: () => void;
  onClose: () => void;
  onCancel?: () => void;
}

export default function StackGame({ onSuccess, onClose, onCancel }: StackGameProps) {
  
  //#region declaration
  const baseX = (GAME_AREA_W - cfg.initialBlockWidth) / 2;
  const initialStack: StackBlock[] = [{ x: baseX, width: cfg.initialBlockWidth }];

  const [stack, setStack] = useState<StackBlock[]>(initialStack);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState<"won" | "lost" | null>(null);
  const [perfectFlash, setPerfectFlash] = useState(false);
  const [movingWidth, setMovingWidth] = useState(cfg.initialBlockWidth);

  const movingXAnim = useRef(new Animated.Value(0)).current;
  const movingWidthRef = useRef(cfg.initialBlockWidth);
  const directionRef = useRef(1);
  const speedRef = useRef(cfg.initialSpeed);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const unmountedRef = useRef(false);
  const stackRef = useRef<StackBlock[]>(initialStack);
  const resolvedRef = useRef(false); 

  const btnScale = useRef(new Animated.Value(1)).current;
  //#endregion

  const glowProgress = useSharedValue(0);
  useEffect(() => {
    glowProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0, { duration: 700 }),
      ),
      -1,
    );
  }, [glowProgress]);
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.25 + glowProgress.value * 0.55,
    shadowRadius: 4 + glowProgress.value * 14,
  }));

  const startOscillation = useCallback(() => {
    if (unmountedRef.current) return;
    const maxX = GAME_AREA_W - movingWidthRef.current;
    const duration = pxPerTickToDurationMs(speedRef.current, maxX);

    const step = () => {
      if (unmountedRef.current) return;
      const target = directionRef.current === 1 ? maxX : 0;
      animationRef.current = Animated.timing(movingXAnim, {
        toValue: target,
        duration,
        useNativeDriver: false, // `left` is not supported by native driver
      });
      animationRef.current.start(({ finished: animFinished }) => {
        if (animFinished && !unmountedRef.current) {
          directionRef.current *= -1;
          step();
        }
      });
    };
    step();
  }, [movingXAnim]);

  const stopOscillation = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      animationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (running) {
      startOscillation();
    } else {
      stopOscillation();
    }
  }, [running, startOscillation, stopOscillation]);

  const startGame = useCallback(() => {
    stackRef.current = initialStack;
    setStack(initialStack);
    movingWidthRef.current = cfg.initialBlockWidth;
    setMovingWidth(cfg.initialBlockWidth);
    directionRef.current = 1;
    speedRef.current = cfg.initialSpeed;
    movingXAnim.setValue(0);
    resolvedRef.current = false;
    setFinished(null);
    setRunning(true);
  }, [movingXAnim]); // eslint-disable-line react-hooks/exhaustive-deps

  //#region  drop button code
  const handleDrop = useCallback(() => {
    if (!running || resolvedRef.current) return;

    mediumTap();
    playTap();

    // Snap current animated position
    stopOscillation();
    movingXAnim.stopAnimation((currentX: number) => {
      if (unmountedRef.current || resolvedRef.current) return;

      const prevStack = stackRef.current;
      const last = prevStack[prevStack.length - 1];
      const result = computeDropResult(
        last,
        currentX,
        movingWidthRef.current,
        cfg.perfectTolerance,
      );

      // ── Missed entirely ─────────────────────────────────────────────────
      if (!result.placed) {
        resolvedRef.current = true;
        setRunning(false);
        errorNotification();
        playFail();
        setFinished("lost");
        setTimeout(() => {
          if (!unmountedRef.current) onClose();
        }, 500);
        return;
      }

      // ── Perfect feedback ────────────────────────────────────────────────
      if (result.perfect) {
        successNotification();
        setPerfectFlash(true);
        setTimeout(() => {
          if (!unmountedRef.current) setPerfectFlash(false);
        }, 300);
      } else {
        lightTap();
      }

      const newStack = [...prevStack, result.placed];
      stackRef.current = newStack;
      setStack(newStack);

      // ── Win ─────────────────────────────────────────────────────────────
      if (newStack.length - 1 >= cfg.targetStacks) {
        resolvedRef.current = true;
        setRunning(false);
        successNotification();
        setFinished("won");
        setTimeout(() => {
          if (!unmountedRef.current) onSuccess();
        }, 300);
        return;
      }

      // ── Prep next moving block ──────────────────────────────────────────
      movingWidthRef.current = result.placed.width;
      setMovingWidth(result.placed.width);
      directionRef.current = 1;
      speedRef.current = cfg.initialSpeed + (newStack.length - 1) * cfg.speedIncrement;
      movingXAnim.setValue(0);
      // Restart oscillation on next tick so the new width is in place
      setTimeout(() => {
        if (!unmountedRef.current && !resolvedRef.current) startOscillation();
      }, 0);
    });
  }, [running, onClose, onSuccess, movingXAnim, stopOscillation, startOscillation]);

  //#endregion
  const placedCount = stack.length - 1; 
  const progress = Math.min(100, (placedCount / cfg.targetStacks) * 100);

  const stats: StatItem[] = [
    { value: `${placedCount} / ${cfg.targetStacks}`, label: "STACKED", color: colors.cyan },
    { value: Math.round(speedRef.current * 10) / 10, label: "SPEED", color: colors.gold },
    { value: `${Math.round(progress)}%`, label: "DONE", color: colors.green },
  ];

  return (
    <GameOverlay
      icon="🧱"
      title="Stack Align"
      subtitle={`Stack ${cfg.targetStacks} blocks — tap DROP when aligned!`}
      onClose={onClose}
      onCancel={onCancel}
    >
      <StatChips items={stats} />
      <ProgressBar progress={progress} color={colors.green} />

      <View style={s.gameArea}>
        {perfectFlash && <View style={s.perfectFlash} pointerEvents="none" />}

        {stack.map((block, i) => {
          const tint = BLOCK_COLORS[i % BLOCK_COLORS.length];
          return (
            <View
              key={`${i}-${block.x}-${block.width}`}
              style={[
                s.block,
                {
                  left: block.x,
                  bottom: i * BLOCK_HEIGHT,
                  width: block.width,
                  backgroundColor: `${tint}33`,
                  borderColor: tint,
                },
              ]}
            />
          );
        })}

        {running && (
          <ReAnimated.View
            style={[
              s.movingBlockGlow,
              { shadowColor: colors.gold },
              glowStyle,
              {
                bottom: stack.length * BLOCK_HEIGHT,
                width: movingWidth,
                height: BLOCK_HEIGHT,
              },
            ]}
            pointerEvents="none"
          >
            <Animated.View
              style={[
                s.movingBlock,
                {
                  left: movingXAnim,
                  width: movingWidth,
                },
              ]}
            />
          </ReAnimated.View>
        )}
      </View>

      {running ? (
        <Animated.View style={{ transform: [{ scale: btnScale }], width: "100%" }}>
          <Pressable
            onPress={handleDrop}
            onPressIn={() =>
              Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start()
            }
            onPressOut={() =>
              Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()
            }
            style={s.dropBtn}
          >
            <Text style={s.dropBtnText}>DROP!</Text>
          </Pressable>
        </Animated.View>
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
            <Text style={s.startBtnText}>
              {finished === "lost" ? "TRY AGAIN" : "START"}
            </Text>
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
    position: "relative",
  },
  block: {
    position: "absolute",
    height: BLOCK_HEIGHT,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  movingBlockGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    elevation: 8,
  },
  movingBlock: {
    position: "absolute",
    height: BLOCK_HEIGHT,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}44`,
  },
  perfectFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(57,255,159,0.12)",
    zIndex: 1,
  },
  dropBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
  },
  dropBtnText: {
    color: "#1a0a00",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
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
