import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

export interface StatItem {
  value: string | number;
  label: string;
  color: string;
}

interface StatChipsProps {
  items: StatItem[];
}

export default function StatChips({ items }: StatChipsProps) {
  return (
    <View style={s.row}>
      {items.map((item) => (
        <View key={item.label} style={s.chip}>
          <Text style={[s.val, { color: item.color }]}>{item.value}</Text>
          <Text style={s.key}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 14,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: "center",
  },
  val: {
    fontSize: 16,
    fontWeight: "900",
  },
  key: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
});
