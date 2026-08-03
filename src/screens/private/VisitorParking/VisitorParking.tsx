import {
  useCheckOutVisitorParkingInspection,
  useDeleteVisitorParkingInspection,
  useGetVisitorParkingInspections,
} from "@/src/api/visitorParking.api";
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
import { useDateRangeFilter } from "@/src/hooks/useDateRangeFilter";
import { useAuth } from "@/src/providers/AuthProvider";
import { VisitorParkingInspectionResponse } from "@/src/types/visitorParking.types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { TaskFilterModal } from "../TaskManagement/components/TaskFilterModal";

export default function VisitorParking() {
  const { user, buildingId } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [residentId, setResidentId] = useState<number>();
  const [filterVisible, setFilterVisible] = useState(false);
  const [deleteItem, setDeleteItem] =
    useState<VisitorParkingInspectionResponse | null>(null);
  const {
    dateType,
    fromDate,
    toDate,
    applyPreset,
    setFromDate,
    setToDate,
  } = useDateRangeFilter("month");

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, residentId]);

  useEffect(() => {
    setResidentId(undefined);
    setPage(1);
  }, [buildingId]);

  const { data, isLoading, refetch, isRefetching } =
    useGetVisitorParkingInspections(
      {
        page,
        limit: 10,
        buildingId: buildingId ?? undefined,
        licensePlate: search || undefined,
        residentId,
        fromDate,
        toDate,
      },
      !!user?.userId,
    );

  const { mutate: deleteMutate, isPending: isDeleting } =
    useDeleteVisitorParkingInspection();
  const { mutate: checkOutMutate, isPending: isCheckingOut } =
    useCheckOutVisitorParkingInspection();

  const inspections = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutate(
      { id: deleteItem.id },
      {
        onSuccess: () => {
          setDeleteItem(null);
          refetch();
        },
        onError: () => setDeleteItem(null),
      },
    );
  };

  const handleCheckOut = (item: VisitorParkingInspectionResponse) => {
    checkOutMutate({ pathVars: { id: item.id } }, { onSuccess: () => refetch() });
  };

  const columns: MobileColumn<VisitorParkingInspectionResponse>[] = [
    {
      key: "licensePlate",
      label: "License Plate",
      primary: true,
      searchable: true,
    },
    {
      key: "stallIdentifier",
      label: "Stall",
    },
    {
      key: "vehicleMake",
      label: "Vehicle",
      render: (_value, row) =>
        [row.vehicleMake, row.vehicleModel, row.vehicleColor]
          .filter(Boolean)
          .join(" ") || "—",
    },
    {
      key: "checkInAt",
      label: "Check-In",
      render: (value) => (value ? new Date(String(value)).toLocaleString() : "—"),
    },
    {
      key: "checkOutAt",
      label: "Check-Out",
      render: (value) => (
        <Text
          className={`font-semibold ${
            value ? "text-green-600" : "text-amber-600"
          }`}
        >
          {value ? new Date(String(value)).toLocaleString() : "Parked"}
        </Text>
      ),
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="car"
        title="Visitor Parking"
        subtitle="Log and manage visitor parking inspections."
      />

      <View className="absolute bottom-6 right-6 z-50 gap-3">
        <AnimatedPressable
          onPress={() =>
            router.push(
              "/(private)/visitor-parking/inspection-add-edit" as any,
            )
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View className="flex-1">
        <MobileDataList<VisitorParkingInspectionResponse>
          data={inspections}
          columns={columns}
          loading={isLoading}
          refreshing={isRefetching}
          searchable
          backendMode
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No visitor parking inspections found"
          onRefresh={refetch}
          onFilterPress={() => setFilterVisible(true)}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          pagination={{
            page,
            pageSize: 10,
            total,
            hasMore: page * 10 < total,
            onPageChange: setPage,
          }}
          renderActions={(row) => {
            const items: MenuItem[] = [
              {
                label: "View Details",
                icon: "eye",
                onPress: () =>
                  router.push({
                    pathname:
                      "/(private)/visitor-parking/inspection-details" as any,
                    params: { inspectionId: row.id },
                  }),
              },
              {
                label: "Edit",
                icon: "pencil",
                onPress: () =>
                  router.push({
                    pathname:
                      "/(private)/visitor-parking/inspection-add-edit" as any,
                    params: { inspectionId: row.id },
                  }),
              },
            ];

            if (!row.checkOutAt) {
              items.push({
                label: "Check Out",
                icon: "log-out",
                onPress: () => handleCheckOut(row),
              });
            }

            items.push({
              label: "Delete",
              icon: "trash",
              danger: true,
              onPress: () => setDeleteItem(row),
            });

            return <AnchoredPopupMenu items={items} />;
          }}
        />
      </View>

      <TaskFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        residentId={residentId}
        setResidentId={setResidentId}
        dateType={dateType}
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        applyPreset={applyPreset}
        showResident
        residentLabel="Resident"
      />

      <ConfirmModal
        visible={!!deleteItem}
        title="Delete Inspection"
        message={`Are you sure you want to delete the inspection for plate "${deleteItem?.licensePlate}"?`}
        confirmText="Delete"
        destructive
        loading={isDeleting || isCheckingOut}
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
