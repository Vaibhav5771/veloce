import { View, Text } from "react-native";
import type { SharedValue } from "react-native-reanimated";

// react-native-maps has no web build. This stub keeps expo-router's
// web/server route-manifest bundling (triggered by the app/(api) routes)
// from failing on native-only imports it pulls in via Map.tsx. The real
// map only ever renders on iOS/Android, where Map.tsx is used instead.
const Map = (_props: {
  gpsButtonBottom?: number | string | SharedValue<number>;
  onlyShowSelectedDriver?: boolean;
}) => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Map is not available on web.</Text>
    </View>
  );
};

export default Map;
