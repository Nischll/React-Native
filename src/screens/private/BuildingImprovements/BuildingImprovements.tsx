import {
  useDeleteBuildingImprovement,
  useGetBuildingImprovements,
} from "@/src/api/buildingImprovements.api";
import {
  MobileColumn,
  MobileDataList,
} from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  BuildingImprovementImageResponse,
  BuildingImprovementResponse,
  projectLabel,
  subProjectLabel,
} from "@/src/types/building-improvements.type";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

// ─── Column Renderers ─────────────────────────────────────────────────────────

/** Image count pill — reads both `imageSide` and legacy `side` fields */
function ImageCountBadge({
  images,
}: {
  images: BuildingImprovementImageResponse[];
}) {
  if (!images || images.length === 0) {
    return (
      <Text style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
        No images
      </Text>
    );
  }

  const getSide = (img: BuildingImprovementImageResponse) =>
    img.imageSide ?? img.side;

  const hasBefore = images.some((img) => getSide(img) === "BEFORE");
  const hasAfter = images.some((img) => getSide(img) === "AFTER");

  const parts: string[] = [];
  if (hasBefore) parts.push("Before");
  if (hasAfter) parts.push("After");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        justifyContent: "flex-end",
      }}
    >
      <View
        style={{
          backgroundColor: "#FFF7ED",
          borderRadius: 99,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "600", color: "#EA580C" }}>
          📷 {images.length} · {parts.join(" & ")}
        </Text>
      </View>
    </View>
  );
}

/** Detail of work: truncated to 2 lines */
function WorkDetail({ detail }: { detail: string }) {
  return (
    <Text
      numberOfLines={2}
      style={{
        fontSize: 12,
        color: "#374151",
        textAlign: "right",
        flex: 1,
        marginLeft: 8,
      }}
    >
      {detail || "—"}
    </Text>
  );
}

/** Location: dash fallback if empty */
function LocationText({ location }: { location: string }) {
  return (
    <Text
      style={{
        fontSize: 12,
        color: location ? "#374151" : "#D1D5DB",
        textAlign: "right",
      }}
    >
      {location || "Not specified"}
    </Text>
  );
}

// ─── Column Definitions ───────────────────────────────────────────────────────

const columns: MobileColumn<BuildingImprovementResponse>[] = [
  {
    key: "project",
    label: "Project",
    primary: true,
    searchable: true,
    render: (value, row) => (
      <View style={{ gap: 3 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
          {projectLabel(String(value))}
        </Text>
        {row.subProject ? (
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}>
            {subProjectLabel(row.subProject)}
          </Text>
        ) : null}
      </View>
    ),
  },
  {
    key: "workDate",
    label: "Work Date",
    sortable: true,
    render: (value) => (
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: "#374151",
          textAlign: "right",
        }}
      >
        {formatDateTime(value ? String(value) : null)}
      </Text>
    ),
  },
  {
    key: "buildingName",
    label: "Building",
    searchable: true,
    render: (value) => (
      <Text style={{ fontSize: 12, color: "#374151", textAlign: "right" }}>
        {value ? String(value) : "—"}
      </Text>
    ),
  },
  {
    key: "location",
    label: "Location",
    render: (value) => <LocationText location={value ? String(value) : ""} />,
  },
  {
    key: "detailOfWork",
    label: "Details",
    render: (value) => <WorkDetail detail={String(value)} />,
  },
  {
    key: "images",
    label: "Images",
    render: (value) => (
      <ImageCountBadge
        images={(value as BuildingImprovementImageResponse[]) ?? []}
      />
    ),
  },
  {
    key: "createdByUserName",
    label: "Created By",
    searchable: true,
    render: (value) => (
      <Text style={{ fontSize: 12, color: "#6B7280", textAlign: "right" }}>
        {value ? String(value) : "—"}
      </Text>
    ),
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BuildingImprovements() {
  const { user, buildingId } = useAuth();
  const [page, setPage] = useState(1);
  const router = useRouter();

  const [deleteImprovement, setDeleteImprovement] =
    useState<BuildingImprovementResponse | null>(null);

  const {
    data: listData,
    isLoading,
    refetch,
    isRefetching,
  } = useGetBuildingImprovements(
    buildingId ?? undefined,
    page,
    10,
    !!user?.userId,
  );

  const { mutate: deleteImrovementMutate, isPending } =
    useDeleteBuildingImprovement(deleteImprovement?.id);

  const improvements: BuildingImprovementResponse[] =
    listData?.data?.data ?? [];
  const total: number = listData?.data?.total ?? 0;
  const hasMore = improvements.length < total;

  const handleEdit = (item: BuildingImprovementResponse) => {
    // TODO: navigate to edit screen
    console.log("Edit", item.id);
  };

  const handleDelete = () => {
    if (!deleteImprovement) return;

    deleteImrovementMutate(undefined, {
      onSuccess: () => {
        setDeleteImprovement(null);
        refetch();
      },
      onError: () => {
        setDeleteImprovement(null);
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <PageHeader
        title="Building Improvements"
        subtitle="Track improvement work, locations, and before / after images."
        icon="hammer"
        showBackButton
      />
      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push({
              pathname: "/(private)/building-improvements/improvement-add-edit",
              params: { mode: "create" },
            })
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View style={{ flex: 1 }}>
        <MobileDataList<BuildingImprovementResponse>
          data={improvements}
          columns={columns}
          loading={isLoading}
          refreshing={isRefetching}
          searchable
          sortable
          pagination={{
            page,
            pageSize: 10,
            hasMore,
            onPageChange: setPage,
          }}
          onRefresh={refetch}
          keyExtractor={(item) => String(item.id)}
          emptyMessage="No building improvements found."
          renderActions={(item: BuildingImprovementResponse) => (
            <AnchoredPopupMenu
              items={[
                {
                  label: "View Details",
                  icon: "eye-outline",
                  onPress: () =>
                    router.push({
                      pathname:
                        "/(private)/building-improvements/improvement-details",
                      params: { id: item.id },
                    }),
                },
                {
                  label: "Edit",
                  icon: "create-outline",
                  onPress: () => handleEdit(item),
                },
                {
                  label: "Delete",
                  icon: "trash-outline",
                  danger: true,
                  onPress: () => setDeleteImprovement(item),
                },
              ]}
            />
          )}
        />
      </View>

      <ConfirmModal
        visible={!!deleteImprovement}
        title="Delete this improvement?"
        message={`AThis action cannot be undone. The record will be removed from the list.`}
        confirmText="Delete"
        destructive
        loading={isPending}
        onCancel={() => setDeleteImprovement(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
