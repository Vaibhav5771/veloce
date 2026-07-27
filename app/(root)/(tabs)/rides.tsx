import { useUser } from "@clerk/clerk-expo";
import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RideCard from "@/components/RideCard";
import { images } from "@/constants";
import { useFetch } from "@/lib/fetch";
import { Ride } from "@/types/type";

const Rides = () => {
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const { data: rides, loading } = useFetch<Ride[]>(
    userEmail ? `/(api)/ride/${encodeURIComponent(userEmail)}` : "",
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <FlatList
        data={rides ?? []}
        renderItem={({ item }) => <RideCard ride={item} />}
        className="px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={() => (
          <Text className="text-2xl font-JakartaBold text-white mt-5 mb-3">
            Your Rides
          </Text>
        )}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center mt-10">
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  resizeMode="contain"
                />
                <Text className="text-sm text-white">No Rides Yet</Text>
              </>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Rides;
