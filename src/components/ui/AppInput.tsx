import AppIcon from "@/src/components/ui/AppIcon";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
  rightIcon?: React.ComponentProps<typeof Ionicons>["name"];
  onRightIconPress?: () => void;
}

export default function AppInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}: AppInputProps) {
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          {label}
        </Text>
      )}

      <View
        className={`
          bg-surface
          flex-row items-center
          rounded-xl
          border
          px-2 py-1
          backdrop-blur-md
          ${
            error
              ? "border-red-400 bg-red-50/70"
              : "border-slate-300 bg-white/70"
          }
        `}
      >
        {leftIcon && (
          <View className="mr-3">
            <AppIcon name={leftIcon} size={20} color="#64748B" />
          </View>
        )}

        <TextInput
          className="flex-1 text-base text-slate-900"
          placeholderTextColor="#94A3B8"
          {...props}
        />

        {rightIcon && (
          <Pressable onPress={onRightIconPress}>
            <AppIcon name={rightIcon} size={20} color="#64748B" />
          </Pressable>
        )}
      </View>

      {error && <Text className="mt-2 text-sm text-red-500">{error}</Text>}
    </View>
  );
}
