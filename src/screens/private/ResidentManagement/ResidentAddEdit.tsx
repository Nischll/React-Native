import {
  useAddResident,
  useGetResidentByBuildingResidenceOnly,
  useUpdateResident,
} from "@/src/api/resident.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import SelectField from "@/src/components/ui/SelectField";
import { extractCreatedEntityId } from "@/src/helper/extractCreatedEntityId";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  RESIDENT_STATUS_OPTIONS,
  ResidentStatus,
} from "@/src/types/resident.types";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";
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

  const { data, isLoading, refetch } = useGetResidentByBuildingResidenceOnly(
    id,
    editMode,
  );
  const { mutate: addResident, isPending: addPending } = useAddResident();
  const { mutate: updateResident, isPending: updatePending } =
    useUpdateResident(id);

  useFocusEffect(
    useCallback(() => {
      if (editMode && id) refetch();
    }, [editMode, id, refetch]),
  );

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
        icon={editMode ? "create-outline" : "person-add-outline"}
        title={editMode ? "Edit Resident" : "Add Resident"}
        subtitle={
          editMode
            ? "Update the unit, then review or manage current records."
            : "Create the unit first, then add current records."
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
        <Card className="mb-4 overflow-hidden p-0">
          <View className="flex-row items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <AppIcon name="home-outline" size={18} color="#453956" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-textPrimary">
                Unit details
              </Text>
              <Text className="text-xs text-textSecondary">
                Unit, status, parking, and storage
              </Text>
            </View>
          </View>

          <View className="px-4 py-4">
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
          </View>
        </Card>

        {editMode && id && data?.data ? (
          <ResidentRelatedRecords residentId={id} resident={data.data} />
        ) : !editMode ? (
          <View className="mb-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <View className="mb-1 flex-row items-center gap-2">
              <AppIcon
                name="information-circle-outline"
                size={18}
                color="#B45309"
              />
              <Text className="text-sm font-semibold text-amber-900">
                Next: current records
              </Text>
            </View>
            <Text className="text-xs leading-5 text-amber-800">
              After you create this unit, you can add owners, tenants, property
              agents, vehicles, visitor passes, access devices, and emergency
              contacts.
            </Text>
          </View>
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}
