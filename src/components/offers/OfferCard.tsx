/**
 * Individual offer card with reward display, progress bar, tags, and a Play CTA.
 * Entry animation is staggered by the `index` prop for the streaming-in effect.
 *
 * Uses reanimated for the CTA glow pulse (shadow on UI thread).
 */
import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../theme/colors";
import { mediumTap } from "../../utils/haptics";
import type { Offer } from "../../types/offer";

interface OfferCardProps {
  offer: Offer;
  index: number;
  onPlay: (offer: Offer) => void;
}

// ─── Rarity / variant helpers ────────────────────────────────────────────────

const getRarityColor = (reward: number): string => {
  if (reward >= 0.3) return colors.gold;
  if (reward >= 0.1) return colors.purple;
  return colors.cyan;
};

const getCtaStyle = (reward: number) => {
  if (reward >= 0.3) return { bg: colors.gold, text: "#1a0a00" };
  if (reward >= 0.1) return { bg: colors.purple, text: "#ffffff" };
  return { bg: colors.cyan, text: "#003330" };
};

const getBorderColor = (variant: Offer["variant"]): string => {
  if (variant === "hot") return colors.borderHot;
  if (variant === "premium") return colors.borderPremium;
  return colors.border;
};

const TAG_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  hot: { bg: "rgba(255,214,61,0.1)", color: colors.gold, border: "rgba(255,214,61,0.2)" },
  avax: { bg: "rgba(61,255,224,0.1)", color: colors.cyan, border: "rgba(61,255,224,0.2)" },
  daily: { bg: "rgba(155,122,255,0.1)", color: colors.purple, border: "rgba(155,122,255,0.2)" },
  ai: { bg: "rgba(255,92,248,0.1)", color: colors.pink, border: "rgba(255,92,248,0.2)" },
  default: { bg: "rgba(255,255,255,0.06)", color: colors.muted, border: colors.borderSubtle },
};

const getTagStyle = (tag: string) => {
  const lower = tag.toLowerCase();
  if (lower.includes("hot") || lower.includes("🔥")) return TAG_STYLES.hot;
  if (lower === "avax") return TAG_STYLES.avax;
  if (lower === "daily") return TAG_STYLES.daily;
  if (lower.includes("ai")) return TAG_STYLES.ai;
  return TAG_STYLES.default;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function OfferCard({ offer, index, onPlay }: OfferCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(32)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  const rarityColor = getRarityColor(offer.reward);
  const cta = getCtaStyle(offer.reward);
  const borderColor = getBorderColor(offer.variant);
  const rewardUnit = offer.rewardUnit ?? "AVAX";

  // Reanimated: CTA glow on UI thread
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400 }),
        withTiming(0, { duration: 1400 }),
      ),
      -1,
    );
  }, [glowProgress]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.25 + glowProgress.value * 0.55,
    shadowRadius: 4 + glowProgress.value * 12,
  }));

  // Staggered entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        delay: index * 130,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 480,
        delay: index * 130,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY, index]);

  const handlePressIn = useCallback(() => {
    Animated.spring(btnScale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }, [btnScale]);

  const handlePressOut = useCallback(() => {
    mediumTap();

    // Ripple
    Animated.timing(ripple, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start(() => ripple.setValue(0));

    // Card bounce
    Animated.sequence([
      Animated.spring(cardScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }),
      Animated.spring(cardScale, { toValue: 1.03, useNativeDriver: true, speed: 20 }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();

    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();

    onPlay(offer);
  }, [ripple, cardScale, btnScale, onPlay, offer]);

  return (
    <Animated.View
      style={[
        s.wrapper,
        { opacity: fadeAnim, transform: [{ translateY }, { scale: cardScale }] },
      ]}
    >
      <View style={[s.card, { borderColor }]}>
        {/* Top: icon + info + Play CTA */}
        <View style={s.topRow}>
          <View style={s.iconWrap}>
            <Text style={s.iconEmoji}>{offer.icon}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.offerName} numberOfLines={1}>{offer.title}</Text>
            <Text style={s.offerDesc} numberOfLines={1}>{offer.description}</Text>
            {offer.tags && offer.tags.length > 0 && (
              <View style={s.tagsRow}>
                {offer.tags.map((tag) => {
                  const ts = getTagStyle(tag);
                  return (
                    <View key={tag} style={[s.tag, { backgroundColor: ts.bg, borderColor: ts.border }]}>
                      <Text style={[s.tagText, { color: ts.color }]}>{tag}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* CTA — outer: reanimated glow, inner: RN Animated scale */}
          <ReAnimated.View
            style={[
              s.ctaWrap,
              { shadowColor: rarityColor },
              glowStyle,
            ]}
          >
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={s.ctaPressable}
            >
              <Animated.View
                style={[
                  s.ripple,
                  {
                    backgroundColor: rarityColor,
                    opacity: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
                    transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.5] }) }],
                  },
                ]}
              />
              <Animated.View
                style={[s.ctaInner, { backgroundColor: cta.bg, transform: [{ scale: btnScale }] }]}
              >
                <Text style={[s.ctaText, { color: cta.text }]}>Play</Text>
              </Animated.View>
            </Pressable>
          </ReAnimated.View>
        </View>

        <View style={s.divider} />

        {/* Bottom: reward + progress */}
        <View style={s.bottomRow}>
          <View style={s.rewardBlock}>
            <Text style={[s.rewardAmount, { color: rarityColor }]}>
              {offer.reward.toFixed(2)}
            </Text>
            <Text style={s.rewardUnit}>{rewardUnit}</Text>
          </View>

          <View style={s.progressBlock}>
            <View style={s.progressMeta}>
              <Text style={s.progressLabel}>Progress</Text>
              {offer.progressLabel && (
                <Text style={s.progressValue}>{offer.progressLabel}</Text>
              )}
            </View>
            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${Math.min(100, Math.max(0, offer.progress))}%` as any,
                    backgroundColor: rarityColor,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 10 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.bgDeep,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 24 },
  infoBlock: { flex: 1 },
  offerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  offerDesc: { color: colors.muted, fontSize: 11, marginTop: 2 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  tag: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: colors.divider },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  rewardBlock: { alignItems: "flex-start", flexShrink: 0 },
  rewardAmount: { fontSize: 19, fontWeight: "900", lineHeight: 20 },
  rewardUnit: { color: colors.muted, fontSize: 10, marginTop: 1 },
  progressBlock: { flex: 1 },
  progressMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  progressLabel: { color: colors.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.4 },
  progressValue: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  ctaWrap: { borderRadius: 11, overflow: "hidden", flexShrink: 0, elevation: 8 },
  ctaPressable: { borderRadius: 11, overflow: "hidden" },
  ripple: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    top: -25,
  },
  ctaInner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase" },
});
