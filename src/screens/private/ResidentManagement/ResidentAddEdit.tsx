import {
  useAddResident,
  useGetResidentByBuildingResidenceOnly,
  useUpdateResident,
} from "@/src/api/resident.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { CollapsibleCard } from "@/src/components/ui/CollapsibleCard";
import SelectField from "@/src/components/ui/SelectField";
import { extractCreatedEntityId } from "@/src/helper/extractCreatedEntityId";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  RESIDENT_STATUS_OPTIONS,
  ResidentStatus,
} from "@/src/types/resident.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import ResidentRelatedRecords from "./ResidentRelatedRecords";

interface FormValues {
  unit: string;
  parkingStall: string;
  storageLocker: string;
  status: ResidentStatus | "";
}

export default function ResidentAddEditScreen() {
  const { residentId } = useLocalSearchParams<{ residentId?: string }>();
  const id = residentId ? Number(residentId) : undefined;
  const editMode = !!id;

  const { buildingId } = useAuth();
  const [unitOpen, setUnitOpen] = useState(true);

  const { data, isLoading } = useGetResidentByBuildingResidenceOnly(
    id,
    editMode,
  );
  const { mutate: addResident, isPending: addPending } = useAddResident();
  const { mutate: updateResident, isPending: updatePending } =
    useUpdateResident(id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      unit: "",
      parkingStall: "",
      storageLocker: "",
      status: "",
    },
  });

  useEffect(() => {
    if (editMode && data?.data) {
      const resident = data.data;
      reset({
        unit: resident.unit ?? "",
        parkingStall: resident.parkingStall ?? "",
        storageLocker: resident.storageLocker ?? "",
        status: resident.status ?? "",
      });
    }
  }, [editMode, data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      buildingId: buildingId ?? undefined,
      unit: values.unit,
      parkingStall: values.parkingStall || undefined,
      storageLocker: values.storageLocker || undefined,
      status: values.status as ResidentStatus,
    };

    if (editMode) {
      updateResident(payload, {
        onSuccess: () => {
          router.replace({
            pathname: "/(private)/resident-management/resident-details",
            params: { residentId: String(id) },
          });
        },
      });
    } else {
      addResident(payload, {
        onSuccess: (response) => {
          const newId = extractCreatedEntityId(response);
          if (newId) {
            router.replace({
              pathname: "/(private)/resident-management/resident-add-edit",
              params: { residentId: String(newId) },
            });
            return;
          }
          router.back();
        },
      });
    }
  };

  if (editMode && isLoading) {
    return <LoadingState message="Loading resident details." />;
  }

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon={editMode ? "create" : "add-circle"}
        title={editMode ? "Edit Resident" : "Add Resident"}
        subtitle={
          editMode
            ? "Expand a section to edit unit details or manage related records."
            : "Create the unit first, then add related records."
        }
      />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 48,
        }}
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <CollapsibleCard
          icon="home-outline"
          title="Unit details"
          subtitle="Unit, status, parking, storage"
          expanded={unitOpen}
          onToggle={() => setUnitOpen((v) => !v)}
          accentColor="#453956"
        >
          <Controller
            control={control}
            name="unit"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Unit"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. 302"
                size="md"
              />
            )}
          />

          <View className="mt-3">
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Status"
                  value={value}
                  onChange={onChange}
                  options={RESIDENT_STATUS_OPTIONS}
                  placeholder="Select status"
                  mode="dropdown"
                />
              )}
            />
          </View>

          <View className="mt-3">
            <Controller
              control={control}
              name="parkingStall"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Parking Stall"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. P-12"
                  size="md"
                />
              )}
            />
          </View>

          <View className="mt-3 mb-4">
            <Controller
              control={control}
              name="storageLocker"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Storage Locker"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. S-04"
                  size="md"
                />
              )}
            />
          </View>

          <AppButton
            loading={editMode ? updatePending : addPending}
            onPress={handleSubmit(onSubmit)}
          >
            {editMode ? "Save & view details" : "Create Resident"}
          </AppButton>
        </CollapsibleCard>

        {editMode && id ? (
          <ResidentRelatedRecords residentId={id} defaultOpen />
        ) : (
          <View className="mt-1 mb-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Text className="text-sm font-semibold text-amber-900">
              Next: related records
            </Text>
            <Text className="mt-1 text-xs text-amber-800">
              After you create this unit, expandable sections appear for owners,
              tenants, property agents, vehicles, visitor passes, access
              devices, and emergency contacts.
            </Text>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
