import {
  extractBookings,
  useDeleteBooking,
  useGetBookings,
} from "@/src/api/booking.api";
import {
  MobileColumn,
  MobileDataList,
} from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu, {
  MenuItem,
} from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { BookingResponse, bookingTypeLabel } from "@/src/types/booking.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import BookingCalendarView from "./components/BookingCalendarView";
import { BookingFilterModal } from "./components/BookingFilterModal";

type ViewMode = "list" | "calendar";

function statusTone(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "CONFIRM" || s === "CONFIRMED") return "text-green-600";
  if (s === "CANCEL" || s === "CANCELLED") return "text-red-500";
  return "text-amber-600";
}

function statusLabel(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "CONFIRM" || s === "CONFIRMED") return "Confirmed";
  if (s === "CANCEL" || s === "CANCELLED") return "Cancelled";
  if (s === "PENDING") return "Pending";
  return status ? String(status) : "—";
}

export default function BookingManagement() {
  const { user, buildingId } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [page, setPage] = useState(1);
  const [filterVisible, setFilterVisible] = useState(false);
  const [amenityId, setAmenityId] = useState<number>();
  const [towerId, setTowerId] = useState<number>();
  const [residentId, setResidentId] = useState<number>();
  const [deleteBooking, setDeleteBooking] = useState<BookingResponse | null>(
    null,
  );

  const { data, isLoading, refetch, isRefetching } = useGetBookings(
    {
      page,
      limit: PAGE_SIZE,
      buildingId: buildingId ?? undefined,
      amenityId,
      towerId,
      residentId,
    },
    !!user?.userId && viewMode === "list",
  );

  const { mutate: deleteBookingMutate, isPending } = useDeleteBooking();

  // Backend returns a plain array (same as web calendar); slice client-side for list pages
  const allBookings = useMemo(() => extractBookings(data), [data]);
  const { items: bookings, total } = useMemo(() => {
    // If API already paginated, prefer extractPaginatedList; else slice allBookings
    const paginated = extractPaginatedList<BookingResponse>(data, {
      page,
      limit: PAGE_SIZE,
    });
    if (paginated.total > 0 || allBookings.length === 0) return paginated;
    const start = (page - 1) * PAGE_SIZE;
    return {
      items: allBookings.slice(start, start + PAGE_SIZE),
      total: allBookings.length,
      page,
      limit: PAGE_SIZE,
    };
  }, [data, allBookings, page]);

  const handleDeleteBooking = () => {
    if (!deleteBooking) return;

    deleteBookingMutate(
      { id: deleteBooking.id },
      {
        onSuccess: () => {
          setDeleteBooking(null);
          refetch();
        },
        onError: () => {
          setDeleteBooking(null);
        },
      },
    );
  };

  const columns: MobileColumn<BookingResponse>[] = [
    {
      key: "title",
      label: "Booking",
      primary: true,
      searchable: true,
      render: (_value, row) => row.amenityName || row.title || `Booking #${row.id}`,
    },
    {
      key: "amenityName",
      label: "Amenity",
      searchable: true,
    },
    {
      key: "towerName",
      label: "Tower",
    },
    {
      key: "residentName",
      label: "Unit",
    },
    {
      key: "startDate",
      label: "Start",
      render: (value) =>
        value ? new Date(String(value)).toLocaleString() : "—",
    },
    {
      key: "endDate",
      label: "End",
      render: (value) =>
        value ? new Date(String(value)).toLocaleString() : "—",
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Text className={`font-semibold ${statusTone(String(value))}`}>
          {statusLabel(String(value))}
        </Text>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (_value, row) => (
        <Text>{bookingTypeLabel(row.type)}</Text>
      ),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <PageHeader
        showBackButton
        icon="calendar"
        title="Booking Management"
        subtitle="View and manage amenity bookings."
      />

      {/* List / Calendar toggle (Agenda ≈ List on web) */}
      <View className="flex-row mb-3 bg-slate-100 rounded-xl p-1 gap-1">
        {(
          [
            { key: "calendar", label: "Calendar", icon: "calendar-outline" },
            { key: "list", label: "List", icon: "list-outline" },
          ] as const
        ).map((opt) => {
          const active = viewMode === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                setViewMode(opt.key);
                if (opt.key === "list") setPage(1);
              }}
              className="flex-1"
            >
              <View
                className={`py-2.5 rounded-lg flex-row items-center justify-center gap-1.5 ${
                  active ? "bg-primary" : "bg-transparent"
                }`}
              >
                <AppIcon
                  name={opt.icon}
                  size={16}
                  color={active ? "#fff" : "#64748B"}
                />
                <Text
                  className={`text-sm font-semibold ${
                    active ? "text-white" : "text-slate-500"
                  }`}
                >
                  {opt.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="absolute bottom-6 right-6 z-50 gap-2">
        <AnimatedPressable
          onPress={() =>
            router.push("/(private)/booking-management/booking-add-edit")
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View style={{ flex: 1, minHeight: 420 }}>
        {viewMode === "calendar" ? (
          <BookingCalendarView
            buildingId={buildingId ?? undefined}
            amenityId={amenityId}
            towerId={towerId}
            residentId={residentId}
            enabled={!!user?.userId}
            onFilterPress={() => setFilterVisible(true)}
          />
        ) : (
          <MobileDataList<BookingResponse>
            data={bookings}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            backendMode
            keyExtractor={(item) => item.id.toString()}
            emptyMessage="No bookings found"
            onRefresh={refetch}
            onSearch={() => {
              setPage(1);
            }}
            onFilterPress={() => setFilterVisible(true)}
            pagination={{
              page,
              pageSize: PAGE_SIZE,
              total,
              hasMore: page * PAGE_SIZE < total,
              onPageChange: setPage,
            }}
            renderActions={(row) => {
              const items = [
                {
                  label: "View Details",
                  icon: "eye",
                  onPress: () =>
                    router.push({
                      pathname:
                        "/(private)/booking-management/booking-details",
                      params: { bookingId: row.id },
                    }),
                },
                {
                  label: "Edit Booking",
                  icon: "pencil",
                  onPress: () =>
                    router.push({
                      pathname:
                        "/(private)/booking-management/booking-add-edit",
                      params: { bookingId: row.id },
                    }),
                },
                {
                  label: "Delete",
                  icon: "trash",
                  danger: true,
                  onPress: () => setDeleteBooking(row),
                },
              ] as MenuItem[];

              return <AnchoredPopupMenu items={items} />;
            }}
          />
        )}
      </View>

      <BookingFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        amenityId={amenityId}
        setAmenityId={(id) => {
          setAmenityId(id);
          setPage(1);
        }}
        towerId={towerId}
        setTowerId={(id) => {
          setTowerId(id);
          setPage(1);
        }}
        residentId={residentId}
        setResidentId={(id) => {
          setResidentId(id);
          setPage(1);
        }}
      />

      <ConfirmModal
        visible={!!deleteBooking}
        title="Delete Booking"
        message={`Are you sure you want to delete booking "${deleteBooking?.amenityName || deleteBooking?.title}"?`}
        confirmText="Delete"
        destructive
        loading={isPending}
        onCancel={() => setDeleteBooking(null)}
        onConfirm={handleDeleteBooking}
      />
    </View>
  );
}
