import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  Image,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { images, icons } from "@/constants";
import { useState, useCallback } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import AlertModal from "@/components/AlertModal";
import { Link, useRouter } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignIn } from "@clerk/clerk-expo";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;
    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError("Unable to sign in. Please check your details and try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(
        err.errors?.[0]?.longMessage ??
          err.errors?.[0]?.message ??
          "Failed to sign in. Please try again.",
      );
    }
  }, [isLoaded, form.email, form.password]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView className="flex-1 bg-black">
          <View className="flex-2 bg-white">
            <Image source={images.signUpCar} className="z-0 w-full h-[300px]" />
            <Text className="text-3xl font-JakartaMedium absolute bottom-5 left-5 flex-row">
              <Text className="text-[#E51F2B]">Login</Text>
              <Text className="text-white"> To Account </Text>
            </Text>
          </View>

          <View className="p-5">
            <InputField
              label="Email"
              placeholder="Enter your email"
              icon={icons.email}
              value={form.email}
              onChangeText={(value) => setForm({ ...form, email: value })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              label="Password"
              placeholder="Enter your password"
              icon={icons.lock}
              value={form.password}
              secureTextEntry
              onChangeText={(value) => setForm({ ...form, password: value })}
            />

            <CustomButton
              title="Sign In"
              onPress={onSignInPress}
              className="mt-6"
            />

            <OAuth />

            <Link
              href="/sign-up"
              className="text-lg text-center text-general-200 mt-10"
            >
              <Text>Don't have an account? </Text>
              <Text className="text-primary-500">Sign Up</Text>
            </Link>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <AlertModal
        visible={!!error}
        type="error"
        title="Sign In Failed"
        message={error}
        onClose={() => setError("")}
      />
    </KeyboardAvoidingView>
  );
};

export default SignIn;
