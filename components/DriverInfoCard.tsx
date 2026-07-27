import { Image, Text, View } from "react-native";
import { icons } from "@/constants";
import { MarkerData } from "@/types/type";

const DriverInfoCard = ({ driver }: { driver?: MarkerData }) => (
  <View className="flex flex-row items-center bg-neutral-900 rounded-2xl border-[0.5px] border-[#2A2A2A] p-4">
    <Image
      source={{ uri: driver?.profile_image_url }}
      className="w-16 h-16 rounded-full"
    />
    <View className="flex-1 mx-4">
      <Text
        className="text-base font-JakartaSemiBold text-white"
        numberOfLines={1}
      >
        {driver?.title}
      </Text>
      <View className="flex flex-row items-center mt-1">
        <Image
          source={icons.star}
          className="w-4 h-4"
          style={{ tintColor: "#FBBF24" }}
          resizeMode="contain"
        />
        <Text className="text-sm font-JakartaMedium text-white ml-1">
          {driver?.rating}
        </Text>
      </View>
    </View>
    <Image
      source={{ uri: driver?.car_image_url }}
      className="w-16 h-14"
      resizeMode="contain"
    />
  </View>
);

export default DriverInfoCard;
