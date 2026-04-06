import "./cryptoSetup";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Platform,
  StatusBar,
  Text,
  View,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Easing
} from "react-native";
import {
  AuthRequest,
  exchangeCodeAsync,
  AccessTokenRequestConfig,
} from "expo-auth-session";
import { EmailConflictInfo } from "@0xsequence/waas";
import appleAuth, {
  AppleButton,
  appleAuthAndroid,
} from "@invertase/react-native-apple-authentication";

import {
  sequenceWaas,
  iosGoogleRedirectUri,
  iosGoogleClientId,
  webGoogleClientId,
} from "./waasSetup";
import EmailAuthView from "./components/EmailAuthView";

import { randomName } from "./utils/string";
import EmailConflictWarningView from "./components/EmailConflictWarningView";
import { ethers } from "ethers";
import { streamOffers } from "./Services/MockOfferStream";
import CoinAnimation from "./Component/CoinAnimation";
import LottieView from "lottie-react-native";
import { Int32 } from "react-native/Libraries/Types/CodegenTypes";
import OfferCard from "./Component/OfferCard";
import TapGame from "./Component/TapGame";
import OfferwallScreen from "./Component/OfferWallScreen";


//#region declareation
const RPC = "https://api.avax-test.network/ext/bc/C/rpc";

