import "./src/config/cryptoSetup";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StatusBar, Text, View, Animated, StyleSheet } from "react-native";
import {
  AuthRequest,
  exchangeCodeAsync,
  AccessTokenRequestConfig,
} from "expo-auth-session";
import { EmailConflictInfo } from "@0xsequence/waas";
import * as AppleAuthentication from "expo-apple-authentication";

import {
  sequenceWaas,
  IOS_GOOGLE_REDIRECT_URI,
  IOS_GOOGLE_CLIENT_ID,
  WEB_GOOGLE_CLIENT_ID,
} from "./src/config/waasSetup";
import { randomName } from "./src/utils/string";
import { colors } from "./src/theme/colors";
import type { GoogleUser, WaaSSession } from "./src/types/auth";
import type { Offer, GameType } from "./src/types/offer";

import { useWallet } from "./src/hooks/useWallet";
import { useOffers } from "./src/hooks/useOffers";

import LoginScreen from "./src/components/auth/LoginScreen";
import EmailAuthView from "./src/components/auth/EmailAuthView";
import EmailConflictWarningView from "./src/components/auth/EmailConflictWarningView";
import TapGame from "./src/components/games/TapGame";
import TapSpeedGame from "./src/components/games/TapSpeedGame";
import AvoidObstaclesGame from "./src/components/games/AvoidObstaclesGame";
import OfferCard from "./src/components/offers/OfferCard";
import OfferWallScreen from "./src/components/offers/OfferWallScreen";

// ─── Result overlay ──────────────────────────────────────────────────────────

function ResultOverlay({ result, onFinish }: { result: "win" | "fail"; onFinish: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(onFinish);
    }, 2000);

    return () => clearTimeout(timer);
  }, [scale, opacity, onFinish]);

  const isWin = result === "win";
  return (
    <View style={s.resultOverlay}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: "center" }}>
        <Text style={{ fontSize: 80 }}>{isWin ? "🎉" : "💥"}</Text>
        <Text style={[s.resultTitle, { color: isWin ? colors.green : colors.danger }]}>
          {isWin ? "CONGRATULATIONS!" : "BETTER LUCK NEXT TIME"}
        </Text>
        <Text style={s.resultSubtitle}>
          {isWin ? "Reward unlocked 🎉" : "Almost there, try again ⚡"}
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Auth helpers (original Sequence demo approach) ──────────────────────────

async function authenticateWithWaas(idToken: string): Promise<WaaSSession | null> {
  try {
    return await sequenceWaas.signIn({ idToken }, randomName());
  } catch (e) {
    console.log("error in authenticateWithWaas", JSON.stringify(e));
  }
  return null;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUser["user"]> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  const json = await response.json();

  return {
    id: json.sub,
    name: json.name,
    givenName: json.given_name,
    familyName: json.family_name,
    photo: json.picture,
  };
}

const signInWithGoogle = async () => {
  const redirectUri = `${IOS_GOOGLE_REDIRECT_URI}:/oauthredirect`;

  const scopes = ["openid", "profile", "email"];
  const request = new AuthRequest({
    clientId: IOS_GOOGLE_CLIENT_ID,
    scopes,
    redirectUri,
    usePKCE: true,
    extraParams: {
      audience: WEB_GOOGLE_CLIENT_ID,
      include_granted_scopes: "true",
    },
  });

  const result = await request.promptAsync({
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  });

  if (result.type === "cancel") {
    return undefined;
  }

  if (result.type !== "success") {
    throw new Error("Authentication failed");
  }

  const serverAuthCode = result.params?.code;

  const configForTokenExchange: AccessTokenRequestConfig = {
    code: serverAuthCode,
    redirectUri,
    clientId: IOS_GOOGLE_CLIENT_ID,
    extraParams: {
      code_verifier: request?.codeVerifier || "",
      audience: WEB_GOOGLE_CLIENT_ID,
    },
  };

  const tokenResponse = await exchangeCodeAsync(configForTokenExchange, {
    tokenEndpoint: "https://oauth2.googleapis.com/token",
  });

  const userInfo = await fetchGoogleUserInfo(tokenResponse.accessToken);
  const idToken = tokenResponse.idToken;

  if (!idToken) {
    throw new Error("No idToken");
  }

  const waasSession = await authenticateWithWaas(idToken);

  if (!waasSession) {
    throw new Error("No WaaS session");
  }

  return {
    userInfo: { user: userInfo, idToken },
    walletAddress: waasSession.wallet,
  };
};

