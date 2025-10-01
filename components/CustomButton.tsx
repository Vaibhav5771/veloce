import { Text, TouchableOpacity } from "react-native";
import { ButtonProps } from "@/types/type";

const getBgVarientStyle = (varient: ButtonProps["bgVariant"]) => {
  switch (varient) {
    case "secondary":
      return "bg-gray-500"; // fixed: grey → gray
    case "danger":
      return "bg-red-500";
    case "success":
      return "bg-green-500";
    case "outline":
      return "bg-transparent border-neutral-300 border-[0.5px]";
    default:
      return "bg-[#00FF1A]";
  }
};

const getTextVarientStyle = (varient: ButtonProps["textVariant"]) => {
  switch (varient) {
    case "primary":
      return "text-black";
    case "secondary":
      return "text-gray-100"; // fixed: grey → gray
    case "danger":
      return "text-red-100";
    case "success":
      return "text-green-500"; // fixed: was bg-green-500
    default:
      return "text-black";
  }
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className,
  ...props
}: ButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    className={`w-full rounded-full p-3 flex flex-row justify-center items-center shadow-md shadow-neutral-400/70 ${getBgVarientStyle(
      bgVariant,
    )} ${className}`}
  >
    {IconLeft && <IconLeft />}
    <Text className={`text-lg font-bold ${getTextVarientStyle(textVariant)}`}>
      {title}
    </Text>
    {IconRight && <IconRight />}
  </TouchableOpacity>
);

export default CustomButton;
