import React from "react";
import { Text } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

const GradientText = ({
  text,
  style,
  className,
}: {
  text: string;
  style?: any;
  className?: string;
}) => {
  return (
    <MaskedView
      maskElement={
        <Text
          style={[style, { fontFamily: "OrbitianBold" }]}
          className={className}
        >
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={["#6275DF", "#D4183F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text
          style={[style, { fontFamily: "OrbitianBold", opacity: 0 }]}
          className={className}
        >
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
