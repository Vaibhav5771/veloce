import { useUser } from "@clerk/clerk-expo";
import { Text, View } from "react-native";

import DriverInfoCard from "@/components/DriverInfoCard";
import RideLayout from "@/components/RideLayout";
import TripAddressCard from "@/components/TripAddressCard";
import { formatTime } from "@/lib/utils";
import { useDriverStore, useLocationStore } from "@/store";
import Payment from "@/components/Payment";

const BookRide = () => {
  const { user } = useUser();
  const { userAddress, destinationAddress } = useLocationStore();
  const { drivers, selectedDriver } = useDriverStore();

  const driverDetails = drivers?.filter(
    (driver) => +driver.id === selectedDriver,
  )[0];

  return (
    <RideLayout
      title="Book Ride"
      snapPoints={["65%", "90%"]}
      onlyShowSelectedDriver
      footer={
        <Payment
          fullName={user?.fullName ?? driverDetails?.title ?? ""}
          email={user?.emailAddresses?.[0]?.emailAddress ?? ""}
          amount={driverDetails?.price ?? "0"}
          driverId={Number(driverDetails?.id) || 0}
          rideTime={driverDetails?.time ?? 0}
        />
      }
    >
      <Text className="text-2xl font-JakartaBold text-white mb-3">
        Ride Information
      </Text>

      <View className="mt-6">
        <DriverInfoCard driver={driverDetails} />
      </View>

      {/* Ride details card */}
      <View className="w-full bg-black rounded-2xl p-4 mt-6">
        <View className="flex flex-row items-center justify-between w-full border-b border-[#2A2A2A] py-3">
          <Text className="text-base font-JakartaSemiBold text-white">
            Ride Price
          </Text>
          <Text className="text-base font-JakartaSemiBold text-[#00FF1A]">
            ${driverDetails?.price}
          </Text>
        </View>

        <View className="flex flex-row items-center justify-between w-full border-b border-[#2A2A2A] py-3">
          <Text className="text-base font-JakartaSemiBold text-white">
            Pickup Time
          </Text>
          <Text className="text-base font-JakartaMedium text-general-200">
            {formatTime(driverDetails?.time!)}
          </Text>
        </View>

        <View className="flex flex-row items-center justify-between w-full py-3">
          <Text className="text-base font-JakartaSemiBold text-white">
            Car Seats
          </Text>
          <Text className="text-base font-JakartaMedium text-general-200">
            {driverDetails?.car_seats}
          </Text>
        </View>
      </View>

      {/* From / To */}
      <View className="mt-4">
        <TripAddressCard
          originAddress={userAddress}
          destinationAddress={destinationAddress}
        />
      </View>
    </RideLayout>
  );
};

export default BookRide;
