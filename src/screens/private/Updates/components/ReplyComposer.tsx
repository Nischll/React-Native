import { useCreateCommunicationWithRefresh } from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
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
      }}
    >
      {parentAuthor && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <AppIcon name="return-down-forward" size={12} color="#94A3B8" />
          <Text style={{ fontSize: 11, color: "#94A3B8" }}>
            Replying to
            <Text style={{ fontWeight: "700" }}>{parentAuthor}</Text>
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
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || isPending}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: !text.trim() || isPending ? "#E2E8F0" : "#7C3AED",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 1 : 1,
          })}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <AppIcon
              name="send"
              size={16}
              color={!text.trim() ? "#94A3B8" : "#fff"}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}
