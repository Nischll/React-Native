import {
  useAddPropertyAgent,
  useDeletePropertyAgent,
  useGetPropertyAgentsByResident,
  useUpdatePropertyAgent,
} from "@/src/api/propertyAgent.api";
import FormSheetModal from "@/src/components/domain/FormSheetModal";
import EmptyState from "@/src/components/feedback/EmptyState";
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
import AppInput from "@/src/components/ui/AppInput";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import DatePickerField from "@/src/components/ui/DatePickerField";
import SelectField from "@/src/components/ui/SelectField";
import SwitchField from "@/src/components/ui/SwitchField";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { PropertyAgentResponse } from "@/src/types/resident.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

interface FormValues {
  companyName: string;
  propertyManagerName: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  activeFromDate: string;
  activeToDate: string;
}

const DEFAULT_VALUES: FormValues = {
  companyName: "",
  propertyManagerName: "",
  phoneNumber: "",
  email: "",
  isActive: true,
  activeFromDate: "",
  activeToDate: "",
};

export default function PropertyAgentManagement() {
  const { residences } = useResidencesForActiveBuilding();
  const [residentId, setResidentId] = useState<string>();
  const numericResidentId = residentId ? Number(residentId) : undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [residentId]);

  const { data, isLoading, isRefetching, refetch } =
    useGetPropertyAgentsByResident(
      numericResidentId,
      { page, limit: PAGE_SIZE, search: search || undefined },
      !!numericResidentId,
    );
  const { items: agents, total } =
    extractPaginatedList<PropertyAgentResponse>(data, { page, limit: PAGE_SIZE });

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<PropertyAgentResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyAgentResponse | null>(
    null,
  );

  const { mutate: addAgent, isPending: addPending } =
    useAddPropertyAgent(numericResidentId);
  const { mutate: updateAgent, isPending: updatePending } =
    useUpdatePropertyAgent(numericResidentId, editing?.id);
  const { mutate: deleteAgent, isPending: deletePending } =
    useDeletePropertyAgent(numericResidentId, deleteTarget?.id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const openAdd = () => {
    setEditing(null);
    reset(DEFAULT_VALUES);
    setModalVisible(true);
  };

  const openEdit = (item: PropertyAgentResponse) => {
    setEditing(item);
    reset({
      companyName: item.companyName ?? "",
      propertyManagerName: item.propertyManagerName ?? "",
      phoneNumber: item.phoneNumber ?? "",
      email: item.email ?? "",
      isActive: item.isActive ?? true,
      activeFromDate: item.activeFromDate ?? "",
      activeToDate: item.activeToDate ?? "",
    });
    setModalVisible(true);
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      companyName: values.companyName,
      propertyManagerName: values.propertyManagerName,
      phoneNumber: values.phoneNumber,
      email: values.email,
      isActive: values.isActive,
      activeFromDate: values.activeFromDate || null,
      activeToDate: values.activeToDate || null,
    };

    const onSuccess = () => {
      setModalVisible(false);
      refetch();
    };

    if (editing) {
      updateAgent(payload, { onSuccess });
    } else {
      addAgent(payload, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAgent(undefined, {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
      },
      onError: () => setDeleteTarget(null),
    });
  };

  const columns: MobileColumn<PropertyAgentResponse>[] = [
    { key: "companyName", label: "Company", primary: true },
    { key: "propertyManagerName", label: "Manager" },
    { key: "phoneNumber", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "isActive",
      label: "Active",
      render: (value) => (
        <Text className={value === false ? "text-red-500" : "text-green-600"}>
          {value === false ? "No" : "Yes"}
        </Text>
      ),
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="briefcase-outline"
        title="Property Agent Management"
        subtitle="Manage property agent records linked to residents."
      />

      <View className="mb-3">
        <SelectField
          label="Unit"
          value={residentId}
          onChange={setResidentId}
          options={residences}
          placeholder="Select a unit"
          mode="dropdown"
        />
      </View>

      {!numericResidentId ? (
        <EmptyState
          title="Select a unit"
          message="Choose a resident above to view and manage their property agents."
        />
      ) : (
        <View className="flex-1">
          <View className="absolute bottom-6 right-6 z-50">
            <AnimatedPressable onPress={openAdd}>
              <View className="bg-primary rounded-full p-4 elevation-5">
                <AppIcon name="add" size={24} color="#fff" />
              </View>
            </AnimatedPressable>
          </View>

          <MobileDataList<PropertyAgentResponse>
            data={agents}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            backendMode
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
            pagination={{
              page,
              pageSize: PAGE_SIZE,
              total,
              hasMore: page * PAGE_SIZE < total,
              onPageChange: setPage,
            }}
            keyExtractor={(item) => item.id.toString()}
            emptyMessage="No property agents found for this resident"
            onRefresh={refetch}
            renderActions={(row) => {
              const items: MenuItem[] = [
                {
                  label: "Edit",
                  icon: "pencil",
                  onPress: () => openEdit(row),
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

      <FormSheetModal
        visible={modalVisible}
        title={editing ? "Edit Property Agent" : "Add Property Agent"}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit(onSubmit)}
        loading={editing ? updatePending : addPending}
      >
        <Controller
          control={control}
          name="companyName"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Company Name"
              value={value}
              onChangeText={onChange}
              placeholder="Company name"
            />
          )}
        />

        <View className="mt-3">
          <Controller
            control={control}
            name="propertyManagerName"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Property Manager Name"
                value={value}
                onChangeText={onChange}
                placeholder="Manager name"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Phone Number"
                value={value}
                onChangeText={onChange}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Email"
                value={value}
                onChangeText={onChange}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="activeFromDate"
            render={({ field: { onChange, value } }) => (
              <>
                <Text className="mb-2 text-base font-semibold text-slate-700">
                  Active From
                </Text>
                <DatePickerField value={value} onChange={onChange} />
              </>
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="activeToDate"
            render={({ field: { onChange, value } }) => (
              <>
                <Text className="mb-2 text-base font-semibold text-slate-700">
                  Active To
                </Text>
                <DatePickerField value={value} onChange={onChange} />
              </>
            )}
          />
        </View>

        <Controller
          control={control}
          name="isActive"
          render={({ field: { onChange, value } }) => (
            <SwitchField label="Active" value={value} onChange={onChange} />
          )}
        />
      </FormSheetModal>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Property Agent"
        message={`Are you sure you want to delete "${deleteTarget?.companyName}"?`}
        confirmText="Delete"
        destructive
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
