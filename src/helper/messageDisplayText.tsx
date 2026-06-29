import { Text, TextStyle } from "react-native";

export function MessageText({
  text,
  textStyle,
}: {
  text: string;
  textStyle?: TextStyle;
}) {
  const parts = text.split(/(@\S+)/g);
  return (
    <Text
      style={{ fontSize: 14, color: "#334155", lineHeight: 22, ...textStyle }}
    >
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <Text
            key={i}
            style={{
              color: textStyle?.color ? "rgba(255,255,255,0.9)" : "#7C3AED",
              fontWeight: "700",
            }}
          >
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}
