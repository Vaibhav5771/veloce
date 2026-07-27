import { Ride } from "@/types/type";
import { View, Text, Image } from "react-native";
import { icons } from "@/constants";
import { formatDate, formatTime } from "@/lib/utils";

const RideCard = ({
  ride: {
    destination_longitude,
    destination_latitude,
    origin_address,
    destination_address,
    created_at,
    ride_time,
    driver,
    payment_status,
  },
}: {
  ride: Ride;
}) => {
  return (
    <View className="bg-neutral-900 rounded-2xl border-[0.5px] border-[#2A2A2A] p-4 mb-4">
      {/* Top: map thumbnail + addresses */}
      <View className="flex flex-row items-center">
        <Image
          source={{
            uri: `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${destination_longitude},${destination_latitude}&zoom=14&apiKey=${process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}`,
          }}
          className="w-[90px] h-[90px] rounded-xl"
        />

        <View className="flex-1 flex-col ml-4 gap-y-4">
          {/* Origin */}
          <View className="flex flex-row items-center gap-x-3">
            <Image
              source={icons.to}
              className="w-6 h-6"
              style={{ tintColor: "white" }}
              resizeMode="contain"
            />
            <Text
              className="flex-1 text-lg font-JakartaSemiBold text-white"
              numberOfLines={1}
            >
              {origin_address}
            </Text>
          </View>

          {/* Destination */}
          <View className="flex flex-row items-center gap-x-3">
            <Image
              source={icons.point}
              className="w-6 h-6"
              style={{ tintColor: "white" }}
              resizeMode="contain"
            />
            <Text
              className="flex-1 text-lg font-JakartaSemiBold text-white"
              numberOfLines={1}
            >
              {destination_address}
            </Text>
          </View>
        </View>
      </View>

      {/* Details table */}
      <View className="flex flex-row w-full mt-4 bg-black rounded-2xl p-4">
        {/* Labels column */}
        <View className="flex flex-col gap-y-4 pr-4">
          <Text className="text-base font-JakartaSemiBold text-white">
            Date & Time
          </Text>
          <Text className="text-base font-JakartaSemiBold text-white">
            Driver
          </Text>
          <Text className="text-base font-JakartaSemiBold text-white">
            Car Seats
          </Text>
          <Text className="text-base font-JakartaSemiBold text-white">
            Payment Status
          </Text>
        </View>

        {/* Divider */}
        <View className="w-[1px] bg-[#3A3A3A]" />

        {/* Values column */}
        <View className="flex-1 flex-col gap-y-4 pl-4">
          <Text
            className="text-base font-JakartaMedium text-general-200"
            numberOfLines={1}
          >
            {formatDate(created_at)}, {formatTime(ride_time)}
          </Text>
          <Text
            className="text-base font-JakartaMedium text-general-200"
            numberOfLines={1}
          >
            {driver.first_name} {driver.last_name}
          </Text>
          <Text className="text-base font-JakartaMedium text-general-200">
            {driver.car_seats}
          </Text>
          <Text
            className={`text-base capitalize font-JakartaSemiBold ${
              payment_status === "paid" ? "text-[#00FF1A]" : "text-[#E51F2B]"
            }`}
          >
            {payment_status}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default RideCard;
