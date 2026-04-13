/**
 * Login screen with guest wallet, email, Google, and Apple sign-in options.
 * Uses the app-wide color tokens and separated Animated.View layers.
 */
import React, { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { colors } from "../../theme/colors";
import type { SequenceWaaS } from "@0xsequence/waas";

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarIcon({ size = 32, color = colors.purple }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.9, color }}>✦</Text>
    </View>
  );
}

function SocialBtn({
  label, icon, onPress, disabled,
}: {
  label: string; icon: string; onPress: () => void; disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[s.socialBtnWrap, { transform: [{ scale }], opacity: disabled ? 0.45 : 1 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start()}
        disabled={disabled}
        style={s.socialBtn}
      >
        <Text style={s.socialIcon}>{icon}</Text>
        <Text style={s.socialLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function PrimaryBtn({
  label, onPress, disabled, glowAnim,
}: {
  label: string; onPress: () => void; disabled?: boolean; glowAnim: Animated.Value;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    // Outer: JS-driven shadow glow
    <Animated.View
      style={[
        s.primaryBtnWrap,
        {
          shadowColor: colors.purple,
          shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.75] }),
          shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 22] }),
          elevation: 14,
        },
      ]}
    >
      {/* Inner: native-driven press scale */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()}
          disabled={disabled}
          style={[s.primaryBtn, { opacity: disabled ? 0.5 : 1 }]}
        >
          <Text style={s.primaryBtnText}>{label}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface LoginScreenProps {
  isLoggingIn: boolean;
  setIsEmailAuthInProgress: (v: boolean) => void;
  setIsLoggingIn: (v: boolean) => void;
  setWalletAddress: (address: string) => void;
  sequenceWaas: SequenceWaaS;
  randomName: () => string;
  signInWithGoogle: () => Promise<{ walletAddress?: string } | undefined>;
  signInWithApple: () => Promise<{ walletAddress?: string } | undefined>;
}

export default function LoginScreen({
  isLoggingIn,
  setIsEmailAuthInProgress,
  setIsLoggingIn,
  setWalletAddress,
  sequenceWaas,
  randomName,
  signInWithGoogle,
  signInWithApple,
}: LoginScreenProps) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(ringScale, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 10 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: false }),
      ]),
    ).start();
  }, [fadeAnim, slideAnim, ringScale, glowAnim]);

  const handleGuest = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      const result = await sequenceWaas.signIn({ guest: true }, randomName());
      if (result?.wallet) setWalletAddress(result.wallet);
    } catch (e) {
      console.error("Guest sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  }, [sequenceWaas, randomName, setIsLoggingIn, setWalletAddress]);

  const handleGoogle = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithGoogle();
      if (result?.walletAddress) setWalletAddress(result.walletAddress);
    } catch (e) {
      console.error("Google sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  }, [signInWithGoogle, setIsLoggingIn, setWalletAddress]);

  const handleApple = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithApple();
      if (result?.walletAddress) setWalletAddress(result.walletAddress);
    } catch (e) {
      console.error("Apple sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  }, [signInWithApple, setIsLoggingIn, setWalletAddress]);

  return (
    <View style={s.root}>
      {/* Hero */}
      <View style={s.hero}>
        <Animated.View style={[s.ringOuter, { transform: [{ scale: ringScale }] }]}>
          <View style={s.ringInner}>
            <Animated.View
              style={{
                shadowColor: colors.purple,
                shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 24] }),
              }}
            >
              <StarIcon size={38} color={colors.purple} />
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: "center" }}>
          <Text style={s.brandText}>
            <Text style={{ color: colors.purple }}>TAP</Text>
            <Text style={{ color: colors.cyan }}>NATION</Text>
          </Text>
          <Text style={s.tagline}>Play. Earn. Own.</Text>
        </Animated.View>
      </View>

      {/* Body */}
      <Animated.View style={[s.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {isLoggingIn ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.purple} />
            <Text style={s.loadingText}>Connecting wallet…</Text>
          </View>
        ) : (
          <>
            <PrimaryBtn label="Connect Wallet" onPress={handleGuest} glowAnim={glowAnim} />
            <Pressable onPress={() => setIsEmailAuthInProgress(true)} style={s.emailBtn}>
              <Text style={s.emailBtnText}>Continue with Email</Text>
            </Pressable>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or sign in with</Text>
              <View style={s.dividerLine} />
            </View>

            <View style={s.socialRow}>
              <SocialBtn icon="G" label="Google" onPress={handleGoogle} disabled={isLoggingIn} />
              <SocialBtn
                icon=""
                label="Apple"
                onPress={handleApple}
                disabled={isLoggingIn || Platform.OS === "android"}
              />
            </View>

            <Text style={s.footer}>Non-custodial · No seed phrases</Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgHero,
  },
  ringOuter: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2,
    borderColor: "rgba(124,92,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(124,92,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontSize: 26, fontWeight: "900", letterSpacing: 2, marginTop: 4 },
  tagline: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 6,
  },

  body: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36 },
  loadingWrap: { alignItems: "center", paddingVertical: 32, gap: 14 },
  loadingText: { color: colors.muted, fontSize: 13 },

  primaryBtnWrap: { borderRadius: 16, marginBottom: 12 },
  primaryBtn: {
    backgroundColor: colors.purple,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  emailBtn: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 22,
  },
  emailBtnText: { color: colors.mutedLight, fontSize: 14, fontWeight: "700" },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { fontSize: 11, color: colors.muted },

  socialRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  socialBtnWrap: { flex: 1 },
  socialBtn: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  socialIcon: { fontSize: 15, color: colors.text, fontWeight: "700" },
  socialLabel: { fontSize: 13, fontWeight: "700", color: colors.text },

  footer: { textAlign: "center", fontSize: 11, color: colors.muted, lineHeight: 17 },
});
