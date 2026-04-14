export const colors = {

  bg: "#0a0c1a",
  bgCard: "#0f1128",
  bgDeep: "#080a16",
  bgHero: "#0c0e22",

  border: "rgba(155,122,255,0.22)",
  borderStrong: "rgba(155,122,255,0.4)",
  borderHot: "rgba(255,214,61,0.35)",
  borderPremium: "rgba(255,92,248,0.3)",
  borderSubtle: "rgba(255,255,255,0.08)",
  borderDanger: "rgba(255,77,109,0.25)",

  text: "#e8e8ff",
  muted: "#6066a0",
  mutedLight: "#9096c0",

  purple: "#9b7aff",
  purpleDark: "#5c3fcc",
  cyan: "#3dffe0",
  green: "#39ff9f",
  gold: "#ffd63d",
  pink: "#ff5cf8",
  danger: "#ff4d6d",

  divider: "rgba(255,255,255,0.05)",
  overlay: "rgba(0,0,0,0.88)",
  overlayLight: "rgba(0,0,0,0.85)",
} as const;

export type ColorToken = keyof typeof colors;
