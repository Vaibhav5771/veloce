import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import DriverInfoCard from "@/components/DriverInfoCard";
import RideLayout from "@/components/RideLayout";
import TripAddressCard from "@/components/TripAddressCard";
import { formatTime } from "@/lib/utils";
import { useDriverStore, useLocationStore } from "@/store";

const ETA_TICK_MS = 8000;

const TrackRide = () => {
  const { userAddress, destinationAddress } = useLocationStore();
  const { drivers, selectedDriver } = useDriverStore();

  const driverDetails = drivers?.filter(
    (driver) => +driver.id === selectedDriver,
  )[0];

  const [etaMinutes, setEtaMinutes] = useState(driverDetails?.time ?? 10);

  useEffect(() => {
    const interval = setInterval(() => {
      setEtaMinutes((prev) => (prev <= 1 ? 1 : prev - 1));
    }, ETA_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <RideLayout
      title="On the way"
      snapPoints={["60%", "85%"]}
      onlyShowSelectedDriver
      footer={
        <CustomButton
          title="Back Home"
          onPress={() => router.replace("/(root)/(tabs)/home")}
        />
      }
    >
      <View className="flex flex-row items-baseline flex-wrap">
        <Text className="text-2xl font-JakartaBold text-white">
          Arriving in{" "}
        </Text>
        <Text className="text-2xl font-JakartaBold text-[#00FF1A]">
          {formatTime(etaMinutes)}
        </Text>
      </View>

      <View className="h-[1px] bg-[#2A2A2A] mt-4 mb-4" />

      <View className="mb-4">
        <DriverInfoCard driver={driverDetails} />
      </View>

      <TripAddressCard
        originAddress={userAddress}
        destinationAddress={destinationAddress}
      />
    </RideLayout>
  );
};

export default TrackRide;
