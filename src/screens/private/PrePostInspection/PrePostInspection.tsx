import {
  useDeletePrePostInspection,
  useGetPrePostInspections,
} from "@/src/api/prePostInspection.api";
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
import SelectField from "@/src/components/ui/SelectField";
import { useDateRangeFilter } from "@/src/hooks/useDateRangeFilter";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  depositReturnedLabel,
  PrePostInspectionResponse,
  residentDisplayLabel,
  statusLabel,
} from "@/src/types/prePostInspection.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { TaskFilterModal } from "../TaskManagement/components/TaskFilterModal";

const PAGE_SIZE = 10;

function inspectionDateDisplay(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function normalizeListPayload(raw: unknown): {
  rows: PrePostInspectionResponse[];
  total: number;
} {
  if (!raw || typeof raw !== "object") return { rows: [], total: 0 };
  const root = raw as Record<string, unknown>;
  const inner = root.data;

  if (Array.isArray(inner)) {
    const arr = inner as PrePostInspectionResponse[];
    return { rows: arr, total: arr.length };
  }

  if (inner && typeof inner === "object") {
    const p = inner as Record<string, unknown>;
    if (Array.isArray(p.data)) {
      const chunk = p.data as PrePostInspectionResponse[];
      return {
        rows: chunk,
        total: Number(p.total ?? chunk.length) || chunk.length,
      };
    }
    if (Array.isArray(p.content)) {
      const content = p.content as PrePostInspectionResponse[];
      return {
        rows: content,
        total: Number(p.totalElements ?? content.length),
      };
    }
  }

  return { rows: [], total: 0 };
}

export default function PrePostInspection() {
  const { user, buildingId } = useAuth();
  const { residences } = useResidencesForActiveBuilding();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingIdParam = params.bookingId;
  const bookingId =
    bookingIdParam && !Number.isNaN(Number(bookingIdParam))
      ? Number(bookingIdParam)
      : undefined;

  const [page, setPage] = useState(1);
  const [residentId, setResidentId] = useState<number>();
  const [filterVisible, setFilterVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<PrePostInspectionResponse | null>(null);
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
  }, [buildingId, bookingId, fromDate, toDate, residentId]);

  useEffect(() => {
    setResidentId(undefined);
    setPage(1);
  }, [buildingId]);

  const { data, isLoading, refetch, isRefetching } = useGetPrePostInspections(
    {
      page,
      limit: PAGE_SIZE,
      buildingId: buildingId ?? undefined,
      bookingId,
      residentId,
      fromDate,
      toDate,
    },
    !!user?.userId,
  );

  const { rows, total } = useMemo(
    () => normalizeListPayload(data),
    [data],
  );

  const { mutate: deleteMutate, isPending: deleting } =
    useDeletePrePostInspection();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          refetch();
        },
        onError: () => setDeleteTarget(null),
      },
    );
  };

  const clearBookingFilter = () => {
    router.replace("/(private)/pre-post-inspection");
  };

  const columns: MobileColumn<PrePostInspectionResponse>[] = [
    {
      key: "inspectionDate",
      label: "Date",
      primary: true,
      searchable: true,
      render: (value, row) => (
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
            {inspectionDateDisplay(String(value ?? ""))}
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            {row.inspectionTime?.trim() || "—"}
          </Text>
        </View>
      ),
    },
    {
      key: "residentUnit",
      label: "Resident / unit",
      searchable: true,
      render: (_value, row) => (
        <Text style={{ fontSize: 13, color: "#374151", textAlign: "right" }}>
          {residentDisplayLabel(row)}
        </Text>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const label = statusLabel(String(value));
        const color =
          value === "COMPLETED"
            ? "#16A34A"
            : value === "DRAFT"
              ? "#6B7280"
              : "#2563EB";
        return (
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color,
              textAlign: "right",
            }}
          >
            {label}
          </Text>
        );
      },
    },
    {
      key: "depositReturned",
      label: "Deposit returned",
      render: (value) => (
        <Text style={{ fontSize: 13, color: "#374151", textAlign: "right" }}>
          {depositReturnedLabel(value as boolean | null)}
        </Text>
      ),
    },
    {
      key: "amenities",
      label: "Amenities",
      render: (value) => (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: "#374151",
            textAlign: "right",
          }}
        >
          {Array.isArray(value) ? value.length : 0}
        </Text>
      ),
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="clipboard-outline"
        title="Pre & Post Inspection"
        subtitle="Move-in amenity inspections with photos and signatures"
      />

      {bookingId != null && (
        <View className="mx-4 mb-2 flex-row items-center self-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <Text className="text-sm text-slate-500">Booking </Text>
          <Text className="text-sm font-semibold text-slate-800">
            #{bookingId}
          </Text>
          <Pressable
            onPress={clearBookingFilter}
            hitSlop={8}
            className="ml-2"
            accessibilityLabel="Clear booking filter"
          >
            <AppIcon name="close-circle" size={18} color="#94a3b8" />
          </Pressable>
        </View>
      )}

      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() => {
            if (!buildingId) return;
            router.push({
              pathname: "/(private)/pre-post-inspection/inspection-add-edit",
              ...(bookingId != null
                ? { params: { bookingId: String(bookingId) } }
                : {}),
            });
          }}
        >
          <View
            className={`rounded-full p-4 elevation-5 ${
              buildingId ? "bg-primary" : "bg-slate-300"
            }`}
          >
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View className="flex-1">
        {!buildingId && bookingId == null ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-sm text-slate-500">
              Select a building to manage inspections.
            </Text>
          </View>
        ) : (
          <View className="flex-1 px-1">
            <View className="mb-2 flex-row items-start gap-2">
              <View className="flex-1">
                <SelectField
                  value={residentId != null ? String(residentId) : ""}
                  onChange={(v) =>
                    setResidentId(v ? Number(v) : undefined)
                  }
                  options={[
                    { label: "All units", value: "" },
                    ...residences,
                  ]}
                  placeholder="Select unit"
                />
              </View>
              <TouchableOpacity
                onPress={() => setFilterVisible(true)}
                className="mt-0.5 h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white"
              >
                <AppIcon name="options-outline" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <MobileDataList<PrePostInspectionResponse>
              data={rows}
              columns={columns}
              loading={isLoading}
              refreshing={isRefetching}
              backendMode
              keyExtractor={(item) => item.id.toString()}
              emptyMessage="No inspections yet. Create one to get started."
              onRefresh={refetch}
              pagination={{
                page,
                pageSize: PAGE_SIZE,
                total,
                hasMore: page * PAGE_SIZE < total,
                onPageChange: setPage,
              }}
              renderActions={(row) => {
                const items: MenuItem[] = [
                  {
                    label: "View",
                    icon: "eye",
                    onPress: () =>
                      router.push({
                        pathname:
                          "/(private)/pre-post-inspection/inspection-details",
                        params: { inspectionId: String(row.id) },
                      }),
                  },
                  {
                    label: "Edit",
                    icon: "pencil",
                    onPress: () =>
                      router.push({
                        pathname:
                          "/(private)/pre-post-inspection/inspection-add-edit",
                        params: { inspectionId: String(row.id) },
                      }),
                  },
                  {
                    label: "Delete",
                    icon: "trash",
                    danger: true,
                    onPress: () => setDeleteTarget(row),
                  },
                ];
                return <AnchoredPopupMenu items={items} />;
              }}
            />
          </View>
        )}
      </View>

      <TaskFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        showResident={false}
        dateType={dateType}
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        applyPreset={applyPreset}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete this inspection?"
        message="The inspection will be soft-deleted and removed from the list."
        confirmText="Delete"
        destructive
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
