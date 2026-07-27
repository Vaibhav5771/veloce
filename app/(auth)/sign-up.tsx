import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  Image,
  Text,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { images, icons } from "@/constants";
import { useState, useCallback, useRef } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import AlertModal from "@/components/AlertModal";
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

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const digitRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setVerification((prev) => ({ ...prev, code: newDigits.join("") }));
    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      setVerification((prev) => ({ ...prev, code: newDigits.join("") }));
      digitRefs.current[index - 1]?.focus();
    }
  };

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
    setDigits(Array(6).fill(""));
    setVerification({ state: "default", error: "", code: "" });
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

        <AlertModal
          visible={verification.state === "failed"}
          type="error"
          title="Sign Up Failed"
          message={verification.error}
          onClose={handleCancelVerification}
        />

        <Modal
          visible={verification.state === "pending"}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={handleCancelVerification}
        >
          <View className="flex-1 justify-center items-center bg-black/70 px-8">
            <View className="w-full bg-neutral-900 px-8 py-10 rounded-3xl items-center border-[0.5px] border-[#E2E2E2]">
              <Text
                className="text-3xl font-JakartaBold text-[#E51F2B] text-center"
                style={{ lineHeight: 40 }}
              >
                Verify Email
              </Text>
              <Text className="text-sm font-JakartaMedium text-white/70 text-center mt-3">
                We've sent a 6-digit code to{"\n"}{form.email}
              </Text>

              <View className="flex-row justify-between w-full mt-8 mb-2">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <TextInput
                      key={i}
                      ref={(ref) => {
                        digitRefs.current[i] = ref;
                      }}
                      value={digits[i]}
                      onChangeText={(val) => handleDigitChange(i, val)}
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(i, nativeEvent.key)
                      }
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                      selectionColor="#0286FF"
                      cursorColor="#0286FF"
                      style={{
                        width: 44,
                        height: 54,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: digits[i]
                          ? "#E51F2B"
                          : "rgba(226,226,226,0.3)",
                        backgroundColor: "rgba(255,255,255,0.07)",
                        color: "white",
                        fontSize: 24,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                  ))}
              </View>

              {!!verification.error && (
                <Text className="text-red-400 text-sm font-JakartaMedium text-center mt-3">
                  {verification.error}
                </Text>
              )}

              <CustomButton
                title={isLoading ? "Verifying..." : "Verify Email"}
                onPress={onVerifyPress}
                className="w-full mt-6"
                disabled={isLoading || verification.code.length < 6}
              />
              <CustomButton
                title="Cancel"
                bgVariant="dark"
                textVariant="light"
                onPress={handleCancelVerification}
                className="w-full mt-3"
              />
            </View>
          </View>
        </Modal>

        <AlertModal
          visible={showSuccessModal}
          type="success"
          title="Verified!"
          message="You have successfully verified your account"
          buttonText="Done"
          onClose={() => router.replace("/(root)/(tabs)/home")}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
