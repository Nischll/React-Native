import { useCreateResource, useGetResourceById, useUpdateResource } from "@/src/api/resources.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import SelectField from "@/src/components/ui/SelectField";
import { RESOURCE_TYPE_OPTIONS, ResourceType } from "@/src/types/resource.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormValues = { fileName: string; description: string; type: ResourceType };

export default function ResourceAddEdit() {
  const { id: idParam } = useLocalSearchParams();
  const id = idParam ? Number(idParam) : undefined;
  const editMode = !!idParam;

  const { data, isLoading } = useGetResourceById(id, editMode);
  const { mutate: addMutate, isPending: adding } = useCreateResource();
  const { mutate: updateMutate, isPending: updating } = useUpdateResource(id);

  const [files, setFiles] = useState<PickedFile[]>([]);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { fileName: "", description: "", type: "BUILDING_INFORMATION" },
  });

  useEffect(() => {
    if (editMode && data?.data) {
      const d = data.data;
      reset({ fileName: d.fileName ?? "", description: d.description ?? "", type: d.type });
    }
  }, [editMode, data, reset]);

  const onSubmit = (values: FormValues) => {
    const formData = new FormData();
    formData.append("fileName", values.fileName);
    formData.append("type", values.type);
    if (values.description) formData.append("description", values.description);
    files.forEach((f) => {
      formData.append("files", { uri: f.uri, name: f.name, type: f.mimeType } as any);
    });

    const opts = { onSuccess: () => router.back() };
    if (editMode) updateMutate(formData, opts);
    else addMutate(formData, opts);
  };

  if (editMode && isLoading) return <LoadingState message="Loading..." />;

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20} className="flex-1">
      <PageHeader showBackButton icon="folder-open" title={editMode ? "Edit Resource" : "Add Resource"} subtitle="Resources" />
      <View className="gap-3 pb-10">
        <Controller
          control={control}
          name="fileName"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <AppInput label="Title" value={value} onChangeText={onChange} placeholder="e.g. Fire Safety Policy" />
          )}
        />
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => (
            <SelectField label="Type" options={RESOURCE_TYPE_OPTIONS} value={value} onChange={(v) => onChange(v as ResourceType)} />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <AppInput label="Description" value={value} onChangeText={onChange} multiline numberOfLines={4} />
          )}
        />
        <FilePicker
          label="Attachments"
          accept="all"
          multiple
          values={files}
          onChangeMultiple={setFiles}
          hint="Add PDFs, images, or documents"
        />
        <AppButton onPress={handleSubmit(onSubmit)} loading={adding || updating}>
          {editMode ? "Update" : "Create"}
        </AppButton>
      </View>
    </KeyboardAwareScrollView>
  );
}
