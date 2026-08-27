import {
  useAddTrade,
  useGetTradeById,
  useUpdateTrade,
} from "@/src/api/tradeDirectory.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormValues = { name: string; company: string; contact: string };

export default function TradeDirectoryAddEdit() {
  const { id: idParam } = useLocalSearchParams();
  const id = idParam ? Number(idParam) : undefined;
  const editMode = !!idParam;
  const { data, isLoading } = useGetTradeById(id, editMode);
  const { mutate: addMutate, isPending: adding } = useAddTrade();
  const { mutate: updateMutate, isPending: updating } = useUpdateTrade(id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: "", company: "", contact: "" },
  });

  useEffect(() => {
    if (editMode && data?.data) {
      const d = data.data;
      reset({
        name: d.name ?? "",
        company: d.company ?? "",
        contact: d.contact ?? "",
      });
    }
  }, [editMode, data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name.trim(),
      company: values.company.trim() || undefined,
      contact: values.contact.trim() || undefined,
    };
    const opts = { onSuccess: () => router.back() };
    if (editMode) updateMutate(payload, opts);
    else addMutate(payload, opts);
  };

  if (editMode && isLoading) return <LoadingState message="Loading..." />;

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
      className="flex-1"
    >
      <PageHeader
        showBackButton
        icon="briefcase"
        title={editMode ? "Edit Trade" : "Create Trade"}
        subtitle="Trade Directory"
      />
      <View className="gap-3 pb-10">
        <Controller
          control={control}
          name="name"
          rules={{ required: "Name is required" }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <AppInput
              label="Name"
              value={value}
              onChangeText={onChange}
              placeholder="Trade / technician name"
              error={error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="company"
          render={({ field: { value, onChange } }) => (
            <AppInput
              label="Company"
              value={value}
              onChangeText={onChange}
              placeholder="Optional"
            />
          )}
        />
        <Controller
          control={control}
          name="contact"
          render={({ field: { value, onChange } }) => (
            <AppInput
              label="Contact"
              value={value}
              onChangeText={onChange}
              placeholder="Phone or email"
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
