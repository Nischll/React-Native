import { useCreateCommunicationWithRefresh } from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

interface ReplyComposerProps {
  parentId: number;
  parentAuthor?: string;
  onDone?: () => void;
}

export function ReplyComposer({
  parentId,
  parentAuthor,
  onDone,
}: ReplyComposerProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const { mutate: create, isPending } = useCreateCommunicationWithRefresh();

  const hasText = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    create(
      { message: trimmed, parentId },
      {
        onSuccess: () => {
          setText("");
          onDone?.();
        },
      },
    );
  };

  return (
    <View
      style={{
        marginTop: 10,
        backgroundColor: "#F8FAFC",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingBottom: 10,
        overflow: "hidden",
      }}
    >
      {parentAuthor && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            borderBottomWidth: 1,
            borderBottomColor: "#F1F5F9",
          }}
        >
          <AppIcon name="return-down-forward" size={12} color="#94A3B8" />
          <Text style={{ fontSize: 11, color: "#94A3B8" }}>
            Replying to{" "}
            <Text style={{ fontWeight: "700", color: "#64748B" }}>
              {parentAuthor}
            </Text>
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          padding: 8,
          gap: 8,
        }}
      >
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Write a reply…"
          placeholderTextColor="#CBD5E1"
          multiline
          style={{
            flex: 1,
            fontSize: 14,
            color: "#1E293B",
            paddingVertical: 6,
            paddingHorizontal: 4,
            maxHeight: 100,
          }}
          autoFocus
        />

        {/* FIX: use hasText as the single source of truth for button state */}
        <Pressable
          onPress={handleSend}
          disabled={!hasText || isPending}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 10,
            // FIX: derive background directly from hasText, not from text.trim()
            // which can lag behind in render cycles
            backgroundColor: hasText && !isPending ? "#7C3AED" : "#E2E8F0",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed && hasText ? 0.85 : 1,
            // Smooth color transition
            // Note: RN doesn't support transition on backgroundColor natively,
            // but the state is now correct on every render
          })}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <AppIcon
              name="send"
              size={16}
              color={hasText ? "#fff" : "#94A3B8"}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}
