import { Text, TextStyle } from "react-native";

export const MENTION_EMAIL_PATTERN =
  /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

type MessageSegment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; email: string };

export function parseMessageWithMentions(message: string): MessageSegment[] {
  if (!message) return [];

  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  for (const match of message.matchAll(MENTION_EMAIL_PATTERN)) {
    const start = match.index ?? 0;
    const full = match[0];
    const email = match[1];

    if (start > lastIndex) {
      segments.push(...splitGenericMentions(message.slice(lastIndex, start)));
    }

    segments.push({ type: "mention", value: full, email });
    lastIndex = start + full.length;
  }

  if (lastIndex < message.length) {
    segments.push(...splitGenericMentions(message.slice(lastIndex)));
  }

  return segments.length > 0 ? segments : [{ type: "text", value: message }];
}

function splitGenericMentions(text: string): MessageSegment[] {
  if (!text) return [];
  return text
    .split(/(@\S+)/g)
    .filter((part) => part.length > 0)
    .map((part) =>
      part.startsWith("@")
        ? { type: "mention" as const, value: part, email: part.slice(1) }
        : { type: "text" as const, value: part },
    );
}

export function MessageText({
  text,
  textStyle,
  currentUserEmail,
}: {
  text: string;
  textStyle?: TextStyle;
  currentUserEmail?: string | null;
}) {
  const segments = parseMessageWithMentions(text);
  const normalizedUserEmail = currentUserEmail?.trim().toLowerCase() ?? null;
  const onDark =
    typeof textStyle?.color === "string" &&
    textStyle.color.replace(/\s/g, "").toLowerCase() === "#ffffff";

  return (
    <Text
      style={{ fontSize: 14, color: "#334155", lineHeight: 22, ...textStyle }}
    >
      {segments.map((segment, i) => {
        if (segment.type === "text") {
          return <Text key={`text-${i}`}>{segment.value}</Text>;
        }

        const isCurrentUser =
          normalizedUserEmail != null &&
          segment.email.toLowerCase() === normalizedUserEmail;

        return (
          <Text
            key={`mention-${i}-${segment.email}`}
            style={{
              color: onDark
                ? "#FFFFFF"
                : isCurrentUser
                  ? "#6D28D9"
                  : "#0369A1",
              fontWeight: "700",
              backgroundColor: onDark
                ? "rgba(255,255,255,0.18)"
                : isCurrentUser
                  ? "#EDE9FE"
                  : "#E0F2FE",
            }}
          >
            {segment.value}
          </Text>
        );
      })}
    </Text>
  );
}
