/**
 * Login screen with guest wallet, email, Google, and Apple sign-in options.
 * Uses useAuth context — no prop-drilling needed.
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
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../theme/colors";
import { mediumTap } from "../../utils/haptics";
import { useAuth } from "../../hooks/useAuth";

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
  label, onPress, disabled, glowStyle,
}: {
  label: string; onPress: () => void; disabled?: boolean; glowStyle: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <ReAnimated.View
      style={[
        s.primaryBtnWrap,
        { shadowColor: colors.purple, elevation: 14 },
        glowStyle,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={() => { mediumTap(); onPress(); }}
          onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()}
          disabled={disabled}
          style={[s.primaryBtn, { opacity: disabled ? 0.5 : 1 }]}
        >
          <Text style={s.primaryBtnText}>{label}</Text>
        </Pressable>
      </Animated.View>
    </ReAnimated.View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const {
    isLoggingIn,
    handleGuestLogin,
    handleGoogleLogin,
    handleAppleLogin,
    openEmailAuth,
  } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;

  const glowProgress = useSharedValue(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(ringScale, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 10 }),
    ]).start();

    glowProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600 }),
        withTiming(0, { duration: 1600 }),
      ),
      -1,
    );
  }, [fadeAnim, slideAnim, ringScale, glowProgress]);

  const primaryGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glowProgress.value * 0.45,
    shadowRadius: 8 + glowProgress.value * 14,
  }));

  const heroGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + glowProgress.value * 0.6,
    shadowRadius: 8 + glowProgress.value * 16,
  }));

  return (
    <View style={s.root}>
      {/* Hero */}
      <View style={s.hero}>
        <Animated.View style={[s.ringOuter, { transform: [{ scale: ringScale }] }]}>
          <View style={s.ringInner}>
            <ReAnimated.View style={[{ shadowColor: colors.purple }, heroGlowStyle]}>
              <StarIcon size={38} color={colors.purple} />
            </ReAnimated.View>
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
            <Text style={s.loadingText}>Signing in…</Text>
          </View>
        ) : (
          <>
            <PrimaryBtn label="Sign in as Guest" onPress={handleGuestLogin} glowStyle={primaryGlowStyle} />
            <Pressable onPress={openEmailAuth} style={s.emailBtn}>
              <Text style={s.emailBtnText}>Continue with Email</Text>
            </Pressable>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or sign in with</Text>
              <View style={s.dividerLine} />
            </View>

            <View style={s.socialRow}>
              <SocialBtn icon="G" label="Google" onPress={handleGoogleLogin} disabled={isLoggingIn} />
              <SocialBtn
                icon=""
                label="Apple"
                onPress={handleAppleLogin}
                disabled={isLoggingIn || Platform.OS === "android"}
              />
            </View>
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
