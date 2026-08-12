import {
  useAddEmergencyContact,
  useDeleteEmergencyContact,
  useGetEmergencyContactsByResident,
  useUpdateEmergencyContact,
} from "@/src/api/emergencyContact.api";
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
import { returnToResidentDetails } from "@/src/helper/returnToResidentDetails";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useResidentIdFromRoute } from "@/src/hooks/useResidentIdFromRoute";
import { EmergencyContactResponse } from "@/src/types/resident.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

interface FormValues {
  name: string;
  phoneNumber: string;
  relationship: string;
  consentToContact: boolean;
}

const DEFAULT_VALUES: FormValues = {
  name: "",
  phoneNumber: "",
  relationship: "",
  consentToContact: false,
};

export default function EmergencyContactManagement() {
  const { residences } = useResidencesForActiveBuilding();
  const { residentId, setResidentId, returnToDetails } =
    useResidentIdFromRoute();
  const numericResidentId = residentId ? Number(residentId) : undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [residentId]);

  const { data, isLoading, isRefetching, refetch } =
    useGetEmergencyContactsByResident(
      numericResidentId,
      { page, limit: PAGE_SIZE, search: search || undefined },
      !!numericResidentId,
    );
  const { items: contacts, total } =
    extractPaginatedList<EmergencyContactResponse>(data, { page, limit: PAGE_SIZE });

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<EmergencyContactResponse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] =
    useState<EmergencyContactResponse | null>(null);

  const { mutate: addContact, isPending: addPending } =
    useAddEmergencyContact(numericResidentId);
  const { mutate: updateContact, isPending: updatePending } =
    useUpdateEmergencyContact(numericResidentId, editing?.id);
  const { mutate: deleteContact, isPending: deletePending } =
    useDeleteEmergencyContact(numericResidentId, deleteTarget?.id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const openAdd = () => {
    setEditing(null);
    reset(DEFAULT_VALUES);
    setModalVisible(true);
  };

  const openEdit = (item: EmergencyContactResponse) => {
    setEditing(item);
    reset({
      name: item.name ?? "",
      phoneNumber: item.phoneNumber ?? "",
      relationship: item.relationship ?? "",
      consentToContact: !!item.consentToContact,
    });
    setModalVisible(true);
  };

  const onSubmit = (values: FormValues) => {
    const onSuccess = () => {
      setModalVisible(false);
      if (returnToDetails && returnToResidentDetails(residentId)) return;
      refetch();
    };

    if (editing) {
      updateContact(values, { onSuccess });
    } else {
      addContact(values, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteContact(undefined, {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
      },
      onError: () => setDeleteTarget(null),
    });
  };

  const columns: MobileColumn<EmergencyContactResponse>[] = [
    { key: "name", label: "Name", primary: true },
    { key: "phoneNumber", label: "Phone" },
    { key: "relationship", label: "Relationship" },
    {
      key: "consentToContact",
      label: "Consent",
      render: (value) => <Text>{value ? "Yes" : "No"}</Text>,
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="medkit-outline"
        title="Emergency Contact Management"
        subtitle="Manage emergency contacts linked to residents."
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
          message="Choose a resident above to view and manage their emergency contacts."
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

          <MobileDataList<EmergencyContactResponse>
            data={contacts}
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
            emptyMessage="No emergency contacts found for this resident"
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
        title={editing ? "Edit Emergency Contact" : "Add Emergency Contact"}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit(onSubmit)}
        loading={editing ? updatePending : addPending}
      >
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Name"
              value={value}
              onChangeText={onChange}
              placeholder="Contact name"
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
            name="relationship"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Relationship"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. Spouse, Parent"
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="consentToContact"
          render={({ field: { onChange, value } }) => (
            <SwitchField
              label="Consent to Contact"
              value={value}
              onChange={onChange}
            />
          )}
        />
      </FormSheetModal>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Emergency Contact"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        destructive
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