const provider = new ethers.JsonRpcProvider(RPC);
//#endregion
export default function App() {
  const balanceAnim = useRef(new Animated.Value(0)).current;    // 💰 Animated Balance
  const [activeOffer, setActiveOffer] = useState(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [result, setResult] = useState(null);
  const [pendingReward, setPendingReward] = useState(0);

  const [isEmailAuthInProgress, setIsEmailAuthInProgress] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    isSignedIn(setWalletAddress);
  }, []);
  useEffect(() => {
    Animated.timing(balanceAnim, {
      toValue: balance as unknown as Int32,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [balance]);

  // 💥 Pulse Effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [walletAddress]);


  useEffect(() => {
    if (walletAddress) {
      loadWallet();
      startStreamingOffers();
    }
  }, [walletAddress]);
  const [emailConflictInfo, setEmailConflictInfo] = useState<
    EmailConflictInfo | undefined
  >();
  const [isEmailConflictModalOpen, setIsEmailConflictModalOpen] =
    useState(false);
  const forceCreateFuncRef = useRef<(() => Promise<void>) | null>(null);

  sequenceWaas.onEmailConflict(async (info, forceCreate) => {
    forceCreateFuncRef.current = forceCreate;
    setEmailConflictInfo(info);
    setIsEmailConflictModalOpen(true);
  });



  //#region load wallet
  const loadWallet = async () => {
    //if (!sequence) return;

    try {

      const balanceWei = await provider.getBalance(walletAddress as string);
      const avax = ethers.formatEther(balanceWei);

      setBalance(avax);
    } catch (e) {
      console.log("Wallet error", e);
    } finally {
    }
  };

  //#endregion

  //#region offers streaming
  const startStreamingOffers = async () => {
    setIsStreaming(true);
    setOffers([]);

    await streamOffers((newOffer) => {
      setOffers((prev) => [...prev, newOffer]);
    });

    setIsStreaming(false);
  };
  //#endregion

  //#region claim

  const handleClaim = async (offer: any) => {
    setActiveOffer(offer);
    setPendingReward(offer?.reward);
  };
  const onClaimed = async () => {

    const newBalance = (parseFloat(balance) + pendingReward).toFixed(4);
    setBalance(newBalance);
    setResult("win");
    setActiveOffer(null);
    setPendingReward(0);
  };

  const onClaimFailed = async () => {
    setResult("fail");
    setActiveOffer(null);
    setPendingReward(0);
  };


  //#endregion

  //#region style
  const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: "#0f172a" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#38bdf8",
      textAlign: "center",
      marginBottom: 20,
    },
    label: { marginTop: 10, color: "gray" },
    value: { fontSize: 16, marginTop: 4 },
    card: {
      backgroundColor: "#1e293b",
      padding: 16,
      borderRadius: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: "#334155",

      // glow effect
      shadowColor: "#38bdf8",
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 6,
    },

    icon: {
      fontSize: 22,
      marginRight: 8,
    },
    offerTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#e2e8f0",
    },

    rewardContainer: {
      marginTop: 12,
      backgroundColor: "#0f172a",
      padding: 10,
      borderRadius: 10,
      alignItems: "center",
    },

    rewardText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#22c55e",
    },

    claimBtn: {
      marginTop: 14,
      backgroundColor: "#3b82f6",
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",

      shadowColor: "#3b82f6",
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 8,
    },

    claimText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 15,
    },
    walletCard: {
      backgroundColor: "#1e293b",
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#334155",
    },

    sectionTitle: {
      color: "#94a3b8",
      marginTop: 10,
      fontSize: 14,
    },

    address: {
      color: "#e2e8f0",
      fontSize: 16,
      marginTop: 4,
    },

    balance: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#22c55e",
      marginTop: 8,
    },
  });
  //#endregion
  const refreshScale = useRef(new Animated.Value(1)).current;

  const handleRefreshPress = () => {
    Animated.sequence([
      Animated.spring(refreshScale, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(refreshScale, { toValue: 1.1, useNativeDriver: true }),
      Animated.spring(refreshScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    loadWallet();
  };
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [walletAddress]);
  return (
    <ScrollView>
      <View style={styles.container}>
        <StatusBar
          barStyle={Platform.OS === "ios" ? "light-content" : "dark-content"}
        />
        {isEmailAuthInProgress && (
          <EmailAuthView
            onCancel={() => setIsEmailAuthInProgress(false)}
            onSuccess={(walletAddress) => {
              setIsEmailAuthInProgress(false);
              setWalletAddress(walletAddress);
            }}
          />
        )}

        {isEmailConflictModalOpen && (
          <EmailConflictWarningView
            info={emailConflictInfo}
            onCancel={() => {
              setIsEmailAuthInProgress(false);
              setIsEmailConflictModalOpen(false);
              setEmailConflictInfo(undefined);
              forceCreateFuncRef.current = null;
            }}
            onConfirm={() => {
              setIsEmailConflictModalOpen(false);
              setEmailConflictInfo(undefined);
              forceCreateFuncRef.current?.();
            }}
          />
        )}

        {walletAddress && (
          <OfferwallScreen
            walletAddress={walletAddress}
            balance={balance as unknown as number}
            offers={offers}
            isStreaming={isStreaming}
            isGenerating={offers.length < 3}
            claimedToday={12}
            activeOffersCount={offers.length}
            onRefreshBalance={handleRefreshPress}
            onSignOut={async () => { await sequenceWaas.dropSession(); setWalletAddress(null); }}
            renderOfferCard={(offer, index) => (
              <OfferCard key={offer.id} offer={offer} index={index} onPlay={handleClaim} />
            )}
          />)}
        {walletAddress && activeOffer && (
          <TapGame
            onSuccess={() => {
              onClaimed();
            }}
            onClose={() => {
              onClaimFailed();
            }}
          />
        )}

        {result && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.85)",
            }}
          >
            {/* 🎉 LOTTIE */}
            <LottieView
              source={
                result === "win"
                  ? require("./assets/animations/Success.json")
                  : require("./assets/animations/fail.json")
              }
              autoPlay
              loop={false}
              style={{ width: 220, height: 220 }}
              onAnimationFinish={() => setResult(null)}
            />

            {/* 🎯 TEXT */}
            <Text
              style={{
                color: result === "win" ? "#22c55e" : "#ef4444",
                fontSize: 26,
                fontWeight: "900",
                marginTop: 10,
                letterSpacing: 1.5,
              }}
            >
              {result === "win"
                ? "CONGRATULATIONS!"
                : "BETTER LUCK NEXT TIME"}
            </Text>

            {/* 💬 SUBTEXT */}
            <Text
              style={{
                color: "#9ca3af",
                marginTop: 6,
                fontSize: 14,
              }}
            >
              {result === "win"
                ? "Reward unlocked 🎉"
                : "Almost there, try again ⚡"}
            </Text>
          </View>
        )}
        {!walletAddress && !isEmailAuthInProgress && (
          <>
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                style={{
                  resizeMode: "contain",
                }}
                source={require("./assets/sequence-icon.png")}
              />
            </View>

            <View style={{
              marginBottom: 50, alignItems: "center",
              justifyContent: "center",
            }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "#38bdf8",
                  textShadowColor: "#38bdf8",
                  textShadowRadius: 10,
                  marginBottom: 10,
                }}>
                Tap Nation
              </Text>
              {/* Subtitle */}
              <Text
                style={{
                  color: "#94a3b8",
                  marginTop: 20
                }}
              >
                Play. Earn. Win.
              </Text>
            </View>

            {isLoggingIn ? (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 20,
                }}
              >
                <ActivityIndicator size="large" color="#26316f" />
              </View>
            ) : (
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                {/* 🎮 Game Style Button */}
                <Pressable
                  onPress={async () => {
                    setIsLoggingIn(true);
                    try {
                      const signInResult = await sequenceWaas.signIn(
                        { guest: true },
                        randomName()
                      );

                      if (signInResult.wallet) {
                        setWalletAddress(signInResult.wallet);
                      } else {
                        console.error("No wallet address after guest sign in");
                      }
                    } catch (error) {
                      console.error("Guest sign in failed:", error);
                    } finally {
                      setIsLoggingIn(false);
                    }
                  }}
                  style={({ pressed }) => ({
                    width: "60%",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? "#2563eb" : "#3b82f6",
                    paddingVertical: 14,
                    paddingHorizontal: 40,
                    borderRadius: 12,
                    shadowColor: "#3b82f6",
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                    margin: 15,
                  })}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Continue as Guest
                  </Text>
                </Pressable>

                {/* 🎮 Game Style Button */}
                <Pressable
                  onPress={() => {
                    setIsEmailAuthInProgress(true);
                  }}
                  style={({ pressed }) => ({
                    width: "60%",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? "#2563eb" : "#3b82f6",
                    paddingVertical: 14,
                    paddingHorizontal: 40,
                    borderRadius: 12,
                    shadowColor: "#3b82f6",
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                    margin: 15,
                  })}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Sign in with Email
                  </Text>
                </Pressable>
                {/* 🎮 Game Style Button */}
                <Pressable
                  onPress={async () => {
                    setIsLoggingIn(true);
                    try {
                      const result = await signInWithGoogle();
                      if (result?.walletAddress) {
                        setWalletAddress(result.walletAddress);
                      }
                    } catch (error) {
                      console.error("Google sign in failed:", error);
                    } finally {
                      setIsLoggingIn(false);
                    }
                  }}
                  style={({ pressed }) => ({
                    width: "60%",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? "#2563eb" : "#3b82f6",
                    paddingVertical: 14,
                    paddingHorizontal: 40,
                    borderRadius: 12,
                    shadowColor: "#3b82f6",
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                    margin: 15,
                  })}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Sign in with Google
                  </Text>
                </Pressable>

                {/* 🎮 Game Style Button */}
                <Pressable
                  onPress={async () => {
                    setIsLoggingIn(true);
                    try {
                      if (Platform.OS === "ios") {
                        const result = await signInWithAppleIOS();
                        if (result?.walletAddress) {
                          setWalletAddress(result.walletAddress);
                        }
                      }
                      if (Platform.OS === "android") {
                        const result = await signInWithAppleAndroid();
                        if (result?.walletAddress) {
                          setWalletAddress(result.walletAddress);
                        }
                      }
                    } catch (error) {
                      console.error("Apple sign in failed:", error);
                    } finally {
                      setIsLoggingIn(false);
                    }
                  }}
                  style={({ pressed }) => ({
                    width: "60%",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? "#2563eb" : "#3b82f6",
                    paddingVertical: 14,
                    paddingHorizontal: 40,
                    borderRadius: 12,
                    shadowColor: "#3b82f6",
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                    margin: 15,
                  })}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Signin with Apple
                  </Text>
                </Pressable>

              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// Helpers

const isSignedIn = async (
  setWalletAddress: React.Dispatch<React.SetStateAction<string>>
) => {
  const isSignedIn = await sequenceWaas.isSignedIn();

  if (isSignedIn) {
    sequenceWaas.getAddress().then((address) => {
      setWalletAddress(address);
    });
  }
};

type GoogleUser = {
  user: {
    id: string;
    name: string | null;
    givenName: string | null;
    familyName: string | null;
    photo: string | null;
  };
  idToken: string;
};

const signInWithGoogle = async () => {
  const redirectUri = `${iosGoogleRedirectUri}:/oauthredirect`;

  const scopes = ["openid", "profile", "email"];
  const request = new AuthRequest({
    clientId: iosGoogleClientId,
    scopes,
    redirectUri,
    usePKCE: true,
    extraParams: {
      audience: webGoogleClientId,
      include_granted_scopes: "true",
    },
  });

  const result = await request.promptAsync({
    authorizationEndpoint: `https://accounts.google.com/o/oauth2/v2/auth`,
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
    clientId: iosGoogleClientId,
    extraParams: {
      code_verifier: request?.codeVerifier || "",
      audience: webGoogleClientId,
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
    userInfo: {
      user: userInfo,
      idToken,
    },
    walletAddress: waasSession.wallet,
  };
};

const signInWithAppleIOS = async () => {
  // performs login request
  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    // Note: it appears putting FULL_NAME first is important, see issue #293
    requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
  });

  // get current authentication state for user
  // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
  const credentialState = await appleAuth.getCredentialStateForUser(
    appleAuthRequestResponse.user
  );

  // use credentialState response to ensure the user is authenticated
  if (credentialState === appleAuth.State.AUTHORIZED) {
    // user is authenticated

    const idToken = appleAuthRequestResponse.identityToken;

    if (!idToken) {
      throw new Error("No idToken");
    }

    const waasSession = await authenticateWithWaas(idToken);

    if (!waasSession) {
      throw new Error("No WaaS session");
    }

    return {
      userInfo: {
        user: appleAuthRequestResponse.user,
        idToken,
      },
      walletAddress: waasSession.wallet,
    };
  }
};

const signInWithAppleAndroid = async () => {
  // Configure the request
  appleAuthAndroid.configure({
    // The Service ID you registered with Apple
    clientId: "com.horizon.waas-demo",

    // Return URL added to your Apple dev console. We intercept this redirect, but it must still match
    // the URL you provided to Apple. It can be an empty route on your backend as it's never called.
    redirectUri: "https://waas-demo.sequence.app/callback",

    // The type of response requested - code, id_token, or both.
    responseType: appleAuthAndroid.ResponseType.ALL,

    // The amount of user information requested from Apple.
    scope: appleAuthAndroid.Scope.ALL,
  });

  // Open the browser window for user sign in
  const response = await appleAuthAndroid.signIn();

  const idToken = response.id_token;

  if (!idToken) {
    throw new Error("No idToken");
  }

  const waasSession = await authenticateWithWaas(idToken);

  if (!waasSession) {
    throw new Error("No WaaS session");
  }

  return {
    userInfo: {
      idToken,
    },
    walletAddress: waasSession.wallet,
  };
};

const authenticateWithWaas = async (
  idToken: string
): Promise<{ sessionId: string; wallet: string } | null> => {
  try {
    const signInResult = await sequenceWaas.signIn(
      {
        idToken,
      },
      randomName()
    );

    return signInResult;
  } catch (e) {
    console.log("error in authenticateWithWaas", JSON.stringify(e));
  }

  return null;
};

const fetchGoogleUserInfo = async (
  accessToken: string
): Promise<GoogleUser["user"]> => {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const json: any = await response.json();

  return {
    id: json.sub,
    name: json.name,
    givenName: json.given_name,
    familyName: json.family_name,
    photo: json.picture,
  };
};
