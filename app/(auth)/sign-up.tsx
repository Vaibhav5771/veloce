import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  Image,
  Text,
  Platform,
} from "react-native";
import { images, icons } from "@/constants";
import { ReactNode, useState, useCallback } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignUp, useUser } from "@clerk/clerk-expo";

interface FormState {
  name: string;
  email: string;
  password: string;
}

interface VerificationState {
  state: "default" | "pending" | "success" | "failed";
  error: string;
  code: string;
}

interface ModalProps {
  isVisible: boolean;
  children: ReactNode;
  onModalHide?: () => void;
}

const ReactNativeModal = ({ isVisible, children, onModalHide }: ModalProps) => {
  if (!isVisible) return null;
  return (
    <View className="absolute inset-0 flex-1 justify-center items-center bg-black/50">
      {children}
    </View>
  );
};

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { user } = useUser();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState<VerificationState>({
    state: "default",
    error: "",
    code: "",
  });

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Name is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "Please enter a valid email address";
    }
    if (form.password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return "";
  };

  const onSignUpPress = useCallback(async () => {
    if (!isLoaded || isLoading || verification.state === "pending") {
      if (!isLoaded) {
        setVerification((prev) => ({
          ...prev,
          error: "Authentication service is not ready. Please try again.",
          state: "failed",
        }));
      }
      return;
    }

    setIsLoading(true);
    const validationError = validateForm();
    if (validationError) {
      setVerification((prev) => ({
        ...prev,
        error: validationError,
        state: "failed",
      }));
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting sign-up with:", form);
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      console.log("Sign-up created, preparing verification");
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      console.log("Verification prepared, state set to pending");
      setVerification((prev) => ({
        ...prev,
        state: "pending",
        error: "",
        code: "",
      }));
    } catch (err: any) {
      console.error("SignUp error:", JSON.stringify(err, null, 2));
      let errorMessage = "Failed to sign up. Please try again.";
      if (err.errors?.[0]?.code === "form_identifier_exists") {
        errorMessage =
          "This email is already registered. Please sign in or use a different email.";
      } else {
        errorMessage =
          err.errors?.[0]?.longMessage ??
          err.errors?.[0]?.message ??
          errorMessage;
      }
      setVerification((prev) => ({
        ...prev,
        error: errorMessage,
        state: "failed",
      }));
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading, form, verification.state, signUp]);

  const onVerifyPress = useCallback(async () => {
    if (!isLoaded || isLoading) return;
    setIsLoading(true);

    if (!verification.code.trim()) {
      setVerification((prev) => ({
        ...prev,
        error: "Please enter the verification code",
        state: "failed",
      }));
      setIsLoading(false);
      return;
    }

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (
        signUpAttempt.status === "complete" &&
        signUpAttempt.createdSessionId
      ) {
        await setActive({ session: signUpAttempt.createdSessionId });

        // Update Clerk user first name
        if (user) {
          await user.update({
            firstName: form.name,
          });
        }

        // ---- New: Send data to your API ----
        if (signUpAttempt.status === "complete") {
          try {
            await fetch("/(api)/user", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: form.name,
                email: form.email,
                clerkId: signUpAttempt.createdUserId,
              }),
            });
          } catch (apiErr) {
            console.error("Failed to call API:", apiErr);
          }
        }
        // ------------------------------------

        setVerification((prev) => ({
          ...prev,
          state: "success",
          error: "",
          code: "",
        }));
        setShowSuccessModal(true);
      } else {
        setVerification((prev) => ({
          ...prev,
          error: "Verification failed. Please try again.",
          state: "failed",
        }));
      }
    } catch (err: any) {
      console.error("Verification error:", JSON.stringify(err, null, 2));
      setVerification((prev) => ({
        ...prev,
        error:
          err.errors?.[0]?.longMessage ??
          err.errors?.[0]?.message ??
          "Invalid verification code",
        state: "failed",
      }));
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoaded,
    isLoading,
    verification.code,
    signUp,
    setActive,
    user,
    form.name,
    form.email,
  ]);

  const handleCancelVerification = () => {
    setVerification((prev) => ({
      ...prev,
      state: "default",
      error: "",
      code: "",
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView className="flex-1 bg-black">
        <View className="bg-white">
          <Image
            source={images.signUpCar}
            className="w-full h-[300px]"
            resizeMode="cover"
          />
          <View className="absolute bottom-5 left-5">
            <Text className="text-3xl font-JakartaMedium text-white">
              Create Your <Text className="text-[#00FF1A]">Account</Text>
            </Text>
          </View>
        </View>

        <View className="p-5">
          {verification.state === "failed" && (
            <Text className="text-red-500 mb-3 text-center">
              {verification.error}
            </Text>
          )}
          <InputField
            label="Name"
            placeholder="Enter your name"
            icon={icons.person}
            value={form.name}
            onChangeText={(value) => setForm({ ...form, name: value })}
          />
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
            title="Sign Up"
            onPress={onSignUpPress}
            className="mt-6"
            disabled={isLoading || verification.state === "pending"}
          />

          <OAuth />

          <Link
            href="/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            <Text className="text-white">Already have an account? </Text>
            <Text className="text-primary-500">Log In</Text>
          </Link>
        </View>

        <ReactNativeModal isVisible={verification.state === "pending"}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px] w-4/5">
            <Text className="text-2xl font-JakartaBold mb-2">Verification</Text>
            <Text className="font-JakartaMedium mb-5">
              We've sent a verification code to {form.email}
            </Text>
            <InputField
              label="Code"
              icon={icons.email}
              placeholder="Enter Code"
              value={verification.code}
              keyboardType="numeric"
              onChangeText={(code) =>
                setVerification((prev) => ({ ...prev, code }))
              }
            />
            {verification.error && (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            )}
            <CustomButton
              title="Verify Email"
              onPress={onVerifyPress}
              className="mt-5 bg-success-500"
              disabled={isLoading}
            />
            <CustomButton
              title="Cancel"
              onPress={handleCancelVerification}
              className="mt-3 bg-gray-500"
            />
          </View>
        </ReactNativeModal>

        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px] w-4/5">
            <Image
              source={images.check}
              className="w-[110px] h-[110px] mx-auto my-5"
              resizeMode="contain"
            />
            <Text className="text-3xl font-JakartaMedium text-center">
              Verified
            </Text>
            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              You have successfully verified your account
            </Text>
            <CustomButton
              title="Browse Home"
              onPress={() => router.replace("/(root)/(tabs)/home")}
              className="mt-5"
            />
          </View>
        </ReactNativeModal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
