import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    Pressable,
    Animated,
    StyleSheet,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Offer {
    id: string;
    title: string;
    description: string;
    reward: number;           // AVAX amount  e.g. 0.15
    rewardUnit?: string;      // default "AVAX"
    progress: number;         // 0–100
    progressLabel?: string;   // e.g. "38/50"
    icon: string;             // emoji e.g. "🍬"
    tags?: string[];          // e.g. ["🔥 Hot", "AVAX", "Daily"]
    variant?: "hot" | "premium" | "default";
}

interface OfferCardProps {
    offer: Offer;
    index: number;
    onPlay: (offer: Offer) => void;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLORS = {
    bg: "#0f1128",
    bgDeep: "#0a0c1a",
    border: "rgba(124,92,255,0.22)",
    borderHot: "rgba(255,214,61,0.35)",
    borderPremium: "rgba(255,92,248,0.3)",
    text: "#e8e8ff",
    muted: "#6066a0",
    purple: "#9b7aff",
    gold: "#ffd63d",
    cyan: "#3dffe0",
    pink: "#ff5cf8",
    green: "#39ff9f",
    divider: "rgba(255,255,255,0.05)",
} as const;

// ─── Rarity helpers ────────────────────────────────────────────────────────────
const getRarityColor = (reward: number): string => {
    if (reward >= 0.3) return COLORS.gold;
    if (reward >= 0.1) return COLORS.purple;
    return COLORS.cyan;
};

const getCtaStyle = (reward: number) => {
    if (reward >= 0.3) return { bg: COLORS.gold, text: "#1a0a00" };
    if (reward >= 0.1) return { bg: COLORS.purple, text: "#ffffff" };
    return { bg: COLORS.cyan, text: "#003330" };
};

const getBorderColor = (variant: Offer["variant"]): string => {
    if (variant === "hot") return COLORS.borderHot;
    if (variant === "premium") return COLORS.borderPremium;
    return COLORS.border;
};

const getTagStyle = (tag: string) => {
    if (tag.includes("Hot") || tag.includes("🔥"))
        return { bg: "rgba(255,214,61,0.1)", color: COLORS.gold, border: "rgba(255,214,61,0.2)" };
    if (tag === "AVAX")
        return { bg: "rgba(61,255,224,0.1)", color: COLORS.cyan, border: "rgba(61,255,224,0.2)" };
    if (tag === "Daily")
        return { bg: "rgba(155,122,255,0.1)", color: COLORS.purple, border: "rgba(155,122,255,0.2)" };
    if (tag.includes("AI"))
        return { bg: "rgba(255,92,248,0.1)", color: COLORS.pink, border: "rgba(255,92,248,0.2)" };
    return { bg: "rgba(255,255,255,0.06)", color: COLORS.muted, border: "rgba(255,255,255,0.08)" };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function OfferCard({ offer, index, onPlay }: OfferCardProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(32)).current;
    const cardScale = useRef(new Animated.Value(1)).current;
    const btnScale = useRef(new Animated.Value(1)).current;
    const glow = useRef(new Animated.Value(0)).current;
    const ripple = useRef(new Animated.Value(0)).current;

    const rarityColor = getRarityColor(offer.reward);
    const cta = getCtaStyle(offer.reward);
    const borderColor = getBorderColor(offer.variant);
    const rewardUnit = offer.rewardUnit ?? "AVAX";

    // Entry animation — staggered per index
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 480,
                delay: index * 130,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 480,
                delay: index * 130,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Pulsing glow on CTA button
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: false }),
                Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    // ── Press handlers ────────────────────────────────────────────────────────
    const handlePressIn = () => {
        Animated.spring(btnScale, {
            toValue: 0.93,
            useNativeDriver: true,
            speed: 30,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        // Ripple
        Animated.timing(ripple, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
        }).start(() => ripple.setValue(0));

        // Bounce card
        Animated.sequence([
            Animated.spring(cardScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }),
            Animated.spring(cardScale, { toValue: 1.03, useNativeDriver: true, speed: 20 }),
            Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
        ]).start();

        // Reset btn scale
        Animated.spring(btnScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 8,
        }).start();

        onPlay(offer);
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Animated.View
            style={[
                s.wrapper,
                { opacity: fadeAnim, transform: [{ translateY }, { scale: cardScale }] },
            ]}
        >
            {/* Card */}
            <View style={[s.card, { borderColor }]}>

                {/* ── TOP ROW: icon + info ─────────────────────────────────────────── */}
                <View style={s.topRow}>
                    {/* Game icon */}
                    <View style={s.iconWrap}>
                        <Text style={s.iconEmoji}>{offer.icon}</Text>
                    </View>

                    {/* Title + description + tags */}
                    <View style={s.infoBlock}>
                        <Text style={s.offerName} numberOfLines={1}>{offer.title}</Text>
                        <Text style={s.offerDesc} numberOfLines={1}>{offer.description}</Text>

                        {/* Tags */}
                        {offer.tags && offer.tags.length > 0 && (
                            <View style={s.tagsRow}>
                                {offer.tags.map((tag) => {
                                    const ts = getTagStyle(tag);
                                    return (
                                        <View
                                            key={tag}
                                            style={[
                                                s.tag,
                                                { backgroundColor: ts.bg, borderColor: ts.border },
                                            ]}
                                        >
                                            <Text style={[s.tagText, { color: ts.color }]}>{tag}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>

                {/* ── DIVIDER ──────────────────────────────────────────────────────── */}
                <View style={s.divider} />

                {/* ── BOTTOM ROW: reward + progress + CTA ─────────────────────────── */}
                <View style={s.bottomRow}>
                    {/* Reward amount */}
                    <View style={s.rewardBlock}>
                        <Text style={[s.rewardAmount, { color: rarityColor }]}>
                            {offer.reward.toFixed(2)}
                        </Text>
                        <Text style={s.rewardUnit}>{rewardUnit}</Text>
                    </View>

                    {/* Progress bar */}
                    <View style={s.progressBlock}>
                        <View style={s.progressMeta}>
                            <Text style={s.progressLabel}>Progress</Text>
                            {offer.progressLabel && (
                                <Text style={s.progressValue}>{offer.progressLabel}</Text>
                            )}
                        </View>
                        <View style={s.progressTrack}>
                            <View
                                style={[
                                    s.progressFill,
                                    {
                                        width: `${Math.min(100, Math.max(0, offer.progress))}%` as any,
                                        backgroundColor: rarityColor,
                                    },
                                ]}
                            />
                        </View>
                    </View>

                    {/* CTA button */}
                    <Animated.View
                        style={[
                            s.ctaWrap,
                            {
                                shadowColor: rarityColor,
                                shadowOpacity: glow.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.25, 0.8],
                                }),
                                shadowRadius: glow.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [4, 16],
                                }),
                            },
                        ]}
                    >
                        <Pressable
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                            style={s.ctaPressable}
                        >
                            {/* Ripple overlay */}
                            <Animated.View
                                style={[
                                    s.ripple,
                                    {
                                        backgroundColor: rarityColor,
                                        opacity: ripple.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.35, 0],
                                        }),
                                        transform: [
                                            {
                                                scale: ripple.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.3, 2.5],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            />

                            <Animated.View
                                style={[
                                    s.ctaInner,
                                    { backgroundColor: cta.bg, transform: [{ scale: btnScale }] },
                                ]}
                            >
                                <Text style={[s.ctaText, { color: cta.text }]}>Play</Text>
                            </Animated.View>
                        </Pressable>
                    </Animated.View>
                </View>
            </View>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    wrapper: {
        marginBottom: 10,
    },
    card: {
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
    },

    // Top row
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingTop: 13,
        paddingBottom: 10,
    },
    iconWrap: {
        width: 46,
        height: 46,
        borderRadius: 13,
        backgroundColor: COLORS.bgDeep,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    iconEmoji: {
        fontSize: 24,
    },
    infoBlock: {
        flex: 1,
    },
    offerName: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0.2,
    },
    offerDesc: {
        color: COLORS.muted,
        fontSize: 11,
        marginTop: 2,
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 6,
    },
    tag: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    tagText: {
        fontSize: 9,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
    },

    // Bottom row
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
        gap: 10,
    },
    rewardBlock: {
        alignItems: "flex-start",
        flexShrink: 0,
    },
    rewardAmount: {
        fontSize: 19,
        fontWeight: "900",
        lineHeight: 20,
    },
    rewardUnit: {
        color: COLORS.muted,
        fontSize: 10,
        marginTop: 1,
    },

    // Progress
    progressBlock: {
        flex: 1,
    },
    progressMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    progressLabel: {
        color: COLORS.muted,
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    progressValue: {
        color: COLORS.muted,
        fontSize: 9,
        fontWeight: "700",
    },
    progressTrack: {
        height: 3,
        backgroundColor: "rgba(255,255,255,0.07)",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 2,
    },

    // CTA button
    ctaWrap: {
        borderRadius: 11,
        overflow: "hidden",
        flexShrink: 0,
        elevation: 8,
    },
    ctaPressable: {
        borderRadius: 11,
        overflow: "hidden",
    },
    ripple: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
        alignSelf: "center",
        top: -25,
    },
    ctaInner: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },
    ctaText: {
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
});
