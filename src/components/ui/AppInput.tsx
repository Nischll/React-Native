import AppIcon from "@/src/components/ui/AppIcon";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

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
  style,
  editable = true,
  ...props
}: AppInputProps) {
  const sizeStyles = {
    sm: {
      container: "px-3 rounded-lg",
      text: "text-sm",
      icon: 16,
      minHeight: 40,
      paddingVertical: Platform.OS === "ios" ? 10 : 8,
      fontSize: 14,
      lineHeight: 20,
    },
    md: {
      container: "px-3 rounded-xl",
      text: "text-base",
      icon: 18,
      minHeight: 48,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      fontSize: 16,
      lineHeight: 22,
    },
    lg: {
      container: "px-4 rounded-xl",
      text: "text-lg",
      icon: 20,
      minHeight: 52,
      paddingVertical: Platform.OS === "ios" ? 14 : 12,
      fontSize: 18,
      lineHeight: 24,
    },
  };

  const s = sizeStyles[size];

  return (
    <View className="w-full">
      {label && (
        <Text className="mb-2 text-base font-semibold text-slate-700">
          {label}
        </Text>
      )}

      <View
        className={`
          flex-row items-center
          border
          ${s.container}
          ${editable === false ? "bg-slate-100" : "bg-white"}
          ${error ? "border-red-400" : "border-slate-300"}
        `}
        style={{ minHeight: s.minHeight }}
      >
        {leftIcon && (
          <View className="mr-2">
            <AppIcon name={leftIcon} size={s.icon} color="#64748B" />
          </View>
        )}

        <TextInput
          className={`flex-1 ${s.text} text-slate-900`}
          placeholderTextColor="#94A3B8"
          editable={editable}
          underlineColorAndroid="transparent"
          style={[
            {
              paddingVertical: s.paddingVertical,
              fontSize: s.fontSize,
              lineHeight: Platform.OS === "ios" ? s.lineHeight : undefined,
              color: "#0F172A",
              ...(Platform.OS === "ios"
                ? { paddingTop: s.paddingVertical, paddingBottom: s.paddingVertical }
                : null),
            },
            style,
          ]}
          {...props}
        />

        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <AppIcon name={rightIcon} size={s.icon} color="#64748B" />
          </Pressable>
        )}
      </View>

      {error && <Text className="mt-2 text-sm text-red-500">{error}</Text>}
    </View>
  );
}
