import {
  useAddAccessDevice,
  useDeleteAccessDevice,
  useGetAccessDevicesByResident,
  useUpdateAccessDevice,
} from "@/src/api/accessDevice.api";
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
import SelectField from "@/src/components/ui/SelectField";
import SwitchField from "@/src/components/ui/SwitchField";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import {
  AccessDeviceResponse,
  FOB_STATUS_OPTIONS,
  FobAssignedTo,
  FobStatus,
  FobType,
  PaidType,
  labelFobStatus,
} from "@/src/types/resident.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

const FOB_TYPE_OPTIONS = [
  { value: "REMOTE", label: "Remote" },
  { value: "KEY_TAG", label: "Key Tag" },
];

const ASSIGNED_TO_OPTIONS = [
  { value: "OWNER", label: "Owner" },
  { value: "TENANT", label: "Tenant" },
  { value: "PROPERTY_AGENT", label: "Property Agent" },
];

const PAID_TYPE_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "EFT", label: "EFT" },
  { value: "CARD", label: "Card" },
  { value: "NONE", label: "None" },
];

interface FormValues {
  type: FobType | "";
  cardNumber: string;
  accessLevel: string;
  assignedTo: FobAssignedTo | "";
  status: FobStatus | "";
  paidAmount: string;
  paidType: PaidType | "";
  paidNotes: string;
  isFree: boolean;
  isPaid: boolean;
}

const DEFAULT_VALUES: FormValues = {
  type: "",
  cardNumber: "",
  accessLevel: "",
  assignedTo: "",
  status: "",
  paidAmount: "",
  paidType: "",
  paidNotes: "",
  isFree: false,
  isPaid: false,
};

export default function AccessDeviceManagement() {
  const { residences } = useResidencesForActiveBuilding();
  const [residentId, setResidentId] = useState<string>();
  const numericResidentId = residentId ? Number(residentId) : undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [residentId]);

  const { data, isLoading, isRefetching, refetch } =
    useGetAccessDevicesByResident(
      numericResidentId,
      { page, limit: PAGE_SIZE, search: search || undefined },
      !!numericResidentId,
    );
  const { items: devices, total } =
    extractPaginatedList<AccessDeviceResponse>(data, { page, limit: PAGE_SIZE });

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<AccessDeviceResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccessDeviceResponse | null>(
    null,
  );

  const { mutate: addDevice, isPending: addPending } =
    useAddAccessDevice(numericResidentId);
  const { mutate: updateDevice, isPending: updatePending } =
    useUpdateAccessDevice(numericResidentId, editing?.id);
  const { mutate: deleteDevice, isPending: deletePending } =
    useDeleteAccessDevice(numericResidentId, deleteTarget?.id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const openAdd = () => {
    setEditing(null);
    reset(DEFAULT_VALUES);
    setModalVisible(true);
  };

  const openEdit = (item: AccessDeviceResponse) => {
    setEditing(item);
    reset({
      type: item.type ?? "",
      cardNumber: item.cardNumber ?? "",
      accessLevel: item.accessLevel ?? "",
      assignedTo: item.assignedTo ?? "",
      status: item.status ?? "",
      paidAmount: item.paidAmount ?? "",
      paidType: item.paidType ?? "",
      paidNotes: item.paidNotes ?? "",
      isFree: !!item.isFree,
      isPaid: !!item.isPaid,
    });
    setModalVisible(true);
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      type: values.type as FobType,
      cardNumber: values.cardNumber,
      accessLevel: values.accessLevel,
      assignedTo: values.assignedTo as FobAssignedTo,
      status: values.status as FobStatus,
      paidAmount: values.paidAmount || undefined,
      paidType: (values.paidType || undefined) as PaidType | undefined,
      paidNotes: values.paidNotes || undefined,
      isFree: values.isFree,
      isPaid: values.isPaid,
    };

    const onSuccess = () => {
      setModalVisible(false);
      refetch();
    };

    if (editing) {
      updateDevice(payload, { onSuccess });
    } else {
      addDevice(payload, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteDevice(undefined, {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
      },
      onError: () => setDeleteTarget(null),
    });
  };

  const columns: MobileColumn<AccessDeviceResponse>[] = [
    { key: "cardNumber", label: "Card #", primary: true },
    { key: "type", label: "Type" },
    { key: "assignedTo", label: "Assigned To" },
    {
      key: "status",
      label: "Status",
      render: (value) => <Text>{labelFobStatus(String(value))}</Text>,
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="key-outline"
        title="Access Device Management"
        subtitle="Manage fobs, remotes, and key tags for residents."
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
          message="Choose a resident above to view and manage their access devices."
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

          <MobileDataList<AccessDeviceResponse>
            data={devices}
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
            emptyMessage="No access devices found for this resident"
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
        title={editing ? "Edit Access Device" : "Add Access Device"}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit(onSubmit)}
        loading={editing ? updatePending : addPending}
      >
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <SelectField
              label="Type"
              value={value}
              onChange={onChange}
              options={FOB_TYPE_OPTIONS}
              placeholder="Select type"
              mode="dropdown"
            />
          )}
        />

        <View className="mt-3">
          <Controller
            control={control}
            name="cardNumber"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Card Number"
                value={value}
                onChangeText={onChange}
                placeholder="Card number"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="accessLevel"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Access Level"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. Parkade, Amenities"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="assignedTo"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Assigned To"
                value={value}
                onChange={onChange}
                options={ASSIGNED_TO_OPTIONS}
                placeholder="Select assignee"
                mode="dropdown"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Status"
                value={value}
                onChange={onChange}
                options={FOB_STATUS_OPTIONS}
                placeholder="Select status"
                mode="dropdown"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="paidAmount"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Paid Amount"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. 50.00"
                keyboardType="decimal-pad"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="paidType"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Paid Type"
                value={value}
                onChange={onChange}
                options={PAID_TYPE_OPTIONS}
                placeholder="Select payment type"
                mode="dropdown"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="paidNotes"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Paid Notes"
                value={value}
                onChangeText={onChange}
                placeholder="Notes"
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="isFree"
          render={({ field: { onChange, value } }) => (
            <SwitchField label="Free" value={value} onChange={onChange} />
          )}
        />

        <Controller
          control={control}
          name="isPaid"
          render={({ field: { onChange, value } }) => (
            <SwitchField label="Paid" value={value} onChange={onChange} />
          )}
        />
      </FormSheetModal>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Access Device"
        message={`Are you sure you want to delete card "${deleteTarget?.cardNumber}"?`}
        confirmText="Delete"
        destructive
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
