import { useGetBuildings } from "@/src/api/building.api";
import { useGetStaff } from "@/src/api/employee.api";
import {
  useAddEmployeeBuildingAssignment,
  useUpdateEmployeeBuildingAssignment,
} from "@/src/api/employeeBuildingAssignment.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import DatePickerField from "@/src/components/ui/DatePickerField";
import SelectField from "@/src/components/ui/SelectField";
import { EmployeeBuildingAssignmentResponse } from "@/src/types/employeeBuildingAssignment.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Text, TouchableWithoutFeedback, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface FormValues {
  userId: string;
  buildingId: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const DEFAULT_VALUES: FormValues = {
  userId: "",
  buildingId: "",
  startDate: "",
  endDate: "",
  notes: "",
};

export default function EmployeeBuildingAssignmentAddEditScreen() {
  const { assignmentId, assignment } = useLocalSearchParams<{
    assignmentId?: string;
    assignment?: string;
  }>();
  const id = assignmentId ? Number(assignmentId) : undefined;
  const editMode = !!id;

  const existingAssignment: EmployeeBuildingAssignmentResponse | null =
    useMemo(() => {
      if (!assignment) return null;
      try {
        return JSON.parse(assignment) as EmployeeBuildingAssignmentResponse;
      } catch {
        return null;
      }
    }, [assignment]);

  const { data: staffData } = useGetStaff();
  const { data: buildingsData } = useGetBuildings();

  const staffOptions = (staffData?.data?.data ?? []).map((s) => ({
    label: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.username,
    value: String(s.id),
  }));
  const buildingOptions = (buildingsData?.data ?? []).map((b) => ({
    label: b.name ?? `Building ${b.id}`,
    value: String(b.id),
  }));

  const { mutate: addAssignment, isPending: addPending } =
    useAddEmployeeBuildingAssignment();
  const { mutate: updateAssignment, isPending: updatePending } =
    useUpdateEmployeeBuildingAssignment(id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (editMode && existingAssignment) {
      reset({
        userId: String(existingAssignment.userId ?? ""),
        buildingId: String(existingAssignment.buildingId ?? ""),
        startDate: existingAssignment.startDate ?? "",
        endDate: existingAssignment.endDate ?? "",
        notes: existingAssignment.notes ?? "",
      });
    }
  }, [editMode, existingAssignment, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      userId: Number(values.userId),
      buildingId: Number(values.buildingId),
      startDate: values.startDate,
      endDate: values.endDate || undefined,
      notes: values.notes || undefined,
    };

    if (editMode) {
      updateAssignment(payload, { onSuccess: () => router.back() });
    } else {
      addAssignment(payload, { onSuccess: () => router.back() });
    }
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon={editMode ? "create" : "business"}
        title={editMode ? "Edit Assignment" : "Add Assignment"}
        subtitle={
          editMode
            ? "Update this employee-building assignment."
            : "Assign an employee to a building."
        }
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 30 }}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Controller
              control={control}
              name="userId"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Employee"
                  value={value}
                  onChange={onChange}
                  options={staffOptions}
                  placeholder="Select an employee"
                  mode="dropdown"
                />
              )}
            />

            <View className="mt-3">
              <Controller
                control={control}
                name="buildingId"
                render={({ field: { onChange, value } }) => (
                  <SelectField
                    label="Building"
                    value={value}
                    onChange={onChange}
                    options={buildingOptions}
                    placeholder="Select a building"
                    mode="dropdown"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Text className="mb-2 text-base font-semibold text-slate-700">
                Start Date
              </Text>
              <Controller
                control={control}
                name="startDate"
                render={({ field: { onChange, value } }) => (
                  <DatePickerField value={value} onChange={onChange} />
                )}
              />
            </View>

            <View className="mt-3">
              <Text className="mb-2 text-base font-semibold text-slate-700">
                End Date (optional)
              </Text>
              <Controller
                control={control}
                name="endDate"
                render={({ field: { onChange, value } }) => (
                  <DatePickerField
                    value={value}
                    onChange={onChange}
                    placeholder="Ongoing"
                  />
                )}
              />
            </View>

            <View className="my-3">
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Notes"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Optional notes"
                    multiline
                    numberOfLines={3}
                  />
                )}
              />
            </View>

            <AppButton
              loading={editMode ? updatePending : addPending}
              onPress={handleSubmit(onSubmit)}
            >
              {editMode ? "Update Assignment" : "Create Assignment"}
            </AppButton>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
