import AppIcon from "@/src/components/ui/AppIcon";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

type InputSize = "sm" | "md" | "lg";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: InputSize;
  leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
  rightIcon?: React.ComponentProps<typeof Ionicons>["name"];
  onRightIconPress?: () => void;
}

export default function AppInput({
  label,
  error,
  size = "md",
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}: AppInputProps) {
  const sizeStyles = {
    sm: {
      container: "px-2 py-0 rounded-lg",
      text: "text-sm",
      icon: 16,
    },
    md: {
      container: "px-2 py-1 rounded-xl",
      text: "text-md",
      icon: 18,
    },
    lg: {
      container: "px-2 py-1 rounded-xl",
      text: "text-lg",
      icon: 20,
    },
  };

  const s = sizeStyles[size];

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
          border
          ${s.container}
          ${error ? "border-red-400" : "border-slate-300"}
        `}
      >
        {leftIcon && (
          <View className="mr-2">
            <AppIcon name={leftIcon} size={s.icon} color="#64748B" />
          </View>
        )}

        <TextInput
          className={`flex-1 ${s.text} text-slate-900`}
          placeholderTextColor="#94A3B8"
          {...props}
        />

        {rightIcon && (
          <Pressable onPress={onRightIconPress}>
            <AppIcon name={rightIcon} size={s.icon} color="#64748B" />
          </Pressable>
        )}
      </View>

      {error && <Text className="mt-2 text-sm text-red-500">{error}</Text>}
    </View>
  );
}
