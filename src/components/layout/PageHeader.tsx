// PageHeader.tsx — unchanged from original, back button stays as router.back()
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import AnimatedPressable from "../ui/AnimatedPressable";
import AppIcon from "../ui/AppIcon";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  variant?: "default" | "dashboard";
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  variant = "default",
  showBackButton = false,
  onBack,
}: PageHeaderProps) {
  const isDashboard = variant === "dashboard";

  return (
    <View
      className={`
        flex-row items-center gap-2 mb-4
        ${isDashboard ? "bg-primary" : "pb-2 border-b border-slate-300 border-opacity-50"}
      `}
    >
      <View className="items-center justify-center">
        <AppIcon
          name={icon}
          size={22}
          color={isDashboard ? "#FFFFFF" : "#475569"}
        />
      </View>

      <View className="flex-1">
        <Text
          className={`text-xl font-bold ${
            isDashboard ? "text-surface" : "text-textPrimary"
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className={`text-base ${
              isDashboard ? "text-surface" : "text-textSecondary"
            }`}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {showBackButton && (
        <AnimatedPressable
          onPress={onBack ?? (() => router.back())}
          className="mt-1"
        >
          <View
            className={`
              h-10 w-10 items-center justify-center rounded-xl
              ${isDashboard ? "bg-white/20" : "bg-surfaceMuted"}
            `}
          >
            <AppIcon
              name="arrow-back"
              size={20}
              color={isDashboard ? "#FFFFFF" : "#453956"}
            />
          </View>
        </AnimatedPressable>
      )}
    </View>
  );
}
