import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

const { width } = Dimensions.get("window");

export default function AvoidObstaclesGame({ onSuccess, onClose }: Props) {
  const GAME_TIME = 10; // survive 10 sec to win
  const PLAYER_SIZE = 50;
  const OBSTACLE_SIZE = 40;

  const [playerX, setPlayerX] = useState(width / 2 - PLAYER_SIZE / 2);
  const [obstacles, setObstacles] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  const gameLoop = useRef<any>(null);

  // Start game
  const startGame = () => {
    setPlayerX(width / 2 - PLAYER_SIZE / 2);
    setObstacles([]);
    setTimeLeft(GAME_TIME);
    setRunning(true);
  };

  // Move player
  const moveLeft = () => {
    if (!running) return;
    setPlayerX((prev) => Math.max(0, prev - 40));
  };

  const moveRight = () => {
    if (!running) return;
    setPlayerX((prev) => Math.min(width - PLAYER_SIZE, prev + 40));
  };

  // Game loop
  useEffect(() => {
    if (!running) return;

    gameLoop.current = setInterval(() => {
      // Move obstacles down
      setObstacles((prev) =>
        prev
          .map((obs) => ({ ...obs, y: obs.y + 10 }))
          .filter((obs) => obs.y < 800)
      );

      // Add new obstacle randomly
      if (Math.random() < 0.3) {
        setObstacles((prev) => [
          ...prev,
          {
            x: Math.random() * (width - OBSTACLE_SIZE),
            y: 0,
            id: Date.now(),
          },
        ]);
      }

      // Collision check
      setObstacles((prev) => {
        for (let obs of prev) {
          if (
            obs.y + OBSTACLE_SIZE > 600 && // near player vertically
            obs.x < playerX + PLAYER_SIZE &&
            obs.x + OBSTACLE_SIZE > playerX
          ) {
            setRunning(false);
            setTimeout(() => onClose(), 300);
            return [];
          }
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(gameLoop.current);
  }, [running, playerX]);

  // Timer
  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setTimeout(() => onSuccess(), 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avoid Obstacles</Text>
      <Text style={styles.timer}>⏱ {timeLeft}s</Text>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Player */}
        <View style={[styles.player, { left: playerX }]} />

        {/* Obstacles */}
        {obstacles.map((obs) => (
          <View
            key={obs.id}
            style={[
              styles.obstacle,
              { left: obs.x, top: obs.y },
            ]}
          />
        ))}
      </View>

      {/* Controls */}
      {!running ? (
        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>START</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={moveLeft}>
            <Text style={styles.buttonText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={moveRight}>
            <Text style={styles.buttonText}>▶</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },

  title: { fontSize: 24, marginBottom: 10 },
  timer: { fontSize: 18, marginBottom: 10 },

  gameArea: {
    width: "100%",
    height: 600,
    backgroundColor: "#eee",
    overflow: "hidden",
  },

  player: {
    position: "absolute",
    bottom: 0,
    width: 50,
    height: 50,
    backgroundColor: "blue",
  },

  obstacle: {
    position: "absolute",
    width: 40,
    height: 40,
    backgroundColor: "red",
  },

  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "black",
    borderRadius: 10,
  },

  controls: {
    flexDirection: "row",
    marginTop: 20,
  },

  controlBtn: {
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: "black",
    borderRadius: 10,
  },

  buttonText: { color: "white", fontSize: 18 },
});