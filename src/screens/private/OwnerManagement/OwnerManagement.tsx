import {
  useAddOwner,
  useDeleteOwner,
  useGetOwnersByResident,
  useUpdateOwner,
} from "@/src/api/owner.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import FormSheetModal from "@/src/components/domain/FormSheetModal";
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
import { dateInputToIsoOrNull, toDateInput } from "@/src/helper/formatDateTime";
import { returnToResidentDetails } from "@/src/helper/returnToResidentDetails";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useResidentIdFromRoute } from "@/src/hooks/useResidentIdFromRoute";
import { OwnerResponse } from "@/src/types/resident.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

interface FormValues {
  fullName: string;
  phoneNumber: string;
  email: string;
  needsEmergencyAssistance: boolean;
  isActive: boolean;
  activeFromDate: string;
  activeToDate: string;
}

const DEFAULT_VALUES: FormValues = {
  fullName: "",
  phoneNumber: "",
  email: "",
  needsEmergencyAssistance: false,
  isActive: true,
  activeFromDate: "",
  activeToDate: "",
};

export default function OwnerManagement() {
  const { residences } = useResidencesForActiveBuilding();
  const { residentId, setResidentId, returnToDetails } =
    useResidentIdFromRoute();
  const numericResidentId = residentId ? Number(residentId) : undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [residentId]);

  const { data, isLoading, isRefetching, refetch } = useGetOwnersByResident(
    numericResidentId,
    { page, limit: PAGE_SIZE, search: search || undefined },
    !!numericResidentId,
  );
  const { items: owners, total } = extractPaginatedList<OwnerResponse>(data, { page, limit: PAGE_SIZE });

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<OwnerResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OwnerResponse | null>(null);

  const { mutate: addOwner, isPending: addPending } =
    useAddOwner(numericResidentId);
  const { mutate: updateOwner, isPending: updatePending } = useUpdateOwner(
    numericResidentId,
    editing?.id,
  );
  const { mutate: deleteOwner, isPending: deletePending } = useDeleteOwner(
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

  const openEdit = (item: OwnerResponse) => {
    setEditing(item);
    reset({
      fullName: item.fullName ?? "",
      phoneNumber: item.phoneNumber ?? "",
      email: item.email ?? "",
      needsEmergencyAssistance: !!item.needsEmergencyAssistance,
      isActive: item.isActive ?? true,
      activeFromDate: toDateInput(item.activeFromDate),
      activeToDate: toDateInput(item.activeToDate),
    });
    setModalVisible(true);
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      fullName: values.fullName,
      phoneNumber: values.phoneNumber,
      email: values.email,
      needsEmergencyAssistance: values.needsEmergencyAssistance,
      isActive: values.isActive,
      activeFromDate: dateInputToIsoOrNull(values.activeFromDate),
      activeToDate: dateInputToIsoOrNull(values.activeToDate),
    };

    const onSuccess = () => {
      setModalVisible(false);
      if (returnToDetails && returnToResidentDetails(residentId)) return;
      refetch();
    };

    if (editing) {
      updateOwner(payload, { onSuccess });
    } else {
      addOwner(payload, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteOwner(undefined, {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
      },
      onError: () => setDeleteTarget(null),
    });
  };

  const columns: MobileColumn<OwnerResponse>[] = [
    { key: "fullName", label: "Name", primary: true },
    { key: "phoneNumber", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "needsEmergencyAssistance",
      label: "Emergency Assist.",
      render: (value) => <Text>{value ? "Yes" : "No"}</Text>,
    },
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
        icon="person-outline"
        title="Owner Management"
        subtitle="Manage owner records linked to residents."
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
          message="Choose a resident above to view and manage their owners."
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

          <MobileDataList<OwnerResponse>
            data={owners}
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
            emptyMessage="No owners found for this resident"
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
        title={editing ? "Edit Owner" : "Add Owner"}
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
        title="Delete Owner"
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
