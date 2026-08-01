import {
  useGetStaff,
  useToggleStaffStatus,
} from "@/src/api/employee.api";
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
import { Employee } from "@/src/types/employee.types";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

function formatNatureOfEmployment(value?: string) {
  if (!value) return "—";
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export default function StaffManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [toggleTarget, setToggleTarget] = useState<Employee | null>(null);

  const { data, isLoading, isRefetching, refetch } = useGetStaff(
    page,
    10,
    search,
  );

  const { mutate: toggleStatus, isPending: togglePending } =
    useToggleStaffStatus(toggleTarget?.id);

  const staff = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

  const handleToggle = () => {
    if (!toggleTarget) return;
    toggleStatus(undefined, {
      onSuccess: () => {
        setToggleTarget(null);
        refetch();
      },
      onError: () => setToggleTarget(null),
    });
  };

  const isActive = (emp: Employee) => emp.isActive ?? emp.active ?? true;

  const columns: MobileColumn<Employee>[] = [
    {
      key: "firstName",
      label: "Name",
      primary: true,
      searchable: true,
      render: (_value, row) =>
        `${row.firstName} ${row.middleName ? row.middleName + " " : ""}${row.lastName}`.trim(),
    },
    {
      key: "username",
      label: "Username",
      searchable: true,
    },
    {
      key: "email",
      label: "Email",
      searchable: true,
    },
    {
      key: "position",
      label: "Position",
      render: (value) => <Text>{value ? String(value) : "—"}</Text>,
    },
    {
      key: "natureOfEmployment",
      label: "Employment",
      render: (value) => <Text>{formatNatureOfEmployment(String(value))}</Text>,
    },
    {
      key: "isActive",
      label: "Status",
      render: (_value, row) => (
        <Text
          className={`font-semibold ${isActive(row) ? "text-green-600" : "text-red-500"}`}
        >
          {isActive(row) ? "Active" : "Inactive"}
        </Text>
      ),
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="people-circle"
        title="Staff Management"
        subtitle="Manage employees, roles, and building access."
      />

      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push({
              pathname: "/(private)/staff-management/staff-add-edit",
            })
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View className="flex-1">
        <MobileDataList<Employee>
          data={staff}
          columns={columns}
          loading={isLoading}
          refreshing={isRefetching}
          searchable
          backendMode
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No staff members found"
          onRefresh={refetch}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
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
                label: "Edit",
                icon: "pencil",
                onPress: () =>
                  router.push({
                    pathname: "/(private)/staff-management/staff-add-edit",
                    params: { userId: row.id, employee: JSON.stringify(row) },
                  }),
              },
              {
                label: isActive(row) ? "Deactivate" : "Activate",
                icon: isActive(row) ? "close-circle" : "checkmark-circle",
                danger: isActive(row),
                onPress: () => setToggleTarget(row),
              },
            ];

            return <AnchoredPopupMenu items={items} />;
          }}
        />
      </View>

      <ConfirmModal
        visible={!!toggleTarget}
        title={isActive(toggleTarget ?? ({} as Employee)) ? "Deactivate Staff" : "Activate Staff"}
        message={`Are you sure you want to ${
          toggleTarget && isActive(toggleTarget) ? "deactivate" : "activate"
        } "${toggleTarget?.firstName} ${toggleTarget?.lastName}"?`}
        confirmText="Confirm"
        destructive={!!toggleTarget && isActive(toggleTarget)}
        loading={togglePending}
        onCancel={() => setToggleTarget(null)}
        onConfirm={handleToggle}
      />
    </View>
  );
}
