import {
  useAddVisitorPass,
  useDeleteVisitorPass,
  useGetVisitorPassesByResident,
  useUpdateVisitorPass,
} from "@/src/api/visitorPass.api";
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
import {
  PaidType,
  VisitorPassResponse,
  VisitorPassStatus,
} from "@/src/types/resident.types";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "LOST", label: "Lost" },
];

const PAID_TYPE_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "EFT", label: "EFT" },
  { value: "CARD", label: "Card" },
  { value: "NONE", label: "None" },
];

interface FormValues {
  visitorPassNumber: string;
  dateOfIssue: string;
  status: VisitorPassStatus | "";
  paidAmount: string;
  paidType: PaidType | "";
  paidNotes: string;
  isFree: boolean;
  isPaid: boolean;
}

const DEFAULT_VALUES: FormValues = {
  visitorPassNumber: "",
  dateOfIssue: "",
  status: "",
  paidAmount: "",
  paidType: "",
  paidNotes: "",
  isFree: false,
  isPaid: false,
};

export default function VisitorPassManagement() {
  const { residences } = useResidencesForActiveBuilding();
  const [residentId, setResidentId] = useState<string>();
  const numericResidentId = residentId ? Number(residentId) : undefined;

  const { data, isLoading, isRefetching, refetch } =
    useGetVisitorPassesByResident(numericResidentId, !!numericResidentId);
  const passes = data?.data ?? [];

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<VisitorPassResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VisitorPassResponse | null>(
    null,
  );

  const { mutate: addPass, isPending: addPending } =
    useAddVisitorPass(numericResidentId);
  const { mutate: updatePass, isPending: updatePending } =
    useUpdateVisitorPass(numericResidentId, editing?.id);
  const { mutate: deletePass, isPending: deletePending } =
    useDeleteVisitorPass(numericResidentId, deleteTarget?.id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const openAdd = () => {
    setEditing(null);
    reset(DEFAULT_VALUES);
    setModalVisible(true);
  };

  const openEdit = (item: VisitorPassResponse) => {
    setEditing(item);
    reset({
      visitorPassNumber: item.visitorPassNumber ?? "",
      dateOfIssue: item.dateOfIssue ?? "",
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
      visitorPassNumber: values.visitorPassNumber,
      dateOfIssue: values.dateOfIssue,
      status: (values.status || "ACTIVE") as VisitorPassStatus,
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
      updatePass(payload, { onSuccess });
    } else {
      addPass(payload, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePass(undefined, {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
      },
      onError: () => setDeleteTarget(null),
    });
  };

  const columns: MobileColumn<VisitorPassResponse>[] = [
    { key: "visitorPassNumber", label: "Pass #", primary: true },
    {
      key: "dateOfIssue",
      label: "Issued",
      render: (value) =>
        value ? new Date(String(value)).toLocaleDateString() : "—",
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Text
          className={
            value === "ACTIVE" ? "text-green-600 font-semibold" : "text-red-500 font-semibold"
          }
        >
          {value === "ACTIVE" ? "Active" : "Lost"}
        </Text>
      ),
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="ticket-outline"
        title="Visitor Pass Management"
        subtitle="Manage visitor passes issued to residents."
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
          message="Choose a resident above to view and manage their visitor passes."
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

          <MobileDataList<VisitorPassResponse>
            data={passes}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            keyExtractor={(item) => item.id.toString()}
            emptyMessage="No visitor passes found for this resident"
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
        title={editing ? "Edit Visitor Pass" : "Add Visitor Pass"}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit(onSubmit)}
        loading={editing ? updatePending : addPending}
      >
        <Controller
          control={control}
          name="visitorPassNumber"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Visitor Pass Number"
              value={value}
              onChangeText={onChange}
              placeholder="Pass number"
            />
          )}
        />

        <View className="mt-3">
          <Text className="mb-2 text-base font-semibold text-slate-700">
            Date of Issue
          </Text>
          <Controller
            control={control}
            name="dateOfIssue"
            render={({ field: { onChange, value } }) => (
              <DatePickerField value={value} onChange={onChange} />
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
                options={STATUS_OPTIONS}
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
                placeholder="e.g. 25.00"
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
        title="Delete Visitor Pass"
        message={`Are you sure you want to delete pass "${deleteTarget?.visitorPassNumber}"?`}
        confirmText="Delete"
        destructive
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
