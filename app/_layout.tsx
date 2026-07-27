// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { View, Image, Platform, ActivityIndicator, Text } from "react-native";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as NavigationBar from "expo-navigation-bar";

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

// Gates the app on Clerk being ready. Shows a visible loading state instead of a
// blank white screen, and a hint if it's taking too long (usually a network issue).
function InitialLayout() {
  const { isLoaded } = useAuth();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setSlow(true), 10000);
    return () => clearTimeout(t);
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <ActivityIndicator size="large" color="#00FF1A" />
        <Text
          style={{
            color: "#FFFFFF",
            marginTop: 18,
            fontSize: 16,
            fontFamily: "Jakarta-SemiBold",
          }}
        >
          {slow ? "Still connecting…" : "Connecting…"}
        </Text>
        {slow && (
          <Text
            style={{
              color: "#858585",
              marginTop: 8,
              fontSize: 13,
              textAlign: "center",
              fontFamily: "Jakarta-Medium",
            }}
          >
            Check your internet connection and try again.
          </Text>
        )}
      </View>
    );
  }

  return <Slot />;
}

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

  useEffect(() => {
    if (Platform.OS !== "android") return;
    NavigationBar.setBackgroundColorAsync("#000000").catch(() => {});
    NavigationBar.setButtonStyleAsync("light").catch(() => {});
  }, []);

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
      <InitialLayout />
    </ClerkProvider>
  );
}
