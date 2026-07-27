import CustomButton from "@/components/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, View } from "react-native";

type AlertModalProps = {
  visible: boolean;
  type?: "error" | "success";
  title: string;
  message?: string;
  buttonText?: string;
  onClose: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
};

const AlertModal = ({
  visible,
  type = "error",
  title,
  message,
  buttonText = "Done",
  onClose,
  secondaryButtonText,
  onSecondaryPress,
}: AlertModalProps) => {
  const isError = type === "error";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/70 px-8">
        <View className="w-full bg-black px-6 py-6 rounded-2xl border-[0.5px] border-[#2A2A2A]">
          <View className="items-center">
            <View
              className={`w-[72px] h-[72px] rounded-full items-center justify-center ${
                isError ? "bg-[#E51F2B]" : "bg-[#00FF1A]"
              }`}
            >
              <Ionicons
                name={isError ? "close" : "checkmark"}
                size={32}
                color={isError ? "white" : "black"}
              />
            </View>

            <Text
              className={`text-xl font-JakartaBold mt-4 text-center ${
                isError ? "text-[#E51F2B]" : "text-[#00FF1A]"
              }`}
            >
              {title}
            </Text>

            {!!message && (
              <Text className="text-base font-JakartaMedium text-[#858585] mt-1 text-center">
                {message}
              </Text>
            )}
          </View>

          <View className="h-[1px] bg-[#2A2A2A] mt-5 mb-5" />

          <CustomButton
            title={buttonText}
            bgVariant={isError ? "danger" : "primary"}
            textVariant={isError ? "light" : "default"}
            onPress={onClose}
          />

          {!!secondaryButtonText && (
            <CustomButton
              title={secondaryButtonText}
              bgVariant="outline"
              textVariant="light"
              onPress={onSecondaryPress}
              className="mt-3"
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
