import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";

export default function OfferCard({ offer, index, onClaim }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  // 🎨 Dynamic rarity color
  const getColor = () => {
    if (offer.reward > 50) return "#facc15"; // gold
    if (offer.reward > 20) return "#22c55e"; // green
    return "#3b82f6"; // blue
  };

  const rarityColor = getColor();

  // ✨ Glow animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // 🎬 Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    onClaim(offer.reward);
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          backgroundColor: "#0b1220",
          borderRadius: 24,
          padding: 18,
          marginVertical: 14,

          // 🎮 rarity glow
          shadowColor: rarityColor,
          shadowOpacity: 0.9,
          shadowRadius: 25,
          elevation: 20,
        }}
      >
        {/* 🔥 Badge */}
        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: rarityColor,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "bold" }}>
            {offer.reward > 50 ? "EPIC" : "HOT"}
          </Text>
        </View>

        {/* 🎯 Title Row */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 24, marginRight: 10 }}>🎯</Text>
          <Text
            style={{
              color: "#fff",
              fontWeight: "bold",
              fontSize: 15,
            }}
          >
            {offer.title}
          </Text>
        </View>

        {/* 💰 Reward Highlight */}
        <View
          style={{
            marginTop: 14,
            backgroundColor: "#020617",
            padding: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: rarityColor,
              fontSize: 32,
              fontWeight: "900",
            }}
          >
            +{offer.reward}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 12 }}>
            AVAX REWARD
          </Text>
        </View>

        {/* 📊 Fake Progress */}
        <View style={{ marginTop: 14 }}>
          <View
            style={{
              height: 6,
              backgroundColor: "#1f2937",
              borderRadius: 10,
            }}
          >
            <View
              style={{
                width: `${40 + (offer.reward % 60)}%`,
                height: 6,
                backgroundColor: rarityColor,
                borderRadius: 10,
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 10,
              color: "#9ca3af",
              marginTop: 4,
            }}
          >
            Progress ongoing...
          </Text>
        </View>

        {/* ⚡ CLAIM BUTTON */}
        <Animated.View
          style={{
            marginTop: 16,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: rarityColor,
            shadowOpacity: glow.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            shadowRadius: glow.interpolate({
              inputRange: [0, 1],
              outputRange: [6, 25],
            }),
            elevation: 20,
          }}
        >
          <Pressable
            onPressIn={() => {
              Animated.spring(scale, {
                toValue: 0.92,
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.parallel([
                Animated.sequence([
                  Animated.spring(scale, { toValue: 1.25, useNativeDriver: true }),
                  Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
                ]),
                Animated.timing(ripple, {
                  toValue: 1,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]).start(() => ripple.setValue(0));

              handlePress();
            }}
            style={{ borderRadius: 20, overflow: "hidden" }}
          >
            {/* 🌊 Ripple */}
            <Animated.View
              style={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: rarityColor,
                opacity: ripple.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 0],
                }),
                transform: [
                  {
                    scale: ripple.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 2],
                    }),
                  },
                ],
                alignSelf: "center",
              }}
            />

            {/* 🎮 Button */}
            <Animated.View
              style={{
                transform: [{ scale }],
                backgroundColor: rarityColor,
                paddingVertical: 18,
                alignItems: "center",
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: "#000",
                  fontSize: 16,
                  fontWeight: "900",
                  letterSpacing: 1.5,
                }}
              >
                ⚡ CLAIM MISSION
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}