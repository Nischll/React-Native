import {
  useAddResident,
  useGetResidentByBuildingResidenceOnly,
  useUpdateResident,
} from "@/src/api/resident.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import SelectField from "@/src/components/ui/SelectField";
import { extractCreatedEntityId } from "@/src/helper/extractCreatedEntityId";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  RESIDENT_STATUS_OPTIONS,
  ResidentStatus,
} from "@/src/types/resident.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Text, TouchableWithoutFeedback, View } from "react-native";
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
      updateResident(payload);
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
            ? "Update unit details, then manage owners, tenants, and other records."
            : "Create a new resident record for this building."
        }
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 30,
          }}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
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

            <View className="my-3">
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
              {editMode ? "Update Resident" : "Create Resident"}
            </AppButton>

            {editMode && id ? (
              <View className="mt-5">
                <ResidentRelatedRecords residentId={id} />
              </View>
            ) : (
              <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <Text className="text-sm font-semibold text-amber-900">
                  Next: related records
                </Text>
                <Text className="mt-1 text-xs text-amber-800">
                  After you create this unit, you can add owners, tenants,
                  property agents, vehicles, visitor passes, access devices, and
                  emergency contacts — the same as the web resident form.
                </Text>
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
