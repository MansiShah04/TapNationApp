import React, { Component } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.emoji}>💥</Text>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.message}>
            {this.props.fallbackMessage ?? "The game crashed unexpectedly."}
          </Text>
          <Pressable onPress={this.handleReset} style={s.btn}>
            <Text style={s.btnText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.overlay,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    padding: 32,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: {
    color: colors.danger,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: colors.purple,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});