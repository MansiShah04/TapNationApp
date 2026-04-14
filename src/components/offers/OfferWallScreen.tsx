/**
 * Main offer wall screen showing wallet balance, stats, and streaming offer cards.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, ScrollView, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { formatWei } from "../../hooks/useWallet";
import { mediumTap, successNotification } from "../../utils/haptics";
import type { Offer } from "../../types/offer";

interface OfferWallScreenProps {
  walletAddress: string;
  balanceWei: bigint;
  offers: Offer[];
  isGenerating: boolean;
  claimedToday: number;
  gamesPlayed: number;
  gamesWon: number;
  onSignOut: () => void;
  onClaim: () => void;
  renderOfferCard: (offer: Offer, index: number) => React.ReactNode;
}

const AVAX_USD_RATE = 20.48;
const CLAIM_THRESHOLD_USD = 5;
// Progress bar dimensions are used to position the coin indicator
const PROGRESS_TRACK_HEIGHT = 14;
const COIN_SIZE = 26;

export default function OfferWallScreen({
  walletAddress,
  balanceWei,
  offers,
  isGenerating,
  claimedToday,
  gamesPlayed,
  gamesWon,
  onSignOut,
  onClaim,
  renderOfferCard,
}: OfferWallScreenProps) {
  const balanceScale = useRef(new Animated.Value(1)).current;
  const genDot1 = useRef(new Animated.Value(0.3)).current;
  const genDot2 = useRef(new Animated.Value(0.3)).current;
  const genDot3 = useRef(new Animated.Value(0.3)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-12)).current;
  const balanceFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const claimBtnScale = useRef(new Animated.Value(1)).current;

  // Credited animation
  const creditOpacity = useRef(new Animated.Value(0)).current;
  const creditY = useRef(new Animated.Value(20)).current;
  const [creditAmount, setCreditAmount] = useState("");
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(balanceFade, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [headerFade, headerSlide, balanceFade]);

  // Balance bump
  useEffect(() => {
    Animated.sequence([
      Animated.spring(balanceScale, { toValue: 1.12, useNativeDriver: true, speed: 30 }),
      Animated.spring(balanceScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  }, [balanceWei, balanceScale]);

  // Generating dots pulse
  useEffect(() => {
    if (!isGenerating) return;
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
    pulse(genDot1, 0);
    pulse(genDot2, 160);
    pulse(genDot3, 320);
  }, [isGenerating, genDot1, genDot2, genDot3]);

  const handleSignOut = useCallback(() => onSignOut(), [onSignOut]);

  const shortAddr = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  const balanceDisplay = formatWei(balanceWei);
  const balanceUsdNum = parseFloat(balanceDisplay) * AVAX_USD_RATE;
  const balanceUsd = balanceUsdNum.toFixed(2);
  const canClaim = balanceUsdNum >= CLAIM_THRESHOLD_USD;
  const progressPct = Math.min(100, (balanceUsdNum / CLAIM_THRESHOLD_USD) * 100);

  // Animate the progress bar to the current percentage
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progressPct,
      useNativeDriver: false,
      speed: 12,
      bounciness: 6,
    }).start();
  }, [progressPct, progressAnim]);

  const handleClaim = useCallback(() => {
    if (!canClaim) return;
    mediumTap();
    successNotification();
    const amount = balanceDisplay;
    setCreditAmount(amount);

    
    creditOpacity.setValue(0);
    creditY.setValue(20);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(creditOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(creditOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(creditY, { toValue: -40, duration: 1450, useNativeDriver: true }),
    ]).start();

    onClaim();
  }, [canClaim, balanceDisplay, creditOpacity, creditY, onClaim]);

  return (
    <View style={s.root}>
      {/* Sticky header */}
      <Animated.View
        style={[s.stickyHeader, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
      >
        <Text style={s.brand}>
          <Text style={{ color: colors.purple }}>TAP</Text>
          <Text style={{ color: colors.cyan }}>NATION</Text>
        </Text>
        <View style={s.walletPill}>
          <View style={s.walletDot} />
          <Text style={s.walletAddr}>{shortAddr}</Text>
        </View>
      </Animated.View>

      {/* Scrollable body */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance card */}
        <Animated.View style={[s.balanceCard, { opacity: balanceFade }]}>
          <View style={s.balanceLeft}>
            <Text style={s.balanceLabel}>Balance</Text>
            <Animated.Text style={[s.balanceAmount, { transform: [{ scale: balanceScale }] }]}>
              {balanceDisplay}
            </Animated.Text>
            <Text style={s.balanceSub}>≈ ${balanceUsd} USD</Text>

            {/* Fly-up "credited" toast */}
            <Animated.View
              style={[
                s.creditToast,
                { opacity: creditOpacity, transform: [{ translateY: creditY }] },
              ]}
              pointerEvents="none"
            >
              <Text style={s.creditToastText}>
                +{creditAmount} amount credited to wallet 🎉
              </Text>
            </Animated.View>
          </View>
          <View style={s.balanceRight}>
            <Animated.View style={{ transform: [{ scale: claimBtnScale }] }}>
              <Pressable
                onPress={handleClaim}
                disabled={!canClaim}
                onPressIn={() => {
                  if (!canClaim) return;
                  Animated.spring(claimBtnScale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start();
                }}
                onPressOut={() => {
                  if (!canClaim) return;
                  Animated.spring(claimBtnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
                }}
                style={[s.claimBtn, !canClaim && s.claimBtnDisabled]}
              >
                <Text style={[s.claimBtnText, !canClaim && s.claimBtnTextDisabled]}>
                  CLAIM
                </Text>
              </Pressable>
            </Animated.View>
            <Text style={s.claimHint}>
              {canClaim ? "Ready to claim" : `$${(CLAIM_THRESHOLD_USD - balanceUsdNum).toFixed(2)} to unlock`}
            </Text>
          </View>
        </Animated.View>

        {/* Claim progress bar: $0 → $5 USD */}
        <View style={s.claimProgressWrap}>
          <View style={s.claimProgressMeta}>
            <Text style={s.claimProgressLabel}>Claim progress</Text>
            <Text style={s.claimProgressValue}>
              ${balanceUsd} / ${CLAIM_THRESHOLD_USD.toFixed(2)}
            </Text>
          </View>
          <View
            style={s.claimProgressTrack}
            onLayout={(e) => setProgressTrackWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[
                s.claimProgressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
            {/* Coin indicator sliding along the track */}
            {progressTrackWidth > 0 && (
              <Animated.View
                style={[
                  s.coinIndicator,
                  {
                    left: progressAnim.interpolate({
                      inputRange: [0, 100],
                      // Keep the coin fully inside the track: 0% → left edge, 100% → right edge
                      outputRange: [0, Math.max(0, progressTrackWidth - COIN_SIZE)],
                      extrapolate: "clamp",
                    }),
                  },
                ]}
              >
                <Text style={s.coinEmoji}>🪙</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Stat chips */}
        <View style={s.chipsRow}>
          <View style={s.chip}>
            <Text style={[s.chipVal, { color: colors.cyan }]}>{claimedToday}</Text>
            <Text style={s.chipKey}>Claimed</Text>
          </View>
          <View style={s.chip}>
            <Text style={[s.chipVal, { color: colors.gold }]}>{gamesPlayed}</Text>
            <Text style={s.chipKey}>Played</Text>
          </View>
          <View style={s.chip}>
            <Text style={[s.chipVal, { color: colors.pink }]}>{gamesWon}</Text>
            <Text style={s.chipKey}>Won</Text>
          </View>
        </View>

        {/* Section header */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Live Offers</Text>
          <View style={s.aiBadge}>
            <View style={s.aiBadgeDot} />
            <Text style={s.aiBadgeText}>AI · Live</Text>
          </View>
        </View>

        {/* Offer cards */}
        {offers.map((offer, index) => renderOfferCard(offer, index))}

        {/* Generating / loading more */}
        {isGenerating && (
          <View style={s.generatingCard}>
            <View style={s.genDotsRow}>
              <Animated.View style={[s.genDot, { opacity: genDot1 }]} />
              <Animated.View style={[s.genDot, { opacity: genDot2 }]} />
              <Animated.View style={[s.genDot, { opacity: genDot3 }]} />
            </View>
            <Text style={s.genText}>
              <Text style={{ color: colors.purple, fontWeight: "700" }}>AI generating</Text>
              {" "}next offer…
            </Text>
          </View>
        )}

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [s.signOutBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={s.signOutText}>Sign out</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { fontSize: 17, fontWeight: "900", letterSpacing: 1.5 },
  walletPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(155,122,255,0.1)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  walletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  walletAddr: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  balanceCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  balanceLeft: { flex: 1 },
  balanceLabel: {
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceAmount: { fontSize: 34, fontWeight: "900", color: colors.gold, lineHeight: 36 },
  balanceSub: { fontSize: 11, color: colors.muted, marginTop: 3 },
  balanceRight: { alignItems: "flex-end" },
  todayBadge: {
    backgroundColor: "rgba(57,255,159,0.1)",
    borderWidth: 1,
    borderColor: "rgba(57,255,159,0.2)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  todayBadgeText: { fontSize: 11, fontWeight: "900", color: colors.green },

  claimBtn: {
    backgroundColor: colors.green,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: colors.green,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  claimBtnDisabled: {
    backgroundColor: "rgba(155,122,255,0.12)",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowOpacity: 0,
    elevation: 0,
  },
  claimBtnText: {
    color: "#003320",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  claimBtnTextDisabled: {
    color: colors.muted,
  },
  claimHint: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 4,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "right",
  },
  creditToast: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  creditToastText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  claimProgressWrap: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  claimProgressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  claimProgressLabel: {
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  claimProgressValue: {
    fontSize: 11,
    color: colors.gold,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  claimProgressTrack: {
    height: PROGRESS_TRACK_HEIGHT,
    backgroundColor: colors.bgDeep,
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: "visible",
    justifyContent: "center",
  },
  claimProgressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.gold,
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
  },
  coinIndicator: {
    position: "absolute",
    top: (PROGRESS_TRACK_HEIGHT - COIN_SIZE) / 2,
    width: COIN_SIZE,
    height: COIN_SIZE,
    borderRadius: COIN_SIZE / 2,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  coinEmoji: { fontSize: 14 },

  chipsRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  chip: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  chipVal: { fontSize: 14, fontWeight: "900" },
  chipKey: {
    fontSize: 9,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: "900", color: colors.text, letterSpacing: 0.3 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,92,248,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,92,248,0.22)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  aiBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.pink },
  aiBadgeText: { fontSize: 10, fontWeight: "700", color: colors.pink, letterSpacing: 0.3 },

  generatingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: "rgba(155,122,255,0.18)",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  genDotsRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  genDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.purple },
  genText: { fontSize: 12, color: colors.muted },

  signOutBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.borderDanger,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "rgba(255,77,109,0.05)",
  },
  signOutText: { fontSize: 13, fontWeight: "700", color: colors.danger, letterSpacing: 0.5 },
});
