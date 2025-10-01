// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { View, Image } from "react-native";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import * as SecureStore from "expo-secure-store";

const CLERK_PUBLISHABLE_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

// TokenCache implementation
const tokenCache = {
  async getToken(key: string) {
    return await SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded, fontsError] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "Jakarta-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    Jakarta: require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    Orbitian: require("../assets/fonts/Orbitron-Regular.ttf"),
    OrbitianBold: require("../assets/fonts/Orbitron-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsError) console.error("Font loading error:", fontsError);
    if (fontsLoaded) {
      const t = setTimeout(() => setShowSplash(false), 2000);
      return () => clearTimeout(t);
    }
  }, [fontsLoaded, fontsError]);

  if (showSplash || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <Image
          source={require("../assets/images/splash.png")}
          style={{ flex: 1, width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    console.error(
      "Missing Clerk publishable key. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.",
    );
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <Slot />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
