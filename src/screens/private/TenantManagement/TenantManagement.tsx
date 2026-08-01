import {
  useAddTenant,
  useDeleteTenant,
  useGetTenantsByResident,
  useUpdateTenant,
} from "@/src/api/tenant.api";
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
import { TenantResponse } from "@/src/types/resident.types";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

const FORM_K_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "UPLOAD", label: "Upload" },
];

interface FormValues {
  fullName: string;
  phoneNumber: string;
  email: string;
  formKSubmitted: "YES" | "NO" | "UPLOAD" | "";
  needsEmergencyAssistance: boolean;
  isActive: boolean;
  activeFromDate: string;
  activeToDate: string;
}

const DEFAULT_VALUES: FormValues = {
  fullName: "",
  phoneNumber: "",
  email: "",
  formKSubmitted: "",
  needsEmergencyAssistance: false,
  isActive: true,
  activeFromDate: "",
  activeToDate: "",
};

export default function TenantManagement() {
  const { residences } = useResidencesForActiveBuilding();
  const [residentId, setResidentId] = useState<string>();
  const numericResidentId = residentId ? Number(residentId) : undefined;

  const { data, isLoading, isRefetching, refetch } = useGetTenantsByResident(
    numericResidentId,
    !!numericResidentId,
  );
  const tenants = data?.data ?? [];

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<TenantResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantResponse | null>(
    null,
  );

  const { mutate: addTenant, isPending: addPending } =
    useAddTenant(numericResidentId);
  const { mutate: updateTenant, isPending: updatePending } = useUpdateTenant(
    numericResidentId,
    editing?.id,
  );
  const { mutate: deleteTenant, isPending: deletePending } = useDeleteTenant(
    numericResidentId,
    deleteTarget?.id,
  );

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const openAdd = () => {
    setEditing(null);
    reset(DEFAULT_VALUES);
    setModalVisible(true);
  };

  const openEdit = (item: TenantResponse) => {
    setEditing(item);
    reset({
      fullName: item.fullName ?? "",
      phoneNumber: item.phoneNumber ?? "",
      email: item.email ?? "",
      formKSubmitted: item.formKSubmitted ?? "",
      needsEmergencyAssistance: !!item.needsEmergencyAssistance,
      isActive: item.isActive ?? true,
      activeFromDate: item.activeFromDate ?? "",
      activeToDate: item.activeToDate ?? "",
    });
    setModalVisible(true);
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      fullName: values.fullName,
      phoneNumber: values.phoneNumber,
      email: values.email,
      formKSubmitted: (values.formKSubmitted || "NO") as
        | "YES"
        | "NO"
        | "UPLOAD",
      needsEmergencyAssistance: values.needsEmergencyAssistance,
      isActive: values.isActive,
      activeFromDate: values.activeFromDate || null,
      activeToDate: values.activeToDate || null,
    };

    const onSuccess = () => {
      setModalVisible(false);
      refetch();
    };

    if (editing) {
      updateTenant(payload, { onSuccess });
    } else {
      addTenant(payload, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteTenant(undefined, {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
      },
      onError: () => setDeleteTarget(null),
    });
  };

  const columns: MobileColumn<TenantResponse>[] = [
    { key: "fullName", label: "Name", primary: true },
    { key: "phoneNumber", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "formKSubmitted", label: "Form K" },
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
        icon="people-outline"
        title="Tenant Management"
        subtitle="Manage tenant records linked to residents."
      />

      <View className="mb-3">
        <SelectField
          label="Resident"
          value={residentId}
          onChange={setResidentId}
          options={residences}
          placeholder="Select a resident"
          mode="dropdown"
        />
      </View>

      {!numericResidentId ? (
        <EmptyState
          title="Select a resident"
          message="Choose a resident above to view and manage their tenants."
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

          <MobileDataList<TenantResponse>
            data={tenants}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            keyExtractor={(item) => item.id.toString()}
            emptyMessage="No tenants found for this resident"
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
        title={editing ? "Edit Tenant" : "Add Tenant"}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit(onSubmit)}
        loading={editing ? updatePending : addPending}
      >
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Full Name"
              value={value}
              onChangeText={onChange}
              placeholder="Full name"
            />
          )}
        />

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
            name="formKSubmitted"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Form K Submitted"
                value={value}
                onChange={onChange}
                options={FORM_K_OPTIONS}
                placeholder="Select status"
                mode="dropdown"
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
          name="needsEmergencyAssistance"
          render={({ field: { onChange, value } }) => (
            <SwitchField
              label="Needs Emergency Assistance"
              value={value}
              onChange={onChange}
            />
          )}
        />

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
        title="Delete Tenant"
        message={`Are you sure you want to delete "${deleteTarget?.fullName}"?`}
        confirmText="Delete"
        destructive
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
