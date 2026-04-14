import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Tap Nation",
  icon: "./assets/app-icon.png",
  slug: "demo-waas-react-native",
  scheme: "tapnation",
  version: "1.0.8",
  sdkVersion: "51.0.0",
  platforms: ["ios", "android"],
  android: {
    package: "com.horizon.sequencewaasdemo",
    intentFilters: [
      {
        action: "VIEW",
        data: [
          {
            scheme:
              process.env.EXPO_PUBLIC_IOS_GOOGLE_REDIRECT_URI ??
              "com.googleusercontent.apps.970987756660-eu0kjc9mda0iuiuktoq0lbme9mmn1j8m",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  ios: {
    bundleIdentifier: "com.horizon.sequence-waas-demo",
    usesAppleSignIn: true,
    infoPlist: {
      GIDClientID:
        process.env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID ??
        "277467576806-f8g9k1vu110ssa8lgt4fd2v1gjmc21as.apps.googleusercontent.com",
    },
  },
  splash: {
    backgroundColor: "#0a0c1a",
    resizeMode: "contain",
  },
  extra: {
    eas: {
      projectId: "fc60d2f6-fa65-4cf1-a438-2b197b7bae39",
    },
  },
  owner: "tolgahan.arikan",
  plugins: ["expo-secure-store", "expo-apple-authentication"],
});
