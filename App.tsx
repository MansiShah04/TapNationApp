import "./src/config/cryptoSetup";
import React from "react";
import { LogBox, Platform, StatusBar } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "./src/theme/colors";
import { AuthContext, useAuthProvider } from "./src/hooks/useAuth";
import { WalletContext, useWalletProvider } from "./src/hooks/useWallet";
import { OffersContext, useOffersProvider } from "./src/hooks/useOffers";
import { RootNavigator } from "./src/navigation";

const AppTheme = {
  ...DefaultTheme,
  dark: true as const,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.purple,
    background: colors.bg,
    card: colors.bgCard,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function App() {
  LogBox.ignoreAllLogs();
  const auth = useAuthProvider();
  const wallet = useWalletProvider();
  const offers = useOffersProvider(!!auth.walletAddress);

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={auth}>
        <WalletContext.Provider value={wallet}>
          <OffersContext.Provider value={offers}>
            <StatusBar barStyle={Platform.OS === "ios" ? "light-content" : "dark-content"} />
            <NavigationContainer theme={AppTheme}>
              <RootNavigator />
            </NavigationContainer>
          </OffersContext.Provider>
        </WalletContext.Provider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
