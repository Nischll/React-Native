import { extractBookings, useGetBookings } from "@/src/api/booking.api";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import EmptyState from "@/src/components/feedback/EmptyState";
import AppIcon from "@/src/components/ui/AppIcon";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { BookingResponse } from "@/src/types/booking.types";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";

type Props = {
  buildingId: number | undefined;
  amenityId?: number;
  towerId?: number;
  residentId?: number;
  enabled?: boolean;
  onFilterPress?: () => void;
};

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthBounds(year: number, monthIndex0: number) {
  const start = new Date(year, monthIndex0, 1);
  const end = new Date(year, monthIndex0 + 1, 0);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

function dateKeyFromValue(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    // already yyyy-MM-dd?
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    return null;
  }
  return toIsoDate(d);
}

/** Normalize backend CONFIRM/CANCEL vs CONFIRMED/CANCELLED */
function statusColor(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "CONFIRM" || s === "CONFIRMED") return "#22c55e";
  if (s === "CANCEL" || s === "CANCELLED") return "#ef4444";
  return "#eab308"; // PENDING / default
}

function statusLabel(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "CONFIRM" || s === "CONFIRMED") return "Confirmed";
  if (s === "CANCEL" || s === "CANCELLED") return "Cancelled";
  if (s === "PENDING") return "Pending";
  return status ? String(status) : "—";
}

function bookingTitle(b: BookingResponse) {
  return b.amenityName || b.title || `Booking #${b.id}`;
}

export default function BookingCalendarView({
  buildingId,
  amenityId,
  towerId,
  residentId,
  enabled = true,
  onFilterPress,
}: Props) {
  const today = toIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() + 1 };
  });

  const { startDate, endDate } = useMemo(
    () => monthBounds(visibleMonth.year, visibleMonth.month - 1),
    [visibleMonth.year, visibleMonth.month],
  );

  const { data, isLoading, isFetching, refetch, isRefetching } = useGetBookings(
    {
      buildingId,
      amenityId,
      towerId,
      residentId,
      startDate,
      endDate,
      dateRange: "thisMonth",
    },
    enabled && buildingId != null,
  );

  const bookings = useMemo(() => extractBookings(data), [data]);

  // Keep selected day inside the visible month when month changes
  useEffect(() => {
    const prefix = `${visibleMonth.year}-${String(visibleMonth.month).padStart(2, "0")}`;
    if (!selectedDate.startsWith(prefix)) {
      setSelectedDate(`${prefix}-01`);
    }
  }, [visibleMonth, selectedDate]);

  const markedDates = useMemo(() => {
    const marks: Record<
      string,
      {
        marked?: boolean;
        dots?: { key: string; color: string }[];
        selected?: boolean;
        selectedColor?: string;
      }
    > = {};

    for (const b of bookings) {
      const startKey = dateKeyFromValue(b.startDate);
      const endKey = dateKeyFromValue(b.endDate) ?? startKey;
      if (!startKey) continue;

      const color = statusColor(b.status);
      // Mark each day the booking spans within a simple day loop (cap 31 days)
      const start = new Date(startKey + "T00:00:00");
      const end = new Date((endKey || startKey) + "T00:00:00");
      let guard = 0;
      for (
        let d = new Date(start);
        d <= end && guard < 40;
        d.setDate(d.getDate() + 1), guard++
      ) {
        const key = toIsoDate(d);
        const existing = marks[key] ?? { dots: [] };
        const dots = existing.dots ?? [];
        if (dots.length < 3 && !dots.some((x) => x.color === color)) {
          dots.push({ key: `${b.id}-${color}`, color });
        }
        marks[key] = { ...existing, marked: true, dots };
      }
    }

    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: "#453956",
    };

    return marks;
  }, [bookings, selectedDate]);

  const dayBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const startKey = dateKeyFromValue(b.startDate);
        const endKey = dateKeyFromValue(b.endDate) ?? startKey;
        if (!startKey) return false;
        return selectedDate >= startKey && selectedDate <= (endKey || startKey);
      })
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
  }, [bookings, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const onMonthChange = (month: DateData) => {
    setVisibleMonth({ year: month.year, month: month.month });
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-1 mb-2">
        <View className="flex-row items-center gap-3">
          <LegendDot color="#22c55e" label="Confirmed" />
          <LegendDot color="#eab308" label="Pending" />
          <LegendDot color="#ef4444" label="Cancelled" />
        </View>
        {onFilterPress ? (
          <Pressable
            onPress={onFilterPress}
            className="h-10 w-10 rounded-xl border border-gray-200 bg-white items-center justify-center"
          >
            <AppIcon name="options-outline" size={18} color="#64748B" />
          </Pressable>
        ) : null}
      </View>

      <View className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-3">
        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          onMonthChange={onMonthChange}
          markedDates={markedDates}
          markingType="multi-dot"
          enableSwipeMonths
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#64748B",
            selectedDayBackgroundColor: "#453956",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#453956",
            dayTextColor: "#0f172a",
            textDisabledColor: "#cbd5e1",
            arrowColor: "#453956",
            monthTextColor: "#0f172a",
            textDayFontWeight: "500",
            textMonthFontWeight: "700",
            textDayHeaderFontWeight: "600",
          }}
        />
        {isFetching && !isLoading ? (
          <View className="absolute top-2 right-2">
            <ActivityIndicator size="small" color="#453956" />
          </View>
        ) : null}
      </View>

      <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
        {selectedDate} · {dayBookings.length} booking
        {dayBookings.length === 1 ? "" : "s"}
      </Text>

      {isLoading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {dayBookings.length === 0 ? (
            <EmptyState message="No bookings on this day." />
          ) : (
            dayBookings.map((b) => (
              <BookingDayCard key={b.id} booking={b} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text className="text-[11px] text-slate-600">{label}</Text>
    </View>
  );
}

function BookingDayCard({ booking }: { booking: BookingResponse }) {
  const color = statusColor(booking.status);
  const unit =
    booking.unit ||
    (booking as any).residentUnit ||
    undefined;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(private)/booking-management/booking-details",
          params: { bookingId: booking.id },
        })
      }
      className="mb-2 rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      <View className="flex-row">
        <View className="w-1.5" style={{ backgroundColor: color }} />
        <View className="flex-1 p-3">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="flex-1 text-sm font-bold text-textPrimary"
              numberOfLines={2}
            >
              {bookingTitle(booking)}
            </Text>
            <View
              className="rounded px-2 py-0.5"
              style={{ backgroundColor: color + "22" }}
            >
              <Text
                className="text-[10px] font-semibold"
                style={{ color }}
              >
                {statusLabel(booking.status)}
              </Text>
            </View>
          </View>

          <Text className="text-[11px] text-blue-700 mt-1" numberOfLines={2}>
            {[
              booking.towerName ? `Tower ${booking.towerName}` : null,
              unit ? `Unit ${unit}` : null,
              booking.residentName,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>

          <Text className="text-[11px] text-slate-500 mt-1" numberOfLines={2}>
            {formatDateTime(booking.startDate)}
            {booking.endDate ? ` – ${formatDateTime(booking.endDate)}` : ""}
          </Text>

          {booking.description ? (
            <Text className="text-[11px] text-slate-500 mt-1" numberOfLines={2}>
              {booking.description}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
