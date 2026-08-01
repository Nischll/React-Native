import AppIcon from "@/src/components/ui/AppIcon";
import { Text, TouchableOpacity, View } from "react-native";

type ListPagerProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

/** Shared Prev / Next pager for screens that do not use MobileDataList. */
export default function ListPager({
  page,
  pageSize,
  total,
  onPageChange,
}: ListPagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <View className="mt-2 mb-4 flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 mx-1">
      <TouchableOpacity
        disabled={!canGoPrev}
        onPress={() => onPageChange(Math.max(1, page - 1))}
        className={`flex-row items-center gap-1 rounded-xl px-3 py-2 ${
          canGoPrev ? "bg-primary/10" : "bg-slate-100 opacity-50"
        }`}
      >
        <AppIcon
          name="chevron-back"
          size={16}
          color={canGoPrev ? "#453956" : "#94A3B8"}
        />
        <Text
          className={`text-sm font-semibold ${
            canGoPrev ? "text-primary" : "text-slate-400"
          }`}
        >
          Prev
        </Text>
      </TouchableOpacity>

      <View className="flex-1 items-center px-1">
        <Text
          className="text-sm font-semibold text-textPrimary"
          numberOfLines={1}
        >
          Page {page} of {totalPages}
        </Text>
        <Text
          className="text-[11px] text-textSecondary mt-0.5"
          numberOfLines={1}
        >
          {total} item{total === 1 ? "" : "s"}
        </Text>
      </View>

      <TouchableOpacity
        disabled={!canGoNext}
        onPress={() => onPageChange(page + 1)}
        className={`flex-row items-center gap-1 rounded-xl px-3 py-2 ${
          canGoNext ? "bg-primary/10" : "bg-slate-100 opacity-50"
        }`}
      >
        <Text
          className={`text-sm font-semibold ${
            canGoNext ? "text-primary" : "text-slate-400"
          }`}
        >
          Next
        </Text>
        <AppIcon
          name="chevron-forward"
          size={16}
          color={canGoNext ? "#453956" : "#94A3B8"}
        />
      </TouchableOpacity>
    </View>
  );
}
