/**
 * Authentication service layer.
 * Extracted from App.tsx — all auth flows (Google, Apple, WaaS) live here.
 */
import { AuthRequest, exchangeCodeAsync, AccessTokenRequestConfig } from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  sequenceWaas,
  IOS_GOOGLE_REDIRECT_URI,
  IOS_GOOGLE_CLIENT_ID,
  WEB_GOOGLE_CLIENT_ID,
} from "../config/waasSetup";
import { randomName } from "../utils/string";
import type { GoogleUser, WaaSSession } from "../types/auth";

async function authenticateWithWaas(idToken: string): Promise<WaaSSession | null> {
  try {
    return await sequenceWaas.signIn({ idToken }, randomName());
  } catch (e) {
    console.log("error in authenticateWithWaas", JSON.stringify(e));
  }
  return null;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUser["user"]> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  const json = await response.json();
  return {
    id: json.sub,
    name: json.name,
    givenName: json.given_name,
    familyName: json.family_name,
    photo: json.picture,
  };
}

export async function signInWithGoogle(): Promise<{ walletAddress: string } | undefined> {
  const redirectUri = `${IOS_GOOGLE_REDIRECT_URI}:/oauthredirect`;

  const request = new AuthRequest({
    clientId: IOS_GOOGLE_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
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

  if (result.type === "cancel") return undefined;
  if (result.type !== "success") throw new Error("Authentication failed");

  const configForTokenExchange: AccessTokenRequestConfig = {
    code: result.params?.code,
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

  const idToken = tokenResponse.idToken;
  if (!idToken) throw new Error("No idToken");

  const waasSession = await authenticateWithWaas(idToken);
  if (!waasSession) throw new Error("No WaaS session");

  return { walletAddress: waasSession.wallet };
}

export async function signInWithApple(): Promise<{ walletAddress: string } | undefined> {
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

  return { walletAddress: waasSession.wallet };
}

export async function signInAsGuest(): Promise<string | null> {
  const result = await sequenceWaas.signIn({ guest: true }, randomName());
  return result?.wallet ?? null;
}
