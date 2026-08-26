import { SeenStatus } from "@/src/types/communication.types";
import { Pressable, Text, View } from "react-native";

const OPTIONS: { value: SeenStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "seen", label: "Seen" },
  { value: "unseen", label: "Unseen" },
];

export default function CommunicationSeenFilter({
  value,
  onChange,
  totalCount,
  seenCount,
  unseenCount,
  replyUnseenCount = 0,
  disabled = false,
}: {
  value: SeenStatus;
  onChange: (value: SeenStatus) => void;
  totalCount: number;
  seenCount: number;
  unseenCount: number;
  replyUnseenCount?: number;
  disabled?: boolean;
}) {
  const counts: Record<SeenStatus, number> = {
    all: totalCount,
    seen: seenCount,
    unseen: unseenCount,
  };

  return (
    <View className="mb-3 px-1">
      {replyUnseenCount > 0 ? (
        <Text className="mb-2 text-[11px] text-amber-800">
          {replyUnseenCount} unseen{" "}
          {replyUnseenCount === 1 ? "reply" : "replies"} in threads
        </Text>
      ) : null}
      <View className="flex-row rounded-xl border border-slate-200 bg-slate-50 p-1">
        {OPTIONS.map((option) => {
          const isActive = value === option.value;
          const count = counts[option.value];
          return (
            <Pressable
              key={option.value}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg px-2 py-2 ${
                isActive ? "bg-white" : ""
              } ${disabled ? "opacity-50" : ""}`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive ? "text-textPrimary" : "text-slate-400"
                }`}
              >
                {option.label}
              </Text>
              <View
                className={`min-w-[20px] items-center rounded-md px-1.5 py-0.5 ${
                  isActive && option.value === "unseen" && unseenCount > 0
                    ? "bg-amber-100"
                    : isActive
                      ? "bg-slate-100"
                      : "bg-white"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold tabular-nums ${
                    isActive && option.value === "unseen" && unseenCount > 0
                      ? "text-amber-900"
                      : isActive
                        ? "text-textPrimary"
                        : "text-slate-400"
                  }`}
                >
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
