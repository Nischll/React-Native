import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Text, View } from "react-native";
import AppIcon from "../components/ui/AppIcon";

export function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: string;
  label: string;
  value: string | number;
  loading?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 14,
      }}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0.08)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 10,
          alignItems: "center",
          gap: 6,

          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
        }}
      >
        {/* Icon circle */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.18)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name={icon as any} size={15} color="#fff" />
        </View>

        {/* Value */}
        {loading ? (
          <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
        ) : (
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#fff",
              lineHeight: 24,
            }}
          >
            {value}
          </Text>
        )}

        {/* Label */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: "600",
            color: "rgba(255,255,255,0.65)",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
          numberOfLines={2}
        >
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
}
