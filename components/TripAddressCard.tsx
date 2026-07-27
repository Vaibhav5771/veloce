import { Image, Text, View } from "react-native";
import { icons } from "@/constants";

const TripAddressCard = ({
  originAddress,
  destinationAddress,
}: {
  originAddress?: string | null;
  destinationAddress?: string | null;
}) => (
  <View className="w-full bg-neutral-900 rounded-2xl border-[0.5px] border-[#2A2A2A] px-4">
    <View className="flex flex-row items-center w-full border-b border-[#2A2A2A] py-4">
      <Image
        source={icons.to}
        className="w-5 h-5"
        style={{ tintColor: "white" }}
        resizeMode="contain"
      />
      <Text
        className="text-base font-JakartaMedium text-white ml-3 flex-1"
        numberOfLines={1}
      >
        {originAddress}
      </Text>
    </View>

    <View className="flex flex-row items-center w-full py-4">
      <Image
        source={icons.point}
        className="w-5 h-5"
        style={{ tintColor: "white" }}
        resizeMode="contain"
      />
      <Text
        className="text-base font-JakartaMedium text-white ml-3 flex-1"
        numberOfLines={1}
      >
        {destinationAddress}
      </Text>
    </View>
  </View>
);

export default TripAddressCard;
