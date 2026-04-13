import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#08091a",
  bgCard: "#0f1128",
  bgDeep: "#080a16",
  border: "rgba(124,92,255,0.22)",
  text: "#e8e8ff",
  muted: "#6066a0",
  mutedLight: "#9096c0",
  purple: "#9b7aff",
  purpleDark: "#5c3fcc",
  cyan: "#3dffe0",
  green: "#39ff9f",
  divider: "rgba(255,255,255,0.06)",
} as const;

// ─── Star icon (SVG-free, pure RN) ────────────────────────────────────────────
function StarIcon({ size = 32, color = C.purple }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.9, color }}>✦</Text>
    </View>
  );
}

// ─── Social button ─────────────────────────────────────────────────────────────
function SocialBtn({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();

  return (
    <Animated.View style={[s.socialBtnWrap, { transform: [{ scale }], opacity: disabled ? 0.45 : 1 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={s.socialBtn}
      >
        <Text style={s.socialIcon}>{icon}</Text>
        <Text style={s.socialLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Primary button ────────────────────────────────────────────────────────────
// Two separate Animated.Views are required:
//   outer → JS driver only  (shadowOpacity, shadowRadius via glowAnim)
//   inner → native driver only (transform scale on press)
// Mixing both on one node causes the Hermes "moved to native" crash.
function PrimaryBtn({
  label,
  onPress,
  disabled,
  glowAnim,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  glowAnim: Animated.Value;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start();

  return (
    <Animated.View
      style={[
        s.primaryBtnWrap,
        {
          shadowColor: C.purple,
          shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.75] }),
          shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 22] }),
          elevation: 14,
        },
      ]}
    >
      {/* Inner: native-driver only — handles press scale */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          style={[s.primaryBtn, { opacity: disabled ? 0.5 : 1 }]}
        >
          <Text style={s.primaryBtnText}>{label}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main login screen ─────────────────────────────────────────────────────────
export default function LoginScreen({
  isLoggingIn,
  isEmailAuthInProgress,
  setIsEmailAuthInProgress,
  setIsLoggingIn,
  setWalletAddress,
  sequenceWaas,
  randomName,
  signInWithGoogle,
  signInWithAppleIOS,
  signInWithAppleAndroid,
}: any) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(ringScale, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 10 }),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handleGuest = async () => {
    setIsLoggingIn(true);
    try {
      const result = await sequenceWaas.signIn({ guest: true }, randomName());
      if (result?.wallet) setWalletAddress(result.wallet);
    } catch (e) {
      console.error("Guest sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithGoogle();
      if (result?.walletAddress) setWalletAddress(result.walletAddress);
    } catch (e) {
      console.error("Google sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleApple = async () => {
    setIsLoggingIn(true);
    try {
      const result =
        Platform.OS === "ios"
          ? await signInWithAppleIOS()
          : await signInWithAppleAndroid();
      if (result?.walletAddress) setWalletAddress(result.walletAddress);
    } catch (e) {
      console.error("Apple sign in failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={s.root}>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <View style={s.hero}>
        {/* Outer ring */}
        <Animated.View style={[s.ringOuter, { transform: [{ scale: ringScale }] }]}>
          <View style={s.ringInner}>
            {/* Logo mark */}
            <Animated.View
              style={{
                shadowColor: C.purple,
                shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 24] }),
              }}
            >
              <StarIcon size={38} color={C.purple} />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Brand name */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: "center" }}
        >
          <Text style={s.brandText}>
            <Text style={{ color: C.purple }}>TAP</Text>
            <Text style={{ color: C.cyan }}>NATION</Text>
          </Text>
          <Text style={s.tagline}>Play. Earn. Own.</Text>
        </Animated.View>
      </View>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[s.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {isLoggingIn ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={C.purple} />
            <Text style={s.loadingText}>Connecting wallet…</Text>
          </View>
        ) : (
          <>
            {/* Primary CTA — Connect Wallet (guest) */}
            <PrimaryBtn
              label="Connect Wallet"
              onPress={handleGuest}
              glowAnim={glowAnim}
            />

            {/* Secondary CTA — Email */}
            <Pressable
              onPress={() => setIsEmailAuthInProgress(true)}
              style={s.emailBtn}
            >
              <Text style={s.emailBtnText}>Continue with Email</Text>
            </Pressable>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or sign in with</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Social buttons */}
            <View style={s.socialRow}>
              <SocialBtn
                icon="G"
                label="Google"
                onPress={handleGoogle}
                disabled={isLoggingIn}
              />
              <SocialBtn
                icon=""
                label="Apple"
                onPress={handleApple}
                disabled={isLoggingIn || Platform.OS === "android"}
              />
            </View>

            {/* Footer note */}
            <Text style={s.footer}>
              Non-custodial · No seed phrases ·{" "}
            </Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Hero
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: "#0c0e22",
  },
  ringOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "rgba(124,92,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(124,92,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 4,
  },
  tagline: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 6,
  },

  // Body
  body: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    gap: 0,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 14,
  },
  loadingText: {
    color: C.muted,
    fontSize: 13,
  },

  // Primary button
  primaryBtnWrap: {
    borderRadius: 16,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: C.purple,
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

  // Email button
  emailBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 22,
  },
  emailBtnText: {
    color: C.mutedLight,
    fontSize: 14,
    fontWeight: "700",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.divider,
  },
  dividerText: {
    fontSize: 11,
    color: C.muted,
  },

  // Social
  socialRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  socialBtnWrap: {
    flex: 1,
  },
  socialBtn: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  socialIcon: {
    fontSize: 15,
    color: C.text,
    fontWeight: "700",
  },
  socialLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
  },

  // Footer
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: C.muted,
    lineHeight: 17,
  },
});
