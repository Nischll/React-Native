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
import { useAuth } from "@/src/providers/AuthProvider";
import {
  RESIDENT_STATUS_OPTIONS,
  ResidentStatus,
} from "@/src/types/resident.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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
      updateResident(payload, {
        onSuccess: () => router.back(),
      });
    } else {
      addResident(payload, {
        onSuccess: () => router.back(),
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
            ? "Update this resident's unit details."
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
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
