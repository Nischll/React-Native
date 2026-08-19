import { timeAgo } from "@/src/utils/timeAgo";
import { PrivateThreadMessage } from "@/src/types/privateMessage.types";
import AppIcon from "@/src/components/ui/AppIcon";
import { Pressable, Text, View } from "react-native";

export default function MessageBubble({
  item,
  isMine,
  onDelete,
}: {
  item: PrivateThreadMessage;
  isMine: boolean;
  onDelete?: (item: PrivateThreadMessage) => void;
}) {
  return (
    <View className={`mb-2 px-1 ${isMine ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
          isMine ? "rounded-br-sm bg-primary" : "rounded-bl-sm bg-slate-100"
        }`}
      >
        {!isMine ? (
          <Text className="text-[10px] font-semibold text-slate-500 mb-0.5">
            {item.createdByFullName}
          </Text>
        ) : null}
        <Text
          className={`text-sm leading-5 ${isMine ? "text-white" : "text-textPrimary"}`}
        >
          {item.message}
        </Text>
      </View>
      <View
        className={`flex-row items-center mt-0.5 px-1 gap-3 ${
          isMine ? "justify-end" : "justify-start"
        }`}
      >
        <Text className="text-[10px] text-slate-400">
          {timeAgo(item.createdDate)}
        </Text>
        {isMine && onDelete ? (
          <Pressable
            onPress={() => onDelete(item)}
            hitSlop={8}
            className="flex-row items-center gap-1 py-1"
          >
            <AppIcon name="trash-outline" size={12} color="#ef4444" />
            <Text className="text-[10px] font-semibold text-red-500">
              Delete
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
