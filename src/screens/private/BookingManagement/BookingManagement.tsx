import { useDeleteBooking, useGetBookings } from "@/src/api/booking.api";
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
import { BookingResponse } from "@/src/types/booking.types";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { BookingFilterModal } from "./components/BookingFilterModal";

export default function BookingManagement() {
  const { user, buildingId } = useAuth();

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
      limit: 10,
      buildingId: buildingId ?? undefined,
      amenityId,
      towerId,
      residentId,
    },
    !!user?.userId,
  );

  const { mutate: deleteBookingMutate, isPending } = useDeleteBooking();

  const bookings = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

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
      label: "Resident",
    },
    {
      key: "startDate",
      label: "Start",
      render: (value) => new Date(String(value)).toLocaleString(),
    },
    {
      key: "endDate",
      label: "End",
      render: (value) => new Date(String(value)).toLocaleString(),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Text
          className={`font-semibold ${
            value === "CONFIRMED"
              ? "text-green-600"
              : value === "CANCELLED"
                ? "text-red-500"
                : "text-amber-600"
          }`}
        >
          {String(value)}
        </Text>
      ),
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="calendar"
        title="Booking Management"
        subtitle="View and manage all amenity bookings."
      />

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

      <View className="flex-1">
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
          onSearch={() => {}}
          onFilterPress={() => setFilterVisible(true)}
          pagination={{
            page,
            pageSize: 10,
            total,
            hasMore: page * 10 < total,
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
      </View>

      <BookingFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        amenityId={amenityId}
        setAmenityId={setAmenityId}
        towerId={towerId}
        setTowerId={setTowerId}
        residentId={residentId}
        setResidentId={setResidentId}
      />

      <ConfirmModal
        visible={!!deleteBooking}
        title="Delete Booking"
        message={`Are you sure you want to delete booking "${deleteBooking?.title}"?`}
        confirmText="Delete"
        destructive
        loading={isPending}
        onCancel={() => setDeleteBooking(null)}
        onConfirm={handleDeleteBooking}
      />
    </View>
  );
}
