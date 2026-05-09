import AppIcon from "@/src/components/ui/AppIcon";
import { useCreateCommunicationWithRefresh } from "@/src/api/communication.api";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

export function NoticeComposer() {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { mutate: create, isPending } = useCreateCommunicationWithRefresh();

  const handlePost = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    create(
      { message: trimmed, parentId: null },
      {
        onSuccess: () => {
          setText("");
          setFocused(false);
          inputRef.current?.blur();
        },
      }
    );
  };

  const handleCancel = () => {
    setText("");
    setFocused(false);
    inputRef.current?.blur();
  };

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 18,
        borderWidth: focused ? 1.5 : 1,
        borderColor: focused ? "#7C3AED" : "#E2E8F0",
        marginBottom: 16,
        overflow: "hidden",
        shadowColor: focused ? "#7C3AED" : "#000",
        shadowOpacity: focused ? 0.08 : 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: focused ? 4 : 1,
      }}
    >
      <View style={{ paddingHorizontal: 14, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
        <AppIcon name="megaphone-outline" size={14} color="#7C3AED" />
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#7C3AED", letterSpacing: 0.5 }}>
          POST A NOTICE
        </Text>
      </View>

      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        onFocus={() => setFocused(true)}
        placeholder="Share an update with the team…"
        placeholderTextColor="#CBD5E1"
        multiline
        style={{
          fontSize: 14,
          color: "#1E293B",
          paddingHorizontal: 14,
          paddingTop: 8,
          paddingBottom: focused ? 4 : 12,
          minHeight: focused ? 80 : 40,
          maxHeight: 160,
        }}
      />

      {focused && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", paddingHorizontal: 12, paddingBottom: 10, gap: 8 }}>
          <Pressable
            onPress={handleCancel}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: "#F1F5F9" }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#64748B" }}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handlePost}
            disabled={!text.trim() || isPending}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: !text.trim() || isPending ? "#E2E8F0" : "#7C3AED",
            }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <AppIcon name="send" size={14} color={!text.trim() ? "#94A3B8" : "#fff"} />
            )}
            <Text style={{ fontSize: 13, fontWeight: "700", color: !text.trim() || isPending ? "#94A3B8" : "#fff" }}>
              {isPending ? "Posting…" : "Post"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
