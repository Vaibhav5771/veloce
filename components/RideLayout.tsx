import { View, Text, TouchableOpacity, Image, LayoutChangeEvent } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router } from "expo-router";
import { icons } from "@/constants";
import Map from "@/components/Map";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetFooter,
} from "@gorhom/bottom-sheet";
import { useCallback, useRef } from "react";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

// Fixed visual gap (px) kept between the GPS button and the sheet's current
// top edge, whatever snap point the sheet is resting at.
const GPS_BUTTON_GAP = 16;

const RideLayout = ({
  title,
  children,
  snapPoints = ["40%", "85%"],
  footer,
  onlyShowSelectedDriver = false,
}: {
  title: string;
  children: React.ReactNode;
  snapPoints?: string[];
  footer?: React.ReactNode;
  onlyShowSelectedDriver?: boolean;
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Tracks the bottom sheet's live top-edge position so the GPS button can
  // float just above it, however tall the current snap point is or however
  // the sheet is being dragged.
  const containerHeight = useSharedValue(0);
  const sheetPositionY = useSharedValue(0);
  const gpsButtonBottom = useDerivedValue(
    () => containerHeight.value - sheetPositionY.value + GPS_BUTTON_GAP,
  );

  const handleContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      containerHeight.value = event.nativeEvent.layout.height;
    },
    [containerHeight],
  );

  const renderFooter = useCallback(
    (props: any) => (
      <BottomSheetFooter {...props}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 24,
            backgroundColor: "#171717",
          }}
        >
          {footer}
        </View>
      </BottomSheetFooter>
    ),
    [footer],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-black" onLayout={handleContainerLayout}>
        {/* Map should take full space behind */}
        <Map
          gpsButtonBottom={gpsButtonBottom}
          onlyShowSelectedDriver={onlyShowSelectedDriver}
        />

        {/* Header (absolute on top of Map) */}
        <View className="flex flex-row absolute z-10 top-16 items-center justify-start px-5">
          <TouchableOpacity onPress={() => router.back()}>
            <View className="w-11 h-11 bg-black rounded-full items-center justify-center">
              <Image
                source={icons.backArrow}
                resizeMode="contain"
                className="w-6 h-6"
                style={{ tintColor: "#FFFFFF" }}
              />
            </View>
          </TouchableOpacity>
          <Text className="text-3xl font-JakartaLight text-white ml-5">
            {title || "Go Back"}
          </Text>
        </View>

        {/* Bottom Sheet overlays on Map */}
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={0}
          animatedPosition={sheetPositionY}
          enableHandlePanningGesture={false}
          enableContentPanningGesture={false}
          enableOverDrag={false}
          backgroundStyle={{ backgroundColor: "#171717" }}
          handleIndicatorStyle={{ backgroundColor: "#4A4A4A" }}
          footerComponent={footer ? renderFooter : undefined}
        >
          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          >
            {children}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default RideLayout;
