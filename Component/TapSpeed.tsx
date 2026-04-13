import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

export default function TapSpeedGame({ onSuccess, onClose }: Props) {
  const GAME_TIME = 5; // seconds
  const TARGET_TPS = 6; // taps per second to win

  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [taps, setTaps] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let timer: any;

    if (running && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0 && running) {
      setRunning(false);
      setFinished(true);

      const tps = taps / GAME_TIME;

      // Decide result
      setTimeout(() => {
        if (tps >= TARGET_TPS) {
          onSuccess(); // ✅ trigger success animation outside
        } else {
          onClose(); // ❌ trigger fail animation outside
        }
      }, 500); // small delay for UX
    }

    return () => clearTimeout(timer);
  }, [running, timeLeft]);

  const startGame = () => {
    setTimeLeft(GAME_TIME);
    setTaps(0);
    setRunning(true);
    setFinished(false);
  };

  const handleTap = () => {
    if (running) {
      setTaps((prev) => prev + 1);
    }
  };

  const tps = taps / GAME_TIME;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tap Speed</Text>

      <Text style={styles.timer}>⏱ {timeLeft}s</Text>
      <Text style={styles.score}>Taps: {taps}</Text>

      {running ? (
        <TouchableOpacity style={styles.tapArea} onPress={handleTap}>
          <Text style={styles.tapText}>TAP!</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>
            {finished ? "PLAY AGAIN" : "START"}
          </Text>
        </TouchableOpacity>
      )}

      {finished && (
        <Text style={styles.result}>
          ⚡ {tps.toFixed(2)} taps/sec
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: { fontSize: 26, marginBottom: 20 },

  timer: { fontSize: 20 },
  score: { fontSize: 20, marginBottom: 20 },

  tapArea: {
    width: 200,
    height: 200,
    backgroundColor: "#ff4757",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },

  tapText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  button: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
  },

  result: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
});