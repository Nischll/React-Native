import { extractBookings, useGetBookings } from "@/src/api/booking.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
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

type Props = {
  buildingId: number | undefined;
  amenityId?: number;
  towerId?: number;
  residentId?: number;
  enabled?: boolean;
  onFilterPress?: () => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return toIsoDate(d);
}

function statusColor(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "CONFIRM" || s === "CONFIRMED") return "#22c55e";
  if (s === "CANCEL" || s === "CANCELLED") return "#ef4444";
  return "#eab308";
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

function buildMonthCells(year: number, monthIndex0: number) {
  const first = new Date(year, monthIndex0, 1);
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
  const startWeekday = first.getDay(); // 0 Sun
  const cells: ({ iso: string; day: number } | null)[] = [];

  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toIsoDate(new Date(year, monthIndex0, day));
    cells.push({ iso, day });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() }; // month 0-based
  });

  const { startDate, endDate } = useMemo(
    () => monthBounds(cursor.year, cursor.month),
    [cursor.year, cursor.month],
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

  useEffect(() => {
    const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
    if (!selectedDate.startsWith(prefix)) {
      setSelectedDate(`${prefix}-01`);
    }
  }, [cursor.year, cursor.month, selectedDate]);

  const bookingsByDay = useMemo(() => {
    const map: Record<string, BookingResponse[]> = {};
    for (const b of bookings) {
      const startKey = dateKeyFromValue(b.startDate);
      const endKey = dateKeyFromValue(b.endDate) ?? startKey;
      if (!startKey) continue;
      const start = new Date(startKey + "T00:00:00");
      const end = new Date((endKey || startKey) + "T00:00:00");
      let guard = 0;
      for (
        let d = new Date(start);
        d <= end && guard < 40;
        d.setDate(d.getDate() + 1), guard++
      ) {
        const key = toIsoDate(d);
        if (!map[key]) map[key] = [];
        map[key].push(b);
      }
    }
    return map;
  }, [bookings]);

  const dayBookings = useMemo(() => {
    return (bookingsByDay[selectedDate] ?? [])
      .slice()
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
  }, [bookingsByDay, selectedDate]);

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const monthLabel = useMemo(() => {
    return new Date(cursor.year, cursor.month, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [cursor.year, cursor.month]);

  const goPrevMonth = () => {
    setCursor((c) => {
      const d = new Date(c.year, c.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goNextMonth = () => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToday = () => {
    const n = new Date();
    setCursor({ year: n.getFullYear(), month: n.getMonth() });
    setSelectedDate(toIsoDate(n));
  };

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View className="flex-row items-center justify-between mb-3">
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

      {/* Month calendar grid */}
      <View className="rounded-2xl border border-slate-200 bg-white p-3 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={goPrevMonth}
            className="h-9 w-9 rounded-full bg-slate-100 items-center justify-center"
          >
            <AppIcon name="chevron-back" size={18} color="#453956" />
          </Pressable>

          <Pressable onPress={goToday} className="items-center px-2">
            <Text className="text-base font-bold text-textPrimary">
              {monthLabel}
            </Text>
            <Text className="text-[10px] text-primary font-semibold mt-0.5">
              Today
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-1">
            {isFetching ? (
              <ActivityIndicator size="small" color="#453956" />
            ) : null}
            <Pressable
              onPress={goNextMonth}
              className="h-9 w-9 rounded-full bg-slate-100 items-center justify-center"
            >
              <AppIcon name="chevron-forward" size={18} color="#453956" />
            </Pressable>
          </View>
        </View>

        <View className="flex-row mb-1">
          {WEEKDAYS.map((d) => (
            <View key={d} className="flex-1 items-center py-1">
              <Text className="text-[11px] font-semibold text-slate-400">
                {d}
              </Text>
            </View>
          ))}
        </View>

        {Array.from({ length: cells.length / 7 }).map((_, weekIdx) => (
          <View key={`w-${weekIdx}`} className="flex-row">
            {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((cell, i) => {
              if (!cell) {
                return <View key={`e-${weekIdx}-${i}`} className="flex-1 aspect-square m-0.5" />;
              }
              const dayBookingsForCell = bookingsByDay[cell.iso] ?? [];
              const selected = cell.iso === selectedDate;
              const isToday = cell.iso === today;
              const colors = Array.from(
                new Set(dayBookingsForCell.map((b) => statusColor(b.status))),
              ).slice(0, 3);

              return (
                <Pressable
                  key={cell.iso}
                  onPress={() => setSelectedDate(cell.iso)}
                  className="flex-1 aspect-square m-0.5"
                >
                  <View
                    className={`flex-1 rounded-xl items-center justify-center ${
                      selected
                        ? "bg-primary"
                        : isToday
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-slate-50"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selected
                          ? "text-white"
                          : isToday
                            ? "text-primary"
                            : "text-textPrimary"
                      }`}
                    >
                      {cell.day}
                    </Text>
                    {colors.length > 0 ? (
                      <View className="flex-row gap-0.5 mt-1">
                        {colors.map((c) => (
                          <View
                            key={`${cell.iso}-${c}`}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: selected ? "#fff" : c,
                            }}
                          />
                        ))}
                      </View>
                    ) : (
                      <View className="h-2.5 mt-1" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {selectedDate} · {dayBookings.length} booking
        {dayBookings.length === 1 ? "" : "s"}
      </Text>

      {!buildingId ? (
        <EmptyState message="Select a building to load bookings." />
      ) : isLoading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : dayBookings.length === 0 ? (
        <EmptyState message="No bookings on this day." />
      ) : (
        dayBookings.map((b) => <BookingDayCard key={b.id} booking={b} />)
      )}
    </ScrollView>
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
  const unit = booking.unit || (booking as any).residentUnit || undefined;

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
              <Text className="text-[10px] font-semibold" style={{ color }}>
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
