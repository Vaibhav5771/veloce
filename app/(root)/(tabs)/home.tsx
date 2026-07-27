import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Map from "@/components/Map";
import * as Location from "expo-location";
import { Text, View, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList } from "react-native";
import RideCard from "@/components/RideCard";
import { images } from "@/constants";
import { icons } from "@/constants";
import GoogleTextInput from "@/components/GoogleTextInput";
import GradientText from "@/components/GradientText";
import { useFetch } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { Ride } from "@/types/type";
import { useEffect, useState } from "react";

export default function Page() {
  const { user } = useUser();
  const { setUserLocation, setDestinationLocation } = useLocationStore();

  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const { data: recentRides, loading } = useFetch<Ride[]>(
    userEmail ? `/(api)/ride/${encodeURIComponent(userEmail)}` : "",
  );

  const [hasPermissions, setHasPermissions] = useState(false);

  const handleDestinationPress = (location: { latitude: number; longitude: number; address: string }) => {
    setDestinationLocation(location);
    router.push("/(root)/find-ride");
  };

  useEffect(() => {
    const requestLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasPermissions(false);
        console.warn("Location permission denied");
        // Set default San Francisco coordinates if permission is denied
        setUserLocation({
          latitude: 37.78825,
          longitude: -122.4324,
          address: "San Francisco, CA",
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude, // Correct: use latitude
        longitude: location.coords.longitude, // Correct: use longitude
      });

      const userAddress = address[0]
        ? `${address[0].name || ""}, ${address[0].city || address[0].region || "Unknown"}`
        : "Unknown Location";

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: userAddress,
      });
    };

    requestLocation();
  }, [setUserLocation]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <FlatList
        data={recentRides?.slice(0, 5)}
        renderItem={({ item }) => <RideCard ride={item} />}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        ListEmptyComponent={() => (
          <View className=" flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="No Recent Rides"
                  resizeMode="contain"
                />
                <Text className="text-sm text-white">No Recent Rides</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#fff" />
            )}
          </View>
        )}
        ListHeaderComponent={() => (
          <>
            <View className="flex flex-row items-center justify-between my-5">
              <GradientText
                text="Veloce"
                style={{
                  fontSize: 30,
                }}
                className="font-OrbitianBold text-[#858585]"
              />
            </View>
            <GoogleTextInput
              icon={icons.search}
              containerStyle="rounded-full bg-[#EFF4FF] shadow-md shadow-neutral-300"
              textInputBackgroundColor="#EFF4FF"
              handlePress={handleDestinationPress}
            />
            <>
              <Text className="text-2xl font-JakartaMedium text-general-200 mt-5 mb-3">
                Your current location
              </Text>
              <View className="w-full h-[300px] rounded-2xl overflow-hidden">
                <Map />
              </View>
            </>
            <Text className="text-2xl font-JakartaBold text-white mt-6 mb-3">
              Recent Rides
            </Text>
          </>
        )}
      />
    </SafeAreaView>
  );
}