const signInWithApple = async () => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const idToken = credential.identityToken;
  if (!idToken) throw new Error("No idToken");

  const waasSession = await authenticateWithWaas(idToken);
  if (!waasSession) throw new Error("No WaaS session");

  return {
    userInfo: { user: credential.user, idToken },
    walletAddress: waasSession.wallet,
  };
};

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { walletAddress, setWalletAddress, balance, loadBalance, addReward, signOut } = useWallet();
  const { offers, isStreaming, activeOffer, playOffer, clearActiveOffer } = useOffers(!!walletAddress);

  const [result, setResult] = useState<"win" | "fail" | null>(null);
  const [isEmailAuthInProgress, setIsEmailAuthInProgress] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Email conflict state
  const [emailConflictInfo, setEmailConflictInfo] = useState<EmailConflictInfo | undefined>();
  const [isEmailConflictOpen, setIsEmailConflictOpen] = useState(false);
  const forceCreateRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    return sequenceWaas.onEmailConflict(async (info, forceCreate) => {
      forceCreateRef.current = forceCreate;
      setEmailConflictInfo(info);
      setIsEmailConflictOpen(true);
    });
  }, []);

  // ── Game result handlers ─────────────────────────────────────────────────

  const pendingRewardRef = useRef(0);

  const handlePlay = useCallback((offer: Offer) => {
    pendingRewardRef.current = offer.reward;
    playOffer(offer);
  }, [playOffer]);

  const handleGameWin = useCallback(() => {
    addReward(pendingRewardRef.current);
    setResult("win");
    clearActiveOffer();
    pendingRewardRef.current = 0;
  }, [addReward, clearActiveOffer]);

  const handleGameLose = useCallback(() => {
    setResult("fail");
    clearActiveOffer();
    pendingRewardRef.current = 0;
  }, [clearActiveOffer]);

  const renderOfferCard = useCallback(
    (offer: Offer, index: number) => (
      <OfferCard key={offer.id} offer={offer} index={index} onPlay={handlePlay} />
    ),
    [handlePlay],
  );

  const gameTitle = activeOffer?.title as GameType | undefined;

  return (
    <View style={s.container}>
      <StatusBar barStyle={Platform.OS === "ios" ? "light-content" : "dark-content"} />

      {isEmailAuthInProgress && (
        <EmailAuthView
          onCancel={() => setIsEmailAuthInProgress(false)}
          onSuccess={(addr) => { setIsEmailAuthInProgress(false); setWalletAddress(addr); }}
        />
      )}
      {isEmailConflictOpen && (
        <EmailConflictWarningView
          info={emailConflictInfo}
          onCancel={() => {
            setIsEmailAuthInProgress(false);
            setIsEmailConflictOpen(false);
            setEmailConflictInfo(undefined);
            forceCreateRef.current = null;
          }}
          onConfirm={() => {
            setIsEmailConflictOpen(false);
            setEmailConflictInfo(undefined);
            forceCreateRef.current?.();
          }}
        />
      )}

      {walletAddress ? (
        <OfferWallScreen
          walletAddress={walletAddress}
          balance={parseFloat(balance)}
          offers={offers}
          isStreaming={isStreaming}
          isGenerating={offers.length < 3}
          claimedToday={12}
          activeOffersCount={offers.length}
          onRefreshBalance={loadBalance}
          onSignOut={signOut}
          renderOfferCard={renderOfferCard}
        />
      ) : !isEmailAuthInProgress ? (
        <LoginScreen
          isLoggingIn={isLoggingIn}
          setIsEmailAuthInProgress={setIsEmailAuthInProgress}
          setIsLoggingIn={setIsLoggingIn}
          setWalletAddress={setWalletAddress}
          sequenceWaas={sequenceWaas}
          randomName={randomName}
          signInWithGoogle={signInWithGoogle}
          signInWithApple={signInWithApple}
        />
      ) : null}

      {walletAddress && gameTitle === "Tap-to-Stop" && (
        <TapGame onSuccess={handleGameWin} onClose={handleGameLose} />
      )}
      {walletAddress && gameTitle === "Tap-to-Speed" && (
        <TapSpeedGame onSuccess={handleGameWin} onClose={handleGameLose} />
      )}
      {walletAddress && gameTitle === "Avoid-Obstacles" && (
        <AvoidObstaclesGame onSuccess={handleGameWin} onClose={handleGameLose} />
      )}

      {result && <ResultOverlay result={result} onFinish={() => setResult(null)} />}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  resultOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.overlay,
    zIndex: 999,
  },
  resultTitle: { fontSize: 26, fontWeight: "900", marginTop: 10, letterSpacing: 1.5 },
  resultSubtitle: { color: colors.muted, marginTop: 6, fontSize: 14 },
});
