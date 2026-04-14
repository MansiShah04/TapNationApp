/**
 * Sequence Wallet-as-a-Service initialization.
 * Uses expo-secure-store for sensitive keys and AsyncStorage for general persistence.
 *
 * All secrets are read from environment variables (EXPO_PUBLIC_*).
 * See .env.example for required variables.
 */
import "./polyfills";
import { SequenceWaaS, SecureStoreBackend } from "@0xsequence/waas";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

class ExpoSecureStoreBackend implements SecureStoreBackend {
  private getKey(dbName: string, dbStoreName: string, key: string): string {
    return `${dbName}-${dbStoreName}-${key}`;
  }

  async get(dbName: string, dbStoreName: string, key: string): Promise<unknown | null> {
    const fullKey = this.getKey(dbName, dbStoreName, key);
    try {
      const value = await SecureStore.getItemAsync(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`SecureStore get failed: ${fullKey}`, error);
      return null;
    }
  }

  async set(dbName: string, dbStoreName: string, key: string, value: unknown): Promise<boolean> {
    const fullKey = this.getKey(dbName, dbStoreName, key);
    try {
      await SecureStore.setItemAsync(fullKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`SecureStore set failed: ${fullKey}`, error);
      return false;
    }
  }

  async delete(dbName: string, dbStoreName: string, key: string): Promise<boolean> {
    const fullKey = this.getKey(dbName, dbStoreName, key);
    try {
      await SecureStore.deleteItemAsync(fullKey);
      return true;
    } catch (error) {
      console.error(`SecureStore delete failed: ${fullKey}`, error);
      return false;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. ` +
      `Copy .env.example to .env and fill in the values.`,
    );
  }
  return value;
}

const PROJECT_ACCESS_KEY = requireEnv("EXPO_PUBLIC_PROJECT_ACCESS_KEY");
const WAAS_CONFIG_KEY = requireEnv("EXPO_PUBLIC_WAAS_CONFIG_KEY");

export const WEB_GOOGLE_CLIENT_ID = requireEnv("EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID");
export const IOS_GOOGLE_CLIENT_ID = requireEnv("EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID");
export const IOS_GOOGLE_REDIRECT_URI = requireEnv("EXPO_PUBLIC_IOS_GOOGLE_REDIRECT_URI");

const localStorage = {
  get: async (key: string) => (await AsyncStorage.getItem(key)) ?? null,
  set: async (key: string, value: string) => {
    if (value === null) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
};

export const INITIAL_NETWORK = "arbitrum-sepolia";

export const sequenceWaas = new SequenceWaaS(
  {
    network: INITIAL_NETWORK,
    projectAccessKey: PROJECT_ACCESS_KEY,
    waasConfigKey: WAAS_CONFIG_KEY,
  },
  localStorage,
  null,
  new ExpoSecureStoreBackend(),
);
