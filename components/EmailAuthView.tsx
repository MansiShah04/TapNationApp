import React, { useEffect, useRef, useState } from "react";
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

import { useEmailAuth } from "../hooks/useEmailAuth";
import { randomName } from "../utils/string";

// ─── Design tokens (matching LoginScreen) ────────────────────────────────────
const C = {
  bg: "#08091a",
  bgCard: "#0f1128",
  border: "rgba(124,92,255,0.22)",
  text: "#e8e8ff",
  muted: "#6066a0",
  mutedLight: "#9096c0",
  purple: "#9b7aff",
  purpleDark: "#5c3fcc",
  cyan: "#3dffe0",
  green: "#39ff9f",
  danger: "#ff4d6d",
  divider: "rgba(255,255,255,0.06)",
};

export default function EmailAuthView({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: (walletAddress: string) => void;
}) {
  const [email, setEmail] = useState<string | undefined>();
  const [answer, setAnswer] = useState<string | undefined>();
  const [didSendChallengeAnswer, setDidSendChallengeAnswer] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: false }),
      ])
    ).start();

    return () => {
      setEmail(undefined);
      setAnswer(undefined);
      setDidSendChallengeAnswer(false);
    };
  }, []);

  const {
    inProgress: emailAuthInProgress,
    loading: emailAuthLoading,
    initiateAuth: initiateEmailAuth,
    sendChallengeAnswer,
    cancel: cancelEmailAuth,
  } = useEmailAuth({
    sessionName: randomName(),
    onSuccess: async ({ wallet }) => {
      onSuccess(wallet);
    },
  });

  const onPressIn = () =>
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start();

  // ── Step 1: Enter email ────────────────────────────────────────────────────
  const renderEmailStep = () => (
    <>
      <View style={s.iconWrap}>
        <Text style={s.iconEmoji}>✉️</Text>
      </View>
      <Text style={s.title}>Sign in with Email</Text>
      <Text style={s.subtitle}>Enter your email to receive a verification code</Text>

      <TextInput
        autoComplete="off"
        autoFocus
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={C.muted}
        style={s.input}
      />

      <View style={s.btnRow}>
        <Pressable onPress={onCancel} style={s.secondaryBtn}>
          <Text style={s.secondaryBtnText}>Cancel</Text>
        </Pressable>

        <Animated.View style={[s.primaryBtnWrap, { transform: [{ scale: btnScale }] }]}>
          <Pressable
            onPress={() => {
              if (isValidEmail(email)) initiateEmailAuth(email!);
            }}
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

  // ── Step 2: Enter code ─────────────────────────────────────────────────────
  const renderCodeStep = () => (
    <>
      <View style={s.iconWrap}>
        <Text style={s.iconEmoji}>🔑</Text>
      </View>
      <Text style={s.title}>Enter Verification Code</Text>
      <Text style={s.subtitle}>
        We sent a 6-digit code to{"\n"}
        <Text style={{ color: C.cyan, fontWeight: "700" }}>{email}</Text>
      </Text>

      <TextInput
        autoComplete="off"
        autoFocus
        autoCapitalize="none"
        keyboardType="number-pad"
        maxLength={6}
        value={answer}
        onChangeText={setAnswer}
        placeholder="000000"
        placeholderTextColor={C.muted}
        style={[s.input, s.codeInput]}
      />

      <Animated.View style={[s.primaryBtnWrap, { transform: [{ scale: btnScale }], width: "100%" }]}>
        <Pressable
          onPress={() => {
            if (answer && answer.length === 6) {
              setDidSendChallengeAnswer(true);
              sendChallengeAnswer?.(answer);
            }
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={!answer || answer.length !== 6}
          style={[s.primaryBtn, (!answer || answer.length !== 6) && { opacity: 0.4 }]}
        >
          <Text style={s.primaryBtnText}>Verify</Text>
        </Pressable>
      </Animated.View>
    </>
  );

  // ── Step 3: Loading ────────────────────────────────────────────────────────
  const renderLoading = () => (
    <View style={s.loadingWrap}>
      <ActivityIndicator size="large" color={C.purple} />
      <Text style={s.loadingText}>Connecting wallet…</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={s.overlay}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Outer: JS-driven shadow glow */}
      <Animated.View
        style={{
          width: "88%",
          shadowColor: C.purple,
          shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }),
          shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 18] }),
          elevation: 10,
          borderRadius: 22,
        }}
      >
        {/* Inner: native-driven fade + slide */}
        <Animated.View
          style={[
            s.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {didSendChallengeAnswer
            ? renderLoading()
            : emailAuthInProgress
            ? renderCodeStep()
            : renderEmailStep()}
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function isValidEmail(email?: string): boolean {
  if (!email) return false;
  return /\S+@\S+\.\S+/.test(email);
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 28,
    alignItems: "center",
    elevation: 10,
  },

  // Icon
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

  // Typography
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
    letterSpacing: 0.3,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },

  // Input
  input: {
    width: "100%",
    color: C.text,
    backgroundColor: C.bg,
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

  // Buttons
  btnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  primaryBtnWrap: {
    flex: 1,
    borderRadius: 14,
  },
  primaryBtn: {
    backgroundColor: C.purple,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: C.purple,
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
    borderColor: "rgba(255,77,109,0.25)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,77,109,0.05)",
  },
  secondaryBtnText: {
    color: C.danger,
    fontSize: 14,
    fontWeight: "700",
  },

  // Loading
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 14,
  },
  loadingText: {
    color: C.muted,
    fontSize: 13,
  },
});
