/**
 * Main app navigation stack.
 * Shown when the user is signed in with a wallet.
 */
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OfferWallContainer from "../screens/OfferWallContainer";
import GameScreen from "../screens/GameScreen";
import type { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="OfferWall" component={OfferWallContainer} />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{ animation: "slide_from_bottom", presentation: "transparentModal" }}
      />
    </Stack.Navigator>
  );
}
