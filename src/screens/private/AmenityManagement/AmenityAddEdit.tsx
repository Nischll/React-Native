import { useAddAmenity, useGetAmenityById, useUpdateAmenity } from "@/src/api/amenity.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormValues = { name: string; description: string };

export default function AmenityAddEdit() {
  const { id: idParam } = useLocalSearchParams();
  const id = idParam ? Number(idParam) : undefined;
  const editMode = !!idParam;
  const { data, isLoading } = useGetAmenityById(id, editMode);
  const { mutate: addMutate, isPending: adding } = useAddAmenity();
  const { mutate: updateMutate, isPending: updating } = useUpdateAmenity(id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (editMode && data?.data) {
      const d = data.data;
      reset({ name: d.name ?? "", description: d.description ?? "" });
    }
  }, [editMode, data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
    };
    const opts = { onSuccess: () => router.back() };
    if (editMode) updateMutate(payload, opts);
    else addMutate(payload, opts);
  };

  if (editMode && isLoading) return <LoadingState message="Loading..." />;

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20} className="flex-1">
      <PageHeader showBackButton icon="fitness" title={editMode ? "Edit Amenity" : "Create Amenity"} subtitle="Amenity Management" />
      <View className="gap-3 pb-10">
        <Controller
          control={control}
          name="name"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <AppInput label="Amenity Name" value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <AppInput label="Description" value={value} onChangeText={onChange} multiline numberOfLines={4} />
          )}
        />
        <AppButton onPress={handleSubmit(onSubmit)} loading={adding || updating}>
          {editMode ? "Update" : "Create"}
        </AppButton>
      </View>
    </KeyboardAwareScrollView>
  );
}
