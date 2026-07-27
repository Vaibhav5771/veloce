import { router } from "expo-router";
import { FlatList } from "react-native";

import CustomButton from "@/components/CustomButton";
import DriverCard from "@/components/DriverCard";
import RideLayout from "@/components/RideLayout";
import { useDriverStore } from "@/store";

const ConfirmRide = () => {
  const { drivers, selectedDriver, setSelectedDriver } = useDriverStore();

  return (
    <RideLayout
      title="Choose a Ride"
      snapPoints={["65%", "85%"]}
      footer={
        <CustomButton
          title="Select Ride"
          onPress={() => router.push("/(root)/book-ride")}
        />
      }
    >
      <FlatList
        data={drivers}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <DriverCard
            selected={selectedDriver!}
            setSelected={() => setSelectedDriver(Number(item.id)!)}
            item={item}
          />
        )}
        scrollEnabled={false}
      />
    </RideLayout>
  );
};

export default ConfirmRide;
