import { Text, View } from "react-native";

// Generates a consistent color from a name string
function nameToColor(name: string): string {
  const colors = [
    "#7C3AED", "#2563EB", "#059669", "#D97706",
    "#DC2626", "#0891B2", "#7C2D12", "#1D4ED8",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AuthorAvatarProps {
  fullName: string;
  size?: number;
  fontSize?: number;
}

export function AuthorAvatar({ fullName, size = 36, fontSize = 13 }: AuthorAvatarProps) {
  const bg = nameToColor(fullName);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize, fontWeight: "700" }}>
        {getInitials(fullName)}
      </Text>
    </View>
  );
}
