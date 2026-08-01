import { useAddCategory, useGetCategories, useUpdateCategory } from "@/src/api/category.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormValues = { name: string };

export default function CategoryAddEdit() {
  const { id: idParam } = useLocalSearchParams();
  const id = idParam ? Number(idParam) : undefined;
  const editMode = !!idParam;

  const { data, isLoading } = useGetCategories(editMode);
  const record = useMemo(
    () => data?.data?.find((c) => c.id === id),
    [data, id],
  );
  const { mutate: addMutate, isPending: adding } = useAddCategory();
  const { mutate: updateMutate, isPending: updating } = useUpdateCategory(id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (editMode && record) {
      reset({ name: record.name ?? "" });
    }
  }, [editMode, record, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = { name: values.name };
    const opts = { onSuccess: () => router.back() };
    if (editMode) updateMutate(payload, opts);
    else addMutate(payload, opts);
  };

  if (editMode && isLoading) return <LoadingState message="Loading..." />;

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20} className="flex-1">
      <PageHeader showBackButton icon="pricetag" title={editMode ? "Edit Category" : "Create Category"} subtitle="Category Management" />
      <View className="gap-3 pb-10">
        <Controller
          control={control}
          name="name"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <AppInput label="Category Name" value={value} onChangeText={onChange} />
          )}
        />
        <AppButton onPress={handleSubmit(onSubmit)} loading={adding || updating}>
          {editMode ? "Update" : "Create"}
        </AppButton>
      </View>
    </KeyboardAwareScrollView>
  );
}
