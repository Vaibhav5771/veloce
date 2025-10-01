import { Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Swiper from "react-native-swiper";
import { useRef, useState } from "react";
import { onboarding } from "@/constants";
import CustomButton from "@/components/CustomButton";
import GradientText from "@/components/GradientText";

const Onboarding = () => {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === onboarding.length - 1;

  return (
    <SafeAreaView className="flex h-full items-center justify-between bg-black">
      <TouchableOpacity
        onPress={() => {
          router.replace("/(auth)/sign-up");
        }}
        className="w-full flex justify-end items-end p-5"
      >
        <Text className="text-white text-md font-JakartaBold">Skip</Text>
      </TouchableOpacity>

      <Swiper
        ref={swiperRef}
        loop={false}
        dot={
          <View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0] rounded-full" />
        }
        activeDot={
          <View className="w-[32px] h-[4px] mx-1 bg-[#00FF1A] rounded-full" />
        }
        onIndexChanged={(index) => setActiveIndex(index)}
      >
        {onboarding.map((item) => (
          <View key={item.id} className="flex items-center justify-center p-5">
            <Image
              source={item.image}
              className="w-full h-[300px]"
              resizeMode="contain"
            />

            <View className="flex items-center justify-center w-full mt-10">
              {item.id === 2 ? (
                <View className="flex-row flex-wrap items-center justify-center text-center mx-10">
                  <Text className="text-white text-3xl font-bold">Your </Text>
                  <Text className="text-[#E51F2B] text-3xl font-bold">
                    Exotic{" "}
                  </Text>
                  <Text className="text-white text-3xl font-bold">
                    Ride is Just a Tap{" "}
                  </Text>
                  <Text className="text-[#6275DF] text-3xl font-bold">
                    away!
                  </Text>
                </View>
              ) : item.id === 3 ? (
                <View className="flex-col items-center justify-center text-center mx-5">
                  <Text className="text-white text-3xl font-bold">
                    Your ride, your way.
                  </Text>
                  <View className="flex-row">
                    <Text className="text-white text-3xl font-bold">
                      Let's get{" "}
                    </Text>
                    <Text className="text-[#00FF1A] text-3xl font-bold">
                      started!
                    </Text>
                  </View>
                </View>
              ) : (
                <Text className="text-white text-3xl font-bold text-center mx-10">
                  {item.title}
                </Text>
              )}
            </View>

            {item.id === 1 ? (
              <View className="flex-row items-center justify-center text-center mx-10 mt-3">
                <Text className="text-[14px] font-JakartaMedium text-[#858585]">
                  Choose{" "}
                </Text>
                <GradientText
                  text="Veloce"
                  style={{
                    fontSize: 20,
                  }}
                  className="font-OrbitianBold text-[#858585]"
                />
              </View>
            ) : (
              <Text className="text-lg font-JakartaSemiBold text-center text-[#858585] mx-10 mt-3">
                {item.description}
              </Text>
            )}
          </View>
        ))}
      </Swiper>

      <CustomButton
        title={isLastSlide ? "Get Started" : "Next"}
        onPress={() =>
          isLastSlide
            ? router.replace("/(auth)/sign-up")
            : swiperRef.current?.scrollBy(1)
        }
        className="w-9/12 mt-10"
      />
    </SafeAreaView>
  );
};

export default Onboarding;
