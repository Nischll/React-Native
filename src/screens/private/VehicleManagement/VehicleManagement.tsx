import {
  useAddVehicle,
  useDeleteVehicle,
  useGetVehiclesByResident,
  useUpdateVehicle,
} from "@/src/api/vehicle.api";
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
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { VehicleResponse } from "@/src/types/resident.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

interface FormValues {
  licensePlateNumber: string;
  color: string;
  makeAndModel: string;
}

const DEFAULT_VALUES: FormValues = {
  licensePlateNumber: "",
  color: "",
  makeAndModel: "",
};

export default function VehicleManagement() {
  const { residences } = useResidencesForActiveBuilding();
  const [residentId, setResidentId] = useState<string>();
  const numericResidentId = residentId ? Number(residentId) : undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [residentId]);

  const { data, isLoading, isRefetching, refetch } = useGetVehiclesByResident(
    numericResidentId,
    { page, limit: PAGE_SIZE, search: search || undefined },
    !!numericResidentId,
  );
  const { items: vehicles, total } =
    extractPaginatedList<VehicleResponse>(data, { page, limit: PAGE_SIZE });

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<VehicleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleResponse | null>(
    null,
  );

  const { mutate: addVehicle, isPending: addPending } =
    useAddVehicle(numericResidentId);
  const { mutate: updateVehicle, isPending: updatePending } =
    useUpdateVehicle(numericResidentId, editing?.id);
  const { mutate: deleteVehicle, isPending: deletePending } =
    useDeleteVehicle(numericResidentId, deleteTarget?.id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const openAdd = () => {
    setEditing(null);
    reset(DEFAULT_VALUES);
    setModalVisible(true);
  };

  const openEdit = (item: VehicleResponse) => {
    setEditing(item);
    reset({
      licensePlateNumber: item.licensePlateNumber ?? "",
      color: item.color ?? "",
      makeAndModel: item.makeAndModel ?? "",
    });
    setModalVisible(true);
  };

  const onSubmit = (values: FormValues) => {
    const onSuccess = () => {
      setModalVisible(false);
      refetch();
    };

    if (editing) {
      updateVehicle(values, { onSuccess });
    } else {
      addVehicle(values, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteVehicle(undefined, {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
      },
      onError: () => setDeleteTarget(null),
    });
  };

  const columns: MobileColumn<VehicleResponse>[] = [
    { key: "licensePlateNumber", label: "Plate", primary: true },
    { key: "makeAndModel", label: "Make & Model" },
    { key: "color", label: "Color" },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="car-outline"
        title="Vehicle Management"
        subtitle="Manage vehicle records linked to residents."
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
          message="Choose a resident above to view and manage their vehicles."
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

          <MobileDataList<VehicleResponse>
            data={vehicles}
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
            emptyMessage="No vehicles found for this resident"
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
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit(onSubmit)}
        loading={editing ? updatePending : addPending}
      >
        <Controller
          control={control}
          name="licensePlateNumber"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="License Plate Number"
              value={value}
              onChangeText={onChange}
              placeholder="e.g. ABC 123"
              autoCapitalize="characters"
            />
          )}
        />

        <View className="mt-3">
          <Controller
            control={control}
            name="makeAndModel"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Make & Model"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. Toyota Corolla"
              />
            )}
          />
        </View>

        <View className="mt-3">
          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Color"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. Black"
              />
            )}
          />
        </View>
      </FormSheetModal>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Vehicle"
        message={`Are you sure you want to delete "${deleteTarget?.licensePlateNumber}"?`}
        confirmText="Delete"
        destructive
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
