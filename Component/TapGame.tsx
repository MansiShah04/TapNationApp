import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";

export default function TapGame({ onSuccess, onClose }) {
  const position = useRef(new Animated.Value(0)).current;
  let direction = 1;

  useEffect(() => {
    const loop = () => {
      Animated.timing(position, {
        toValue: direction === 1 ? 1 : 0,
        duration: 2000,
        useNativeDriver: false,
      }).start(() => {
        direction *= -1;
        loop();
      });
    };
    loop();
  }, []);

  const handleTap = () => {
    position.stopAnimation((value) => {
      if (value > 0.4 && value < 0.6) {
        onSuccess(); // 🎉 success
      } else {
        onClose(); // ❌ fail
      }
    });
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000000dd",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", marginBottom: 20 }}>
        Tap at the right time!
      </Text>

      {/* 🎯 Bar */}
      <View
        style={{
          width: 250,
          height: 20,
          backgroundColor: "#1f2937",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* ✅ Target Zone */}
        <View
          style={{
            position: "absolute",
            left: "40%",
            width: "20%",
            height: "100%",
            backgroundColor: "#22c55e",
          }}
        />

        {/* 🔴 Moving Indicator */}
        <Animated.View
          style={{
            width: 10,
            height: 20,
            backgroundColor: "red",
            position: "absolute",
            left: position.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>

      <Pressable
        onPress={handleTap}
        style={{
          marginTop: 30,
          backgroundColor: "#22c55e",
          padding: 12,
          borderRadius: 10,
        }}
      >
        <Text>STOP</Text>
      </Pressable>
    </View>
  );
}