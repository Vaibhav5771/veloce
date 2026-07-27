import React from "react";
import { Image, Text, View, TouchableOpacity } from "react-native";

import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import { DriverCardProps } from "@/types/type";

const DriverCard = ({ item, selected, setSelected }: DriverCardProps) => {
  const isSelected = selected === Number(item.id);

  return (
    <TouchableOpacity
      onPress={setSelected}
      activeOpacity={0.85}
      className={`flex flex-row items-center rounded-2xl p-4 mb-4 border ${
        isSelected
          ? "bg-neutral-800 border-[#00FF1A]"
          : "bg-neutral-900 border-[#2A2A2A]"
      }`}
    >
      {/* Driver photo */}
      <Image
        source={{ uri: item.profile_image_url }}
        className="w-16 h-16 rounded-full"
      />

      {/* Info */}
      <View className="flex-1 mx-4">
        <View className="flex flex-row items-center mb-2">
          <Text
            className="text-base font-JakartaSemiBold text-white"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View className="flex flex-row items-center ml-2">
            <Image
              source={icons.star}
              className="w-4 h-4"
              style={{ tintColor: "#FBBF24" }}
            />
            <Text className="text-sm font-JakartaMedium text-white ml-1">
              {item.rating}
            </Text>
          </View>
        </View>

        <View className="flex flex-row items-center">
          <Text className="text-sm font-JakartaSemiBold text-[#00FF1A]">
            ${item.price}
          </Text>
          <Text className="text-general-200 mx-2">|</Text>
          <Text className="text-sm font-JakartaMedium text-general-200">
            {formatTime(item.time!)}
          </Text>
          <Text className="text-general-200 mx-2">|</Text>
          <Text className="text-sm font-JakartaMedium text-general-200">
            {item.car_seats} seats
          </Text>
        </View>
      </View>

      {/* Car image */}
      <Image
        source={{ uri: item.car_image_url }}
        className="w-16 h-14"
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

export default DriverCard;
