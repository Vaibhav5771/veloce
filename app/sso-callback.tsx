import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

// Clerk's `startSSOFlow` defaults its redirect URL to `<scheme>://sso-callback`,
// so Google sends the user back into the app on this exact path. Without a route
// here, expo-router renders its "Unmatched Route" screen for the second or two
// that `signIn.reload()` + `setActive()` take before OAuth.tsx navigates away.
// This screen is passive by design: components/OAuth.tsx owns the success
// navigation, so we only render the waiting state and a fallback for the case
// where the flow never completes (e.g. the session is never created).
const SSOCallback = () => {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => {
      if (isLoaded && !isSignedIn) router.replace("/(auth)/sign-in");
    }, 12000);
    return () => clearTimeout(t);
  }, [isLoaded, isSignedIn, router]);

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
        Signing you in…
      </Text>
    </View>
  );
};

export default SSOCallback;
