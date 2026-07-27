import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { useEffect } from "react";

import CustomButton from "@/components/CustomButton";
import GoogleTextInput from "@/components/GoogleTextInput";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { useLocationStore } from "@/store";

const FindRide = () => {
  const {
    userAddress,
    destinationAddress,
    setDestinationLocation,
    setUserLocation,
  } = useLocationStore();

  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    address?: string;
  }>();

  useEffect(() => {
    if (params.latitude && params.longitude && params.address) {
      setDestinationLocation({
        latitude: parseFloat(params.latitude),
        longitude: parseFloat(params.longitude),
        address: params.address,
      });
    }
  }, [params.latitude, params.longitude, params.address]);

  return (
    <RideLayout
      title="Ride"
      snapPoints={["60%", "90%"]}
      footer={
        <CustomButton
          title="Find Now"
          onPress={() => router.push(`/(root)/confirm-ride`)}
        />
      }
    >
      <View className="my-3">
        <Text className="text-2xl font-JakartaBold text-white mb-3">From</Text>

        <GoogleTextInput
          icon={icons.point}
          initialLocation={userAddress ?? ""}
          placeholder="From location"
          containerStyle="rounded-full bg-[#EFF4FF]"
          textInputBackgroundColor="#EFF4FF"
          handlePress={(location) => setUserLocation(location)}
        />
      </View>

      <View className="my-3">
        <Text className="text-2xl font-JakartaBold text-white mb-3">To</Text>

        <GoogleTextInput
          icon={icons.point}
          initialLocation={destinationAddress ?? ""}
          placeholder="To location"
          containerStyle="rounded-full bg-[#EFF4FF]"
          textInputBackgroundColor="#EFF4FF"
          handlePress={(location) => setDestinationLocation(location)}
        />
      </View>
    </RideLayout>
  );
};

export default FindRide;
