import { FOLLOW_UP_METHOD_OPTIONS } from "@/src/enums/taskEnums";
import { FollowUpResponse } from "@/src/types/task-management.types";
import { Text, View } from "react-native";
import { toFollowUpDateInput } from "../followUpFormData";

function formatFollowUpDate(value: string | null | undefined): string {
  const ymd = toFollowUpDateInput(value);
  if (!ymd) return "—";
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return ymd;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function methodLabel(value: string | null | undefined): string {
  return (
    FOLLOW_UP_METHOD_OPTIONS.find((o) => o.value === value)?.label ||
    value ||
    "—"
  );
}

type Props = {
  followUps: FollowUpResponse[];
};

export default function FollowUpReadOnlyTable({ followUps }: Props) {
  if (followUps.length === 0) {
    return (
      <View className="items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-5">
        <Text className="text-sm text-slate-400">No follow-ups</Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-lg border border-slate-200">
      <View className="flex-row border-b border-slate-200 bg-slate-50 px-3 py-2">
        <Text className="w-[28%] text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Date
        </Text>
        <Text className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Description
        </Text>
        <Text className="w-[22%] text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Method
        </Text>
        <Text className="w-[20%] text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Trade
        </Text>
      </View>

      {followUps.map((row) => (
        <View
          key={row.id}
          className="flex-row items-start border-b border-slate-100 px-3 py-2.5 last:border-b-0"
        >
          <Text
            className="w-[28%] text-sm font-medium text-slate-800"
            numberOfLines={1}
          >
            {formatFollowUpDate(row.followUpDate)}
          </Text>
          <Text
            className={`flex-1 pr-1 text-sm ${
              row.description?.trim() ? "text-slate-700" : "text-slate-400"
            }`}
            numberOfLines={2}
          >
            {row.description?.trim() ? row.description : "—"}
          </Text>
          <Text className="w-[22%] text-sm text-slate-700" numberOfLines={1}>
            {methodLabel(row.followUpMethod)}
          </Text>
          <Text
            className={`w-[20%] text-sm ${
              row.trade?.trim() ? "text-slate-700" : "text-slate-400"
            }`}
            numberOfLines={1}
          >
            {row.trade?.trim() ? row.trade : "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}
