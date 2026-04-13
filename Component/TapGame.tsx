import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

// ─── Design tokens (matching OfferWall / OfferCard) ──────────────────────────
const C = {
  bg: "#0a0c1a",
  bg2: "#0f1128",
  border: "rgba(155,122,255,0.22)",
  text: "#e8e8ff",
  muted: "#6066a0",
  purple: "#9b7aff",
  cyan: "#3dffe0",
  green: "#39ff9f",
  danger: "#ff4d6d",
};

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

export default function TapGame({ onSuccess, onClose }: Props) {
  const position = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  let direction = 1;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Glow pulse on target zone
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();

    const loop = () => {
      Animated.timing(position, {
        toValue: direction === 1 ? 1 : 0,
        duration: 2000,
        useNativeDriver: false,
      }).start(() => {
        direction *= -1;
        loop();
      });
    };
    loop();
  }, []);

  const handleTap = () => {
    position.stopAnimation((value) => {
      if (value > 0.4 && value < 0.6) {
        onSuccess();
      } else {
        onClose();
      }
    });
  };

  const onPressIn = () =>
    Animated.spring(btnScale, { toValue: 0.92, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start();

  const barWidth = width * 0.75;

  return (
    <View style={s.overlay}>
      <Animated.View style={[s.card, { opacity: fadeIn, transform: [{ scale: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.icon}>🎯</Text>
          <Text style={s.title}>Tap-to-Stop</Text>
        </View>
        <Text style={s.subtitle}>Stop the indicator in the green zone to win!</Text>

        {/* Bar */}
        <View style={s.barContainer}>
          <Animated.View
            style={[
              s.barTrack,
              {
                shadowColor: C.green,
                shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
                shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [4, 14] }),
              },
            ]}
          >
            {/* Target zone */}
            <View style={[s.targetZone, { left: "40%", width: "20%" }]} />

            {/* Moving indicator */}
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
          </Animated.View>

          {/* Labels */}
          <View style={s.barLabels}>
            <Text style={s.barLabel}>0%</Text>
            <Text style={[s.barLabel, { color: C.green }]}>ZONE</Text>
            <Text style={s.barLabel}>100%</Text>
          </View>
        </View>

        {/* CTA */}
        <Animated.View style={[s.ctaWrap, { transform: [{ scale: btnScale }] }]}>
          <Pressable
            onPress={handleTap}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={s.ctaBtn}
          >
            <Text style={s.ctaText}>STOP!</Text>
          </Pressable>
        </Animated.View>

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
    marginBottom: 28,
    textAlign: "center",
  },

  // Bar
  barContainer: { width: "100%", marginBottom: 28 },
  barTrack: {
    width: "100%",
    height: 28,
    backgroundColor: C.bg,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  targetZone: {
    position: "absolute",
    height: "100%",
    backgroundColor: "rgba(57,255,159,0.2)",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: C.green,
  },
  indicator: {
    width: 10,
    height: 28,
    backgroundColor: C.cyan,
    borderRadius: 5,
    position: "absolute",
    shadowColor: C.cyan,
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
    color: C.muted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // CTA
  ctaWrap: { width: "100%", borderRadius: 14, marginBottom: 12 },
  ctaBtn: {
    backgroundColor: C.green,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: C.green,
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
