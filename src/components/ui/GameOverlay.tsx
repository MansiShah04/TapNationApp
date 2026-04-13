/**
 * Shared game overlay shell used by all mini-games (TapGame, TapSpeed, AvoidObstacles).
 * Provides the dark overlay, animated card, header, and cancel button.
 */
import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

interface GameOverlayProps {
  icon: string;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function GameOverlay({
  icon,
  title,
  subtitle,
  onClose,
  children,
}: GameOverlayProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  return (
    <View style={s.overlay}>
      <Animated.View
        style={[
          s.card,
          {
            opacity: fadeIn,
            transform: [
              {
                scale: fadeIn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={s.header}>
          <Text style={s.icon}>{icon}</Text>
          <Text style={s.title}>{title}</Text>
        </View>
        <Text style={s.subtitle}>{subtitle}</Text>

        {children}

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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  card: {
    width: "90%",
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  icon: { fontSize: 26 },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 18,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  closeBtnText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});
