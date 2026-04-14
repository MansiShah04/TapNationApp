/**
 * Tap-to-Stop mini-game.
 * A moving indicator oscillates across a bar — player must tap STOP
 * when the indicator is inside the green target zone (40%–60%).
 *
 * Uses reanimated for the glow pulse (JS-thread shadow animation)
 * and RN Animated for the oscillating position + button press.
 */
import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../theme/colors";
import { mediumTap, successNotification, errorNotification } from "../../utils/haptics";
import { playTap } from "../../utils/sounds";
import { isInTargetZone } from "../../utils/gameLogic";
import { getGameConfig } from "../../config/gameConfig";
import GameOverlay from "../ui/GameOverlay";

const config = getGameConfig("Tap-to-Stop");

interface TapGameProps {
  onSuccess: () => void;
  onClose: () => void;
  onCancel?: () => void;
  onStart?: () => void;
}

export default function TapGame({ onSuccess, onClose, onCancel, onStart }: TapGameProps) {
  const position = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const directionRef = useRef(1);
  const unmountedRef = useRef(false);

  // Reanimated: glow pulse on UI thread (no JS-thread cost)
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0, { duration: 900 }),
      ),
      -1,
    );
  }, [glowProgress]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.2 + glowProgress.value * 0.4,
    shadowRadius: 4 + glowProgress.value * 10,
  }));

  // Oscillating indicator (still uses RN Animated for stopAnimation callback).
  // Gameplay begins immediately on mount, so notify the parent now — the
  // session's startedAt must reflect the actual play window.
  useEffect(() => {
    unmountedRef.current = false;
    onStart?.();

    let positionAnim: Animated.CompositeAnimation | null = null;
    const loop = () => {
      if (unmountedRef.current) return;
      positionAnim = Animated.timing(position, {
        toValue: directionRef.current === 1 ? 1 : 0,
        duration: config.oscillationDurationMs,
        useNativeDriver: false,
      });
      positionAnim.start(({ finished }) => {
        if (finished && !unmountedRef.current) {
          directionRef.current *= -1;
          loop();
        }
      });
    };
    loop();

    return () => {
      unmountedRef.current = true;
      positionAnim?.stop();
    };
  }, [position, onStart]);

  const handleTap = () => {
    mediumTap();
    playTap();
    position.stopAnimation((value) => {
      if (isInTargetZone(value, config.zoneMin, config.zoneMax)) {
        successNotification();
        onSuccess();
      } else {
        errorNotification();
        onClose();
      }
    });
  };

  return (
    <GameOverlay
      icon="🎯"
      title="Tap-to-Stop"
      subtitle="Stop the indicator in the green zone to win!"
      onClose={onClose}
      onCancel={onCancel}
    >
      {/* Bar */}
      <View style={s.barContainer}>
        <ReAnimated.View
          style={[
            s.barTrack,
            { shadowColor: colors.green },
            glowStyle,
          ]}
        >
          <View style={s.targetZone} />
          <Animated.View
            style={[
              s.indicator,
              {
                left: position.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "96%"],
                }),
              },
            ]}
          />
        </ReAnimated.View>

        <View style={s.barLabels}>
          <Text style={s.barLabel}>0%</Text>
          <Text style={[s.barLabel, { color: colors.green }]}>ZONE</Text>
          <Text style={s.barLabel}>100%</Text>
        </View>
      </View>

      {/* CTA */}
      <Animated.View style={[s.ctaWrap, { transform: [{ scale: btnScale }] }]}>
        <Pressable
          onPress={handleTap}
          onPressIn={() =>
            Animated.spring(btnScale, { toValue: 0.92, useNativeDriver: true, speed: 30 }).start()
          }
          onPressOut={() =>
            Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()
          }
          style={s.ctaBtn}
        >
          <Text style={s.ctaText}>STOP!</Text>
        </Pressable>
      </Animated.View>
    </GameOverlay>
  );
}

const s = StyleSheet.create({
  barContainer: { width: "100%", marginBottom: 24 },
  barTrack: {
    width: "100%",
    height: 28,
    backgroundColor: colors.bg,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  targetZone: {
    position: "absolute",
    left: `${config.zoneMin * 100}%`,
    width: `${(config.zoneMax - config.zoneMin) * 100}%`,
    height: "100%",
    backgroundColor: "rgba(57,255,159,0.2)",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.green,
  },
  indicator: {
    width: 10,
    height: 28,
    backgroundColor: colors.cyan,
    borderRadius: 5,
    position: "absolute",
    shadowColor: colors.cyan,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  barLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ctaWrap: { width: "100%", borderRadius: 14, marginBottom: 12 },
  ctaBtn: {
    backgroundColor: colors.green,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: colors.green,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: {
    color: "#003320",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
