import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Text, View } from "react-native";
import AnimatedPressable from "../ui/AnimatedPressable";
import AppIcon from "../ui/AppIcon";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  variant?: "default" | "dashboard";
  showBackButton?: boolean;
  onBack?: () => void;
  /** Optional avatar image URL — shown instead of the icon when present (dashboard variant only) */
  avatarUrl?: string | null;
  /** Used to build initials fallback when there's no avatarUrl, e.g. firstName + lastName */
  firstName?: string | null;
  lastName?: string | null;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  variant = "default",
  showBackButton = false,
  onBack,
  avatarUrl,
  firstName,
  lastName,
}: PageHeaderProps) {
  const isDashboard = variant === "dashboard";

  return (
    <View
      className={`
        flex-row items-center gap-3 mb-4
        ${isDashboard ? "bg-primary" : "pb-2 border-b border-slate-300 border-opacity-50"}
      `}
    >
      {isDashboard ? (
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white/15 border border-white/25 overflow-hidden">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-base font-bold text-white">
              {getInitials(firstName, lastName)}
            </Text>
          )}
        </View>
      ) : (
        <View className="items-center justify-center">
          <AppIcon name={icon} size={22} color="#475569" />
        </View>
      )}

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
