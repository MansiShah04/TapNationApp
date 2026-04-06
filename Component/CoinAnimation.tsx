import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Text } from "react-native";

const { width } = Dimensions.get("window");

const CoinAnimation = ({ onFinish }: any) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: width / 2 - 40,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -300,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 100,
        left: 40,
        transform: [
          { translateX },
          { translateY },
        ],
        opacity,
      }}
    >
      <Text style={{ fontSize: 90 }}>💸</Text>
    </Animated.View>
  );
};

export default CoinAnimation;