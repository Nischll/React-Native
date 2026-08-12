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
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import SelectField from "@/src/components/ui/SelectField";
import SwitchField from "@/src/components/ui/SwitchField";
import { toDateInput } from "@/src/helper/formatDateTime";
import {
  buildTenantFormData,
  formKUiFromApi,
  hasTenantFormK,
  remoteFormKFile,
  tenantEmail,
} from "@/src/helper/tenantFormData";
import { viewTenantFormK } from "@/src/helper/viewResidentAttachment";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useResidentIdFromRoute } from "@/src/hooks/useResidentIdFromRoute";
import { TenantResponse } from "@/src/types/resident.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { showToast } from "@/src/utils/toast";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
  const { residentId, setResidentId, goBackToResident, afterSaveReturn } =
    useResidentIdFromRoute();
  const numericResidentId = residentId ? Number(residentId) : undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [residentId]);

  const { data, isLoading, isRefetching, refetch } = useGetTenantsByResident(
    numericResidentId,
    { page, limit: PAGE_SIZE, search: search || undefined },
    !!numericResidentId,
  );
  const { items: tenants, total } = extractPaginatedList<TenantResponse>(data, { page, limit: PAGE_SIZE });

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
  const formKSubmitted = useWatch({ control, name: "formKSubmitted" });
  const [formKFile, setFormKFile] = useState<PickedFile | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormKFile(null);
    reset(DEFAULT_VALUES);
    setModalVisible(true);
  };

  const openEdit = (item: TenantResponse) => {
    setEditing(item);
    setFormKFile(remoteFormKFile(item));
    reset({
      fullName: item.fullName ?? "",
      phoneNumber: item.phoneNumber ?? "",
      email: tenantEmail(item),
      formKSubmitted: formKUiFromApi(item.formKSubmitted),
      needsEmergencyAssistance: !!item.needsEmergencyAssistance,
      isActive: item.isActive ?? true,
      activeFromDate: toDateInput(item.activeFromDate),
      activeToDate: toDateInput(item.activeToDate),
    });
    setModalVisible(true);
  };

  const openFormK = async (item: TenantResponse) => {
    if (!hasTenantFormK(item)) {
      showToast("error", "No Form K file on file for this tenant.");
      return;
    }
    try {
      await viewTenantFormK({
        tenantId: item.id,
        formKFilePath: item.formKFilePath,
        formKFileUrl: item.formKFileUrl,
      });
    } catch (error: any) {
      showToast(
        "error",
        error?.message || "Could not open the Form K file.",
      );
    }
  };

  const onSubmit = async (values: FormValues) => {
    const needsFile = values.formKSubmitted === "UPLOAD";
    const hasLocal = !!formKFile?.isLocal;
    const hasExisting = hasTenantFormK(editing) && !!formKFile && !formKFile.isLocal;
    if (needsFile && !hasLocal && !hasExisting) {
      showToast("error", "Please upload the Form K file.");
      return;
    }

    try {
      const fd = await buildTenantFormData(values, formKFile);
      const onSuccess = () => {
        setModalVisible(false);
        if (afterSaveReturn()) return;
        refetch();
      };

      if (editing) {
        updateTenant(fd, { onSuccess });
      } else {
        addTenant(fd, { onSuccess });
      }
    } catch (error: any) {
      showToast(
        "error",
        error?.message ||
          "Could not prepare the tenant upload. Try another file.",
      );
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
    {
      key: "email",
      label: "Email",
      render: (_value, row) => <Text>{tenantEmail(row) || "—"}</Text>,
    },
    {
      key: "formKSubmitted",
      label: "Form K",
      render: (value, row) => (
        <View>
          <Text>
            {value === "UPLOADED" || value === "UPLOAD"
              ? "Upload"
              : value
                ? String(value)
                : "—"}
          </Text>
          {hasTenantFormK(row) ? (
            <Text className="mt-0.5 text-xs font-semibold text-primary">
              File attached
            </Text>
          ) : null}
        </View>
      ),
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
        onBack={goBackToResident}
        icon="people-outline"
        title="Tenant Management"
        subtitle="Manage tenant records linked to residents."
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
            emptyMessage="No tenants found for this resident"
            onRefresh={refetch}
            renderActions={(row) => {
              const items: MenuItem[] = [
                {
                  label: "Edit",
                  icon: "pencil",
                  onPress: () => openEdit(row),
                },
                ...(hasTenantFormK(row)
                  ? [
                      {
                        label: "View Form K",
                        icon: "document-text-outline" as const,
                        onPress: () => void openFormK(row),
                      },
                    ]
                  : []),
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

        {formKSubmitted === "UPLOAD" ? (
          <View className="mt-3">
            <FilePicker
              label="Form K file"
              hint="Upload Form K document"
              value={formKFile}
              onChange={setFormKFile}
              onViewExisting={
                editing && hasTenantFormK(editing) && formKFile && !formKFile.isLocal
                  ? () => void openFormK(editing)
                  : undefined
              }
              accept="all"
              compact
            />
          </View>
        ) : null}

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
