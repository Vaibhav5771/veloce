import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AlertModal from "@/components/AlertModal";
import RideCard from "@/components/RideCard";
import { images } from "@/constants";
import { fetchAPI, useFetch } from "@/lib/fetch";
import { Ride } from "@/types/type";

const Rides = () => {
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const { data: rides, loading, refetch } = useFetch<Ride[]>(
    userEmail ? `/(api)/ride/${encodeURIComponent(userEmail)}` : "",
  );

  // Tab screens stay mounted, so refetch on focus to reflect newly booked rides.
  useFocusEffect(
    useCallback(() => {
      if (userEmail) refetch();
    }, [userEmail, refetch]),
  );

  // Ride pending confirmation for deletion; null means the confirm modal is closed.
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    if (id === null) return;

    try {
      const result = await fetchAPI("/(api)/ride/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, user_email: userEmail }),
      });
      // fetchAPI throws on non-2xx; this also catches a 200 carrying an error body.
      if (result?.error) throw new Error(result.error);
      refetch();
    } catch {
      setShowError(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <AlertModal
        visible={pendingDeleteId !== null}
        type="error"
        title="Delete ride"
        message="Are you sure you want to remove this ride from your history?"
        buttonText="Delete"
        onButtonPress={confirmDelete}
        secondaryButtonText="Cancel"
        onSecondaryPress={() => setPendingDeleteId(null)}
        onClose={() => setPendingDeleteId(null)}
      />

      <AlertModal
        visible={showError}
        type="error"
        title="Couldn't delete ride"
        message="Something went wrong. Please try again."
        buttonText="Done"
        onClose={() => setShowError(false)}
      />

      <FlatList
        data={rides ?? []}
        renderItem={({ item }) => (
          <RideCard ride={item} onDelete={setPendingDeleteId} />
        )}
        className="px-5"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        ListHeaderComponent={() => (
          <Text className="text-2xl font-JakartaBold text-white mt-5 mb-3">
            Your Rides
          </Text>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center px-5">
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Image
                  source={images.noResult}
                  className="w-52 h-52"
                  resizeMode="contain"
                />
                <Text className="text-xl font-JakartaSemiBold text-white mt-4">
                  No Rides Yet
                </Text>
              </>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Rides;
