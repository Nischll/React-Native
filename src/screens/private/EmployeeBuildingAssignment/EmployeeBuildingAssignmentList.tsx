import { useGetBuildings } from "@/src/api/building.api";
import {
  useDeleteEmployeeBuildingAssignment,
  useGetAllEmployeeBuildingAssignments,
} from "@/src/api/employeeBuildingAssignment.api";
import { useGetStaff } from "@/src/api/employee.api";
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
import { EmployeeBuildingAssignmentResponse } from "@/src/types/employeeBuildingAssignment.types";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function EmployeeBuildingAssignmentList() {
  const { data, isLoading, isRefetching, refetch } =
    useGetAllEmployeeBuildingAssignments();
  const { data: staffData } = useGetStaff();
  const { data: buildingsData } = useGetBuildings();

  const assignments = data?.data ?? [];

  const staffMap = new Map(
    (staffData?.data?.data ?? []).map((s) => [
      s.id,
      `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.username,
    ]),
  );
  const buildingMap = new Map(
    (buildingsData?.data ?? []).map((b) => [b.id, b.name]),
  );

  const [deleteTarget, setDeleteTarget] =
    useState<EmployeeBuildingAssignmentResponse | null>(null);
  const { mutate: deleteAssignment, isPending: deletePending } =
    useDeleteEmployeeBuildingAssignment(deleteTarget?.id);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAssignment(undefined, {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
      },
      onError: () => setDeleteTarget(null),
    });
  };

  const columns: MobileColumn<EmployeeBuildingAssignmentResponse>[] = [
    {
      key: "userId",
      label: "Employee",
      primary: true,
      render: (value, row) => (
        <Text>
          {row.user
            ? `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim()
            : staffMap.get(Number(value)) ?? `#${value}`}
        </Text>
      ),
    },
    {
      key: "buildingId",
      label: "Building",
      render: (value, row) => (
        <Text>
          {row.building?.name ?? buildingMap.get(Number(value)) ?? `#${value}`}
        </Text>
      ),
    },
    {
      key: "startDate",
      label: "Start",
      render: (value) =>
        value ? new Date(String(value)).toLocaleDateString() : "—",
    },
    {
      key: "endDate",
      label: "End",
      render: (value) =>
        value ? new Date(String(value)).toLocaleDateString() : "Ongoing",
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="business-outline"
        title="Employee Building Assignment"
        subtitle="Assign employees to buildings for a period of time."
      />

      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push({
              pathname:
                "/(private)/employee-building-assignment/assignment-add-edit",
            })
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View className="flex-1">
        <MobileDataList<EmployeeBuildingAssignmentResponse>
          data={assignments}
          columns={columns}
          loading={isLoading}
          refreshing={isRefetching}
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No employee-building assignments found"
          onRefresh={refetch}
          renderActions={(row) => {
            const items: MenuItem[] = [
              {
                label: "Edit",
                icon: "pencil",
                onPress: () =>
                  router.push({
                    pathname:
                      "/(private)/employee-building-assignment/assignment-add-edit",
                    params: {
                      assignmentId: row.id,
                      assignment: JSON.stringify(row),
                    },
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

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Assignment"
        message="Are you sure you want to delete this employee-building assignment?"
        confirmText="Delete"
        destructive
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
