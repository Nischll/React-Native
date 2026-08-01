import { useAddBuilding, useGetBuildingById, useUpdateBuilding } from "@/src/api/building.api";
import { useGetAmenities } from "@/src/api/amenity.api";
import { useGetTowers } from "@/src/api/tower.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import SelectField from "@/src/components/ui/SelectField";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormValues = {
  name: string;
  address: string;
  strataPlan: string;
  totalFloor: string;
  noOfUnits: string;
  amenityIds: string[];
  towerIds: string[];
};

export default function BuildingAddEdit() {
  const { id: idParam } = useLocalSearchParams();
  const id = idParam ? Number(idParam) : undefined;
  const editMode = !!idParam;

  const { data, isLoading } = useGetBuildingById(id, editMode);
  const { data: amenitiesData } = useGetAmenities();
  const { data: towersData } = useGetTowers();
  const { mutate: addMutate, isPending: adding } = useAddBuilding();
  const { mutate: updateMutate, isPending: updating } = useUpdateBuilding(id);

  const amenityOptions = useMemo(
    () => (amenitiesData?.data ?? []).map((a) => ({ label: a.name, value: String(a.id) })),
    [amenitiesData],
  );
  const towerOptions = useMemo(
    () => (towersData?.data ?? []).map((t) => ({ label: t.name, value: String(t.id) })),
    [towersData],
  );

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      name: "",
      address: "",
      strataPlan: "",
      totalFloor: "",
      noOfUnits: "",
      amenityIds: [],
      towerIds: [],
    },
  });

  useEffect(() => {
    if (editMode && data?.data) {
      const d = data.data;
      reset({
        name: d.name ?? "",
        address: d.address ?? "",
        strataPlan: d.strataPlan ?? "",
        totalFloor: d.totalFloor != null ? String(d.totalFloor) : "",
        noOfUnits: d.noOfUnits != null ? String(d.noOfUnits) : "",
        amenityIds: (d.amenityIds ?? d.amenities?.map((a) => a.id) ?? []).map(String),
        towerIds: (d.towerIds ?? d.towers?.map((t) => t.id) ?? []).map(String),
      });
    }
  }, [editMode, data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      address: values.address,
      strataPlan: values.strataPlan || undefined,
      totalFloor: values.totalFloor ? Number(values.totalFloor) : undefined,
      noOfUnits: values.noOfUnits ? Number(values.noOfUnits) : undefined,
      amenityIds: values.amenityIds.map(Number),
      towerIds: values.towerIds.map(Number),
    };
    const opts = { onSuccess: () => router.back() };
    if (editMode) updateMutate(payload, opts);
    else addMutate(payload, opts);
  };

  if (editMode && isLoading) return <LoadingState message="Loading..." />;

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20} className="flex-1">
      <PageHeader showBackButton icon="business" title={editMode ? "Edit Building" : "Create Building"} subtitle="Building Management" />
      <View className="gap-3 pb-10">
        <Controller
          control={control}
          name="name"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <AppInput label="Building Name" value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="address"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <AppInput label="Building Address" value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="strataPlan"
          render={({ field: { value, onChange } }) => (
            <AppInput label="Strata Plan" value={value} onChangeText={onChange} placeholder="e.g. SP12345" />
          )}
        />
        <Controller
          control={control}
          name="totalFloor"
          render={({ field: { value, onChange } }) => (
            <AppInput label="Total Floors" value={value} onChangeText={onChange} keyboardType="numeric" />
          )}
        />
        <Controller
          control={control}
          name="noOfUnits"
          render={({ field: { value, onChange } }) => (
            <AppInput label="No. of Units" value={value} onChangeText={onChange} keyboardType="numeric" />
          )}
        />
        <Controller
          control={control}
          name="amenityIds"
          render={({ field: { value, onChange } }) => (
            <SelectField
              label="Amenities"
              multi
              placeholder="Select amenities"
              options={amenityOptions}
              value={value}
              onChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="towerIds"
          render={({ field: { value, onChange } }) => (
            <SelectField
              label="Towers"
              multi
              placeholder="Select towers"
              options={towerOptions}
              value={value}
              onChange={onChange}
            />
          )}
        />
        <AppButton onPress={handleSubmit(onSubmit)} loading={adding || updating}>
          {editMode ? "Update" : "Create"}
        </AppButton>
      </View>
    </KeyboardAwareScrollView>
  );
}
