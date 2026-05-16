import { Text } from "react-native";

export function MessageText({ text }: { text: string }) {
  const parts = text.split(/(@\S+)/g);
  return (
    <Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <Text key={i} style={{ color: "#7C3AED", fontWeight: "700" }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}
