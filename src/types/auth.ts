/**
 * Auth-related types shared across login, email auth, and wallet flows.
 */

export interface GoogleUser {
  user: {
    id: string;
    name: string | null;
    givenName: string | null;
    familyName: string | null;
    photo: string | null;
  };
  idToken: string;
}

export interface AuthResult {
  userInfo: {
    user?: string | GoogleUser["user"];
    idToken: string;
  };
  walletAddress: string;
}

export interface WaaSSession {
  sessionId: string;
  wallet: string;
}
