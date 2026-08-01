import { useGetCategories } from "@/src/api/category.api";
import { useAddTaskStatus, useGetTaskStatuses, useUpdateTaskStatus } from "@/src/api/taskStatus.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import SelectField from "@/src/components/ui/SelectField";
import { Category } from "@/src/types/category.types";
import { TaskStatus } from "@/src/types/taskStatus.types";
import { extractPaginatedList } from "@/src/utils/listPagination";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormValues = { name: string; categoryId: string; sortingNumber: string };

export default function TaskStatusAddEdit() {
  const { id: idParam } = useLocalSearchParams();
  const id = idParam ? Number(idParam) : undefined;
  const editMode = !!idParam;

  const { data, isLoading } = useGetTaskStatuses({}, editMode);
  const { items: taskStatuses } = extractPaginatedList<TaskStatus>(data);
  const record = useMemo(() => taskStatuses.find((s) => s.id === id), [taskStatuses, id]);
  const { data: categoriesData } = useGetCategories();
  const { items: categories } = extractPaginatedList<Category>(categoriesData);
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.name, value: String(c.id) })),
    [categories],
  );

  const { mutate: addMutate, isPending: adding } = useAddTaskStatus();
  const { mutate: updateMutate, isPending: updating } = useUpdateTaskStatus(id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: "", categoryId: "", sortingNumber: "" },
  });

  useEffect(() => {
    if (editMode && record) {
      reset({
        name: record.name ?? "",
        categoryId: record.categoryId != null ? String(record.categoryId) : "",
        sortingNumber: record.sortingNumber != null ? String(record.sortingNumber) : "",
      });
    }
  }, [editMode, record, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      categoryId: values.categoryId ? Number(values.categoryId) : undefined,
      sortingNumber: values.sortingNumber ? Number(values.sortingNumber) : undefined,
    };
    const opts = { onSuccess: () => router.back() };
    if (editMode) updateMutate(payload, opts);
    else addMutate(payload, opts);
  };

  if (editMode && isLoading) return <LoadingState message="Loading..." />;

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20} className="flex-1">
      <PageHeader showBackButton icon="flag" title={editMode ? "Edit Task Status" : "Create Task Status"} subtitle="Task Status Management" />
      <View className="gap-3 pb-10">
        <Controller
          control={control}
          name="name"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <AppInput label="Status Name" value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="categoryId"
          render={({ field: { value, onChange } }) => (
            <SelectField label="Category" placeholder="Select category" options={categoryOptions} value={value} onChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="sortingNumber"
          render={({ field: { value, onChange } }) => (
            <AppInput label="Order" value={value} onChangeText={onChange} keyboardType="numeric" />
          )}
        />
        <AppButton onPress={handleSubmit(onSubmit)} loading={adding || updating}>
          {editMode ? "Update" : "Create"}
        </AppButton>
      </View>
    </KeyboardAwareScrollView>
  );
}
