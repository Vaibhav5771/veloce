import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AlertModal from "@/components/AlertModal";
import CustomButton from "@/components/CustomButton";

const getInitials = (name?: string | null) => {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const ProfileField = ({ label, value }: { label: string; value: string }) => (
  <View className="mb-4">
    <Text className="text-sm font-JakartaMedium text-general-200 mb-2">
      {label}
    </Text>
    <View className="bg-neutral-900 rounded-xl border-[0.5px] border-[#2A2A2A] px-4 py-4">
      <Text className="text-base font-JakartaSemiBold text-white">
        {value}
      </Text>
    </View>
  </View>
);

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const name = user?.fullName || "User";
  const email = user?.primaryEmailAddress?.emailAddress || "No email on file";
  const phone = user?.primaryPhoneNumber?.phoneNumber || "No phone number";

  const handleSignOut = async () => {
    setShowLogoutConfirm(false);
    await signOut();
    router.replace("/(auth)/welcome");
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-5 flex-1">
        <Text className="text-2xl font-JakartaBold text-white mb-6">
          My Profile
        </Text>

        <View className="items-center mb-8">
          {user?.hasImage ? (
            <Image
              source={{ uri: user.imageUrl }}
              className="w-28 h-28 rounded-full border-[0.5px] border-[#2A2A2A]"
            />
          ) : (
            <View className="w-28 h-28 rounded-full bg-neutral-800 border-[0.5px] border-[#2A2A2A] items-center justify-center">
              <Text className="text-4xl font-JakartaBold text-[#00FF1A]">
                {getInitials(user?.fullName)}
              </Text>
            </View>
          )}
        </View>

        <ProfileField label="Name" value={name} />
        <ProfileField label="Email" value={email} />
        <ProfileField label="Phone" value={phone} />

        <View className="h-[1px] bg-[#2A2A2A] mt-2 mb-5" />

        <CustomButton
          title="Log-Out"
          bgVariant="danger"
          textVariant="light"
          onPress={() => setShowLogoutConfirm(true)}
        />
      </View>

      <AlertModal
        visible={showLogoutConfirm}
        type="error"
        title="Log-Out"
        message="Do you really want to logout?"
        buttonText="Yes, Log-Out"
        onClose={handleSignOut}
        secondaryButtonText="Cancel"
        onSecondaryPress={() => setShowLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
};

export default Profile;
