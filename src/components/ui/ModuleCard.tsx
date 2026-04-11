import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import AppIcon from "./AppIcon";

interface ModuleCardProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  variant?: "default" | "glass";
}

export default function ModuleCard({
  title,
  subtitle,
  icon,
  onPress,
  variant = "default",
}: ModuleCardProps) {
  const baseStyle =
    variant === "glass"
      ? "bg-white/70 border border-white/40"
      : "bg-white border border-slate-200";

  return (
    <Pressable
      onPress={onPress}
      className={`
        flex-row items-center
        rounded-xl
        p-4
        ${baseStyle}
        active:opacity-80
      `}
    >
      {/* Icon */}
      <View className="mr-4 items-center justify-center">
        <AppIcon name={icon} size={26} color="#2563EB" />
      </View>

      {/* Text Content */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-slate-900">{title}</Text>

        {subtitle && (
          <Text className="mt-1 text-sm text-slate-500">{subtitle}</Text>
        )}
      </View>

      {/* Arrow */}
      <AppIcon name="chevron-forward" size={20} color="#94A3B8" />
    </Pressable>
  );
}
