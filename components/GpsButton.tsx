import { TouchableOpacity, Image, type DimensionValue } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { icons } from "@/constants";

type GpsButtonProps = {
  onPress: () => void;
  bottom?: number | string | SharedValue<number>;
  right?: number | string;
};

const isSharedValue = (
  value: GpsButtonProps["bottom"],
): value is SharedValue<number> =>
  typeof value === "object" && value !== null && "value" in value;

const GpsButton = ({ onPress, bottom = 16, right = 16 }: GpsButtonProps) => {
  const dynamicBottom = isSharedValue(bottom) ? bottom : undefined;
  const staticBottom = isSharedValue(bottom) ? undefined : bottom;

  // When the caller hands us a shared value (RideLayout tracking the bottom
  // sheet's live position), follow it reactively; otherwise stay static.
  const animatedStyle = useAnimatedStyle(() => {
    return dynamicBottom ? { bottom: dynamicBottom.value } : {};
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: staticBottom as DimensionValue | undefined,
          right: right as DimensionValue,
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "#000000",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 0.5,
          borderColor: "rgba(255,255,255,0.2)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={icons.target}
          style={{ width: 24, height: 24, tintColor: "#FFFFFF" }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default GpsButton;
