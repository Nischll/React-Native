import { useAddParcel } from "@/src/api/parcelManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import SelectField from "@/src/components/ui/SelectField";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  COURIER_OPTIONS,
  PACKAGE_SIZE_OPTIONS,
  PACKAGE_TYPE_OPTIONS,
  PARCEL_CONDITION_OPTIONS,
} from "@/src/types/parcelManagement.types";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface FormValues {
  residentId: string;
  courier: string;
  packageType: string;
  size: string;
  location: string;
  condition: string;
  receivedById: string;
}

export default function AddEditParcelScreen() {
  const { buildingId, user } = useAuth();

  const { residences, isLoading: residencesLoading } =
    useResidencesForActiveBuilding();

  const { mutate: addParcel, isPending } = useAddParcel(buildingId!);

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      residentId: "",
      courier: "",
      packageType: "",
      size: "",
      location: "",
      condition: "",
      receivedById: String(user?.userId || ""),
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      residentId: Number(values.residentId),
      courier: values.courier as any,
      packageType: values.packageType as any,
      size: values.size as any,
      location: values.location,
      condition: values.condition as any,
      receivedById: Number(values.receivedById),
    };

    console.log("📤 Add Parcel Payload:", payload);

    addParcel(payload, {
      onSuccess: () => {
        console.log("✅ Parcel Added Successfully");
        router.back();
      },
      onError: (err) => {
        console.log("❌ Add Parcel Failed", err);
      },
    });
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="add-circle"
        title="Add Parcel"
        subtitle="Create a new parcel record"
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 30,
          }}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3 mt-4">
            {/* Resident */}
            <Controller
              control={control}
              name="residentId"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Resident"
                  value={value}
                  onChange={onChange}
                  options={residences}
                  // loading={residencesLoading}
                  placeholder="Select Resident"
                />
              )}
            />

            {/* Courier */}
            <Controller
              control={control}
              name="courier"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Courier"
                  value={value}
                  onChange={onChange}
                  options={COURIER_OPTIONS}
                  placeholder="Select Courier"
                />
              )}
            />

            {/* Package Type */}
            <Controller
              control={control}
              name="packageType"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Package Type"
                  value={value}
                  onChange={onChange}
                  options={PACKAGE_TYPE_OPTIONS}
                  placeholder="Select Package Type"
                />
              )}
            />

            {/* Size */}
            <Controller
              control={control}
              name="size"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Package Size"
                  value={value}
                  onChange={onChange}
                  options={PACKAGE_SIZE_OPTIONS}
                  placeholder="Select Package Size"
                />
              )}
            />

            {/* Condition */}
            <Controller
              control={control}
              name="condition"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Condition"
                  value={value}
                  onChange={onChange}
                  options={PARCEL_CONDITION_OPTIONS}
                  placeholder="Select Condition"
                />
              )}
            />

            {/* Location */}
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Location"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Parcel storage location"
                  size="md"
                />
              )}
            />

            <AppButton loading={isPending} onPress={handleSubmit(onSubmit)}>
              Log Parcel
            </AppButton>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
