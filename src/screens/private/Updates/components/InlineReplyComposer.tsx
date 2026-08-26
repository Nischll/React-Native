import {
  MentionState,
  MentionSuggestions,
  MentionTextInput,
} from "@/src/helper/mentionTextInput";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function InlineReplyComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
  sending = false,
  mentionBuildingId,
  placeholder = "Write a reply… Type @ to mention someone",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  sending?: boolean;
  mentionBuildingId?: number | null;
  placeholder?: string;
}) {
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const canSend = value.trim().length > 0 && !sending;

  return (
    <View className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
      <MentionTextInput
        value={value}
        onChangeText={onChange}
        onMentionStateChange={setMentionState}
        placeholder={placeholder}
        placeholderTextColor="#CBD5E1"
        multiline
        autoFocus
        style={{
          fontSize: 14,
          color: "#1E293B",
          minHeight: 64,
          maxHeight: 120,
          padding: 8,
        }}
      />
      {mentionState ? (
        <MentionSuggestions
          mentionState={mentionState}
          value={value}
          onChangeText={onChange}
          onDismiss={() => setMentionState(null)}
          buildingId={mentionBuildingId}
          direction="below"
        />
      ) : null}
      <View className="mt-2 flex-row items-center gap-2">
        <Pressable
          onPress={onSubmit}
          disabled={!canSend}
          className={`rounded-lg px-3 py-2 ${canSend ? "bg-primary" : "bg-slate-200"}`}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              className={`text-xs font-bold ${canSend ? "text-white" : "text-slate-400"}`}
            >
              Post reply
            </Text>
          )}
        </Pressable>
        <Pressable onPress={onCancel} className="px-3 py-2">
          <Text className="text-xs font-semibold text-slate-500">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
