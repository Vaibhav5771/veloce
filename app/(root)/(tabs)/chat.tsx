import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants";

const Chat = () => {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <Text className="text-2xl font-JakartaBold text-white mt-5 mb-3 px-5">
        Chat
      </Text>

      <View className="flex-1 items-center justify-center px-5">
        <Image
          source={images.message}
          className="w-72 h-72"
          resizeMode="contain"
        />
        <Text className="text-xl font-JakartaSemiBold text-white mt-4">
          No Messages Yet
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Chat;
