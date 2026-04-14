/**
 * Two-step email authentication flow:
 *   Step 1 — Enter email address
 *   Step 2 — Enter 6-digit verification code
 *   Step 3 — Loading spinner while wallet connects
 *
 * Uses separate Animated.Views for JS-driven (shadow) vs native-driven (opacity/translate)
 * to avoid the Hermes "moved to native" crash.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors } from "../../theme/colors";
import { randomName } from "../../utils/string";
import { sequenceWaas } from "../../config/waasSetup";

interface EmailAuthViewProps {
  onCancel: () => void;
  onSuccess: (walletAddress: string) => void;
}

function isValidEmail(email?: string): boolean {
  if (!email) return false;
  return /\S+@\S+\.\S+/.test(email);
}

export default function EmailAuthView({ onCancel, onSuccess }: EmailAuthViewProps) {
  const [email, setEmail] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(() => {
      // Focus after the card finishes animating in — autoFocus alone isn't reliable
      // inside an animated modal on Android.
      inputRef.current?.focus();
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: false }),
      ]),
    ).start();
  }, [fadeAnim, slideAnim, glowAnim]);

  const onPressIn = useCallback(() => {
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  }, [btnScale]);

  const onPressOut = useCallback(() => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
  }, [btnScale]);

  // Skip verification — on Continue, create a guest wallet immediately and land
  // the user on the offer wall. The email is used as the session label only.
  const handleContinue = useCallback(async () => {
    if (!isValidEmail(email)) return;
    setIsConnecting(true);
    try {
      const result = await sequenceWaas.signIn({ guest: true }, `${email} · ${randomName()}`);
      if (result?.wallet) {
        onSuccess(result.wallet);
        return;
      }
    } catch (e) {
      console.error("Email continue (guest) failed:", e);
    }
    setIsConnecting(false);
  }, [email, onSuccess]);

  // ── Steps ──────────────────────────────────────────────────────────────────

  const renderEmailStep = () => (
    <>
      <View style={s.iconWrap}><Text style={s.iconEmoji}>✉️</Text></View>
      <Text style={s.title}>Sign in with Email</Text>
      <Text style={s.subtitle}>Enter your email to continue</Text>
      <TextInput
        ref={inputRef}
        autoComplete="off"
        autoFocus
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        selectionColor={colors.purple}
        cursorColor={colors.purple}
        caretHidden={false}
        style={s.input}
      />
      <View style={s.btnRow}>
        <Pressable onPress={onCancel} style={s.secondaryBtn}>
          <Text style={s.secondaryBtnText}>Cancel</Text>
        </Pressable>
        <Animated.View style={[s.primaryBtnWrap, { transform: [{ scale: btnScale }] }]}>
          <Pressable
            onPress={handleContinue}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={!isValidEmail(email)}
            style={[s.primaryBtn, !isValidEmail(email) && { opacity: 0.4 }]}
          >
            <Text style={s.primaryBtnText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );

  const renderLoading = () => (
    <View style={s.loadingWrap}>
      <ActivityIndicator size="large" color={colors.purple} />
      <Text style={s.loadingText}>Signing in…</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={s.overlay}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Outer: JS-driven shadow glow */}
      <Animated.View
        style={[
          s.glowWrap,
          {
            shadowColor: colors.purple,
            shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }),
            shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 18] }),
          },
        ]}
      >
        {/* Inner: native-driven fade + slide */}
        <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {isConnecting ? renderLoading() : renderEmailStep()}
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.overlayLight,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  glowWrap: {
    width: "88%",
    borderRadius: 22,
    elevation: 10,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(155,122,255,0.25)",
    backgroundColor: "rgba(155,122,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconEmoji: { fontSize: 28 },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 0.3,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  input: {
    width: "100%",
    color: colors.text,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: "rgba(155,122,255,0.18)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 8,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  btnRow: { flexDirection: "row", gap: 10, width: "100%" },
  primaryBtnWrap: { flex: 1, borderRadius: 14 },
  verifyBtnWrap: { width: "100%", borderRadius: 14 },
  primaryBtn: {
    backgroundColor: colors.purple,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: colors.purple,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderDanger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,77,109,0.05)",
  },
  secondaryBtnText: { color: colors.danger, fontSize: 14, fontWeight: "700" },
  loadingWrap: { alignItems: "center", paddingVertical: 28, gap: 14 },
  loadingText: { color: colors.muted, fontSize: 13 },
});
