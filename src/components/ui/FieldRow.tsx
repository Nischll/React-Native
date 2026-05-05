import { Text, View } from "react-native";

export function FieldRow({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: "#6B7280",
          marginBottom: 5,
        }}
      >
        {label}
      </Text>
      {children}
      {error && (
        <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 3 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
