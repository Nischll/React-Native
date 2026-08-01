import React from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import AppButton from "../ui/AppButton";
import AppIcon from "../ui/AppIcon";

interface FormSheetModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export default function FormSheetModal({
  visible,
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel = "Save",
  loading = false,
  children,
}: FormSheetModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            className="max-h-[88%] rounded-t-3xl bg-white"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: -4 },
              elevation: 10,
            }}
          >
            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-bold text-textPrimary">
                  {title}
                </Text>
                {subtitle ? (
                  <Text className="mt-0.5 text-xs text-textSecondary">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                className="h-9 w-9 items-center justify-center rounded-full bg-surfaceMuted"
              >
                <AppIcon name="close" size={18} color="#453956" />
              </Pressable>
            </View>

            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingVertical: 16, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            <View className="border-t border-gray-100 px-5 py-4">
              <AppButton loading={loading} onPress={onSubmit}>
                {submitLabel}
              </AppButton>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}
