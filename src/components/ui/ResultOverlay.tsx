import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native";
import LottieView from "lottie-react-native";
import { colors } from "../../theme/colors";
import { successNotification, errorNotification } from "../../utils/haptics";
import { playWin, playFail } from "../../utils/sounds";

const { width: SCREEN_W } = Dimensions.get("window");
interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
  anim: Animated.Value;
}

const PARTICLE_COLORS = [colors.gold, colors.cyan, colors.green, colors.pink, colors.purple];

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 80 + Math.random() * 120;
    particles.push({
      id: i,
      x: SCREEN_W / 2,
      y: Dimensions.get("window").height / 2 - 40,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: 4 + Math.random() * 6,
      anim: new Animated.Value(0),
    });
  }
  return particles;
}


const LOTTIE_WIN = require("../../../assets/animations/Success.json");
const LOTTIE_FAIL = require("../../../assets/animations/fail.json");


interface ResultOverlayProps {
  result: "win" | "fail";
  onFinish: () => void;
}

export default function ResultOverlay({ result, onFinish }: ResultOverlayProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isWin = result === "win";

  const [particles] = useState(() => (isWin ? createParticles(16) : []));

  useEffect(() => {
    // Haptics + sound
    if (isWin) {
      successNotification();
      playWin();
    } else {
      errorNotification();
      playFail();
    }

    // Entry animation
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Particle burst (win only)
    if (isWin) {
      particles.forEach((p) => {
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }).start();
      });
    }

    // Auto-dismiss
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(onFinish);
    }, 2500);

    return () => clearTimeout(timer);
  }, [scale, opacity, onFinish, isWin, particles]);

  return (
    <View style={s.overlay} pointerEvents="none">
      {/* Particle burst (win only) */}
      {isWin &&
        particles.map((p) => (
          <Animated.View
            key={p.id}
            style={[
              s.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: p.anim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateX: p.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [p.x, p.x + p.dx],
                    }),
                  },
                  {
                    translateY: p.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [p.y, p.y + p.dy],
                    }),
                  },
                  {
                    scale: p.anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1.5, 0.3],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

      {/* Lottie + text */}
      <Animated.View style={[s.content, { opacity, transform: [{ scale }] }]}>
        <View style={s.lottieWrap}>
          <LottieView
            source={isWin ? LOTTIE_WIN : LOTTIE_FAIL}
            autoPlay
            loop={false}
            style={s.lottie}
          />
        </View>
        <Text style={[s.title, { color: isWin ? colors.green : colors.danger }]}>
          {isWin ? "CONGRATULATIONS!" : "BETTER LUCK NEXT TIME"}
        </Text>
        <Text style={s.subtitle}>
          {isWin ? "Reward earned" : "Almost there, try again"}
        </Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.overlay,
    zIndex: 999,
  },
  content: {
    alignItems: "center",
  },
  lottieWrap: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: 1.5,
  },
  subtitle: {
    color: "rgba(232,232,255,0.55)",
    marginTop: 6,
    fontSize: 14,
  },
  particle: {
    position: "absolute",
  },
});
