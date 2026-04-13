/**
 * Modal warning displayed when a user tries to sign in with an email
 * already linked to a different auth method (Google, Apple, PlayFab).
 */
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { EmailConflictInfo, IdentityType } from "@0xsequence/waas";
import { colors } from "../../theme/colors";

interface EmailConflictWarningViewProps {
  info?: EmailConflictInfo;
  onCancel?: () => void;
  onConfirm?: () => void;
}

const ISSUER_LABELS: Record<string, string> = {
  "https://accounts.google.com": "Google login",
  "https://appleid.apple.com": "Apple login",
};

function getAccountTypeText(info: EmailConflictInfo): string {
  if (info.type === IdentityType.PlayFab) return "PlayFab login";
  if (info.type === IdentityType.Email) return "Email login";
  if (info.type === IdentityType.OIDC) {
    return ISSUER_LABELS[info.issuer] ?? "Unknown account type";
  }
  return "Unknown account type";
}

export default function EmailConflictWarningView({
  info,
  onCancel,
  onConfirm,
}: EmailConflictWarningViewProps) {
  if (!info) return null;

  const accType = getAccountTypeText(info);

  return (
    <View style={s.overlay}>
      <View style={s.card}>
        <View style={s.iconWrap}><Text style={s.iconEmoji}>⚠️</Text></View>

        <Text style={s.title}>Email Already in Use</Text>
        <Text style={s.subtitle}>
          <Text style={{ color: colors.cyan, fontWeight: "700" }}>{info.email}</Text>
          {" "}is already linked to a{" "}
          <Text style={{ color: colors.gold, fontWeight: "700" }}>{accType}</Text>.
        </Text>

        <View style={s.btnRow}>
          <Pressable onPress={onCancel} style={s.cancelBtn}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={onConfirm} style={s.confirmBtn}>
            <Text style={s.confirmBtnText}>Create New</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.overlayLight,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 201,
  },
  card: {
    width: "85%",
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,214,61,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,214,61,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconEmoji: { fontSize: 24 },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderDanger,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "rgba(255,77,109,0.05)",
  },
  cancelBtnText: { color: colors.danger, fontSize: 13, fontWeight: "700" },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.purple,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
});
