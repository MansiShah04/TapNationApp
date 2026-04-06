import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  StyleSheet,
} from "react-native";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#0a0c1a",
  bg2: "#0f1128",
  bg3: "#080a16",
  border: "rgba(155,122,255,0.22)",
  borderStrong: "rgba(155,122,255,0.4)",
  text: "#e8e8ff",
  muted: "#6066a0",
  purple: "#9b7aff",
  gold: "#ffd63d",
  cyan: "#3dffe0",
  pink: "#ff5cf8",
  green: "#39ff9f",
  divider: "rgba(255,255,255,0.05)",
  danger: "#ff4d6d",
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface OfferwallScreenProps {
  walletAddress: string | null;
  balance: number;                  // AVAX balance as float e.g. 4.82
  offers: any[];
  isStreaming: boolean;
  isGenerating: boolean;            // true while 3rd offer hasn't arrived yet
  claimedToday: number;
  activeOffersCount: number;
  onRefreshBalance: () => void;
  onSignOut: () => void;
  renderOfferCard: (offer: any, index: number) => React.ReactNode;
}

export default function OfferwallScreen({
  walletAddress,
  balance,
  offers,
  isStreaming,
  isGenerating,
  claimedToday,
  activeOffersCount,
  onRefreshBalance,
  onSignOut,
  renderOfferCard,
}: OfferwallScreenProps) {
  // ── Animated values ─────────────────────────────────────────────────────────
  const balanceScale = useRef(new Animated.Value(1)).current;
  const genDot1 = useRef(new Animated.Value(0.3)).current;
  const genDot2 = useRef(new Animated.Value(0.3)).current;
  const genDot3 = useRef(new Animated.Value(0.3)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-12)).current;
  const balanceFade = useRef(new Animated.Value(0)).current;

  // ── Entry animation ──────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(balanceFade, { toValue: 1, duration: 600, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Balance bump on change ───────────────────────────────────────────────────
  useEffect(() => {
    Animated.sequence([
      Animated.spring(balanceScale, { toValue: 1.12, useNativeDriver: true, speed: 30 }),
      Animated.spring(balanceScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  }, [balance]);

  // ── Generating dots pulse ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isGenerating) return;
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    pulse(genDot1, 0);
    pulse(genDot2, 160);
    pulse(genDot3, 320);
  }, [isGenerating]);

  if (!walletAddress) return null;

  const shortAddr = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  const balanceUsd = (balance * 20.48).toFixed(2); // mock price

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* ── STICKY HEADER ────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          s.stickyHeader,
          { opacity: headerFade, transform: [{ translateY: headerSlide }] },
        ]}
      >
        {/* Brand */}
        <Text style={s.brand}>
          <Text style={{ color: C.purple }}>TAP</Text>
          <Text style={{ color: C.cyan }}>NATION</Text>
        </Text>

        {/* Wallet pill */}
        <View style={s.walletPill}>
          <View style={s.walletDot} />
          <Text style={s.walletAddr}>{shortAddr}</Text>
        </View>
      </Animated.View>

      {/* ── SCROLLABLE BODY ──────────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── BALANCE CARD ───────────────────────────────────────────────────── */}
        <Animated.View style={[s.balanceCard, { opacity: balanceFade }]}>
          {/* Left: balance */}
          <View style={s.balanceLeft}>
            <Text style={s.balanceLabel}>AVAX Balance</Text>
            <Animated.Text
              style={[s.balanceAmount, { transform: [{ scale: balanceScale }] }]}
            >
              {balance}
            </Animated.Text>
            <Text style={s.balanceSub}>≈ ${balanceUsd} USD</Text>
          </View>

          {/* Right: today badge */}
          <View style={s.balanceRight}>
            <View style={s.todayBadge}>
              <Text style={s.todayBadgeText}>+0.25 today</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── STAT CHIPS ─────────────────────────────────────────────────────── */}
        <View style={s.chipsRow}>
          <View style={s.chip}>
            <Text style={[s.chipVal, { color: C.cyan }]}>{claimedToday}</Text>
            <Text style={s.chipKey}>Claimed</Text>
          </View>
          <View style={s.chip}>
            <Text style={[s.chipVal, { color: C.gold }]}>{activeOffersCount}</Text>
            <Text style={s.chipKey}>Active</Text>
          </View>
          <View style={s.chip}>
            <Text style={[s.chipVal, { color: C.pink }]}>Lvl 7</Text>
            <Text style={s.chipKey}>Rank</Text>
          </View>
        </View>

        {/* ── SECTION HEADER ─────────────────────────────────────────────────── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Live Offers</Text>
          <View style={s.aiBadge}>
            <View style={s.aiBadgeDot} />
            <Text style={s.aiBadgeText}>AI · Live</Text>
          </View>
        </View>

        {/* ── OFFER CARDS ────────────────────────────────────────────────────── */}
        {offers.map((offer, index) => renderOfferCard(offer, index))}

        {/* ── AI GENERATING PLACEHOLDER ──────────────────────────────────────── */}
        {isGenerating && (
          <View style={s.generatingCard}>
            <View style={s.genDotsRow}>
              <Animated.View style={[s.genDot, { opacity: genDot1 }]} />
              <Animated.View style={[s.genDot, { opacity: genDot2 }]} />
              <Animated.View style={[s.genDot, { opacity: genDot3 }]} />
            </View>
            <Text style={s.genText}>
              <Text style={{ color: C.purple, fontWeight: "700" }}>AI generating</Text>
              {" "}next offer…
            </Text>
          </View>
        )}

        {/* ── SIGN OUT ───────────────────────────────────────────────────────── */}
        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [s.signOutBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={s.signOutText}>Sign out</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brand: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  walletPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(155,122,255,0.1)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  walletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  walletAddr: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Balance card
  balanceCard: {
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: C.border,
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
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: "900",
    color: C.gold,
    lineHeight: 36,
  },
  balanceSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 3,
  },
  balanceRight: {
    alignItems: "flex-end",
  },
  todayBadge: {
    backgroundColor: "rgba(57,255,159,0.1)",
    borderWidth: 1,
    borderColor: "rgba(57,255,159,0.2)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: C.green,
  },

  // Stat chips
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    flex: 1,
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  chipVal: {
    fontSize: 14,
    fontWeight: "900",
  },
  chipKey: {
    fontSize: 9,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Section header
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: C.text,
    letterSpacing: 0.3,
  },
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
  aiBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.pink,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.pink,
    letterSpacing: 0.3,
  },

  // AI generating card
  generatingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: "rgba(155,122,255,0.18)",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  genDotsRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  genDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.purple,
  },
  genText: {
    fontSize: 12,
    color: C.muted,
  },

  // Sign out
  signOutBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.25)",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "rgba(255,77,109,0.05)",
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.danger,
    letterSpacing: 0.5,
  },
});
