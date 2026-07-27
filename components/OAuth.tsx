import { useCallback, useEffect, useState } from "react";
import { View, Text, Image, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useSSO } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import CustomButton from "@/components/CustomButton";
import AlertModal from "@/components/AlertModal";
import { icons } from "@/constants";

WebBrowser.maybeCompleteAuthSession();

// Preloads the browser on Android so the OAuth sheet opens without a delay.
const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const OAuth = () => {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [error, setError] = useState("");

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(
        err.errors?.[0]?.longMessage ??
          err.errors?.[0]?.message ??
          "Failed to sign in with Google. Please try again.",
      );
    }
  }, [startSSOFlow, router]);

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-lg text-white">Or</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>

      <CustomButton
        title="Log In with Google"
        className="mt-5 w-full shadow-none bg-white"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
      />

      <AlertModal
        visible={!!error}
        type="error"
        title="Google Sign-In Failed"
        message={error}
        onClose={() => setError("")}
      />
    </View>
  );
};

export default OAuth;
