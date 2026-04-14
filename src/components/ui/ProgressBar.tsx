import React from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

interface ProgressBarProps {
  /** 0–100 percentage, or an Animated interpolation for animated width */
  progress: number | Animated.AnimatedInterpolation<string>;
  color?: string;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  color = colors.purple,
  style,
}: ProgressBarProps) {
  const isAnimated = typeof progress !== "number";
  const widthStyle = isAnimated
    ? { width: progress as Animated.AnimatedInterpolation<string> }
    : { width: `${Math.min(100, Math.max(0, progress))}%` as any };

  return (
    <View style={[s.track, style]}>
      <Animated.View style={[s.fill, { backgroundColor: color }, widthStyle]} />
    </View>
  );
}

const s = StyleSheet.create({
  track: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 14,
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});
