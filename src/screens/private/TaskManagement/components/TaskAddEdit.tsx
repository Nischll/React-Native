import { useAddTask } from "@/src/api/taskManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import DatePickerField from "@/src/components/ui/DatePickerField";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import SelectField from "@/src/components/ui/SelectField";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import {
  getSubTypeOptionsForTaskType,
  TASK_AREA_OPTIONS,
  TASK_MODE_OPTIONS,
  TASK_REPORTED_BY_OPTIONS,
  TASK_TYPE_OPTIONS,
  TaskType,
} from "@/src/enums/taskEnums";
import { useEmployeeByBuildingOptions } from "@/src/hooks/useEmployeeByBuilding";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useTaskStatusOptions } from "@/src/hooks/useTaskStatus";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Text, TouchableWithoutFeedback, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FormValues {
  area: string;
  residentId: string;
  type: string;
  subType: string;
  location: string;
  reportedBy: string;
  modeOfCommunication: string;
  title: string;
  description: string;
  assignedTo: string;
  taskStatusId: string;
  priority: string;
  deadline: string;
  actionTaken: string;
  attachment: PickedFile | null;
}

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
];

export default function TaskAddEdit() {
  const insets = useSafeAreaInsets();
  const { buildingId } = useAuth();

  const { residences } = useResidencesForActiveBuilding();
  const { employees } = useEmployeeByBuildingOptions(buildingId);
  const { taskStatus } = useTaskStatusOptions();
  const { mutate: addTask, isPending } = useAddTask();

  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      area: "",
      residentId: "",
      type: "",
      subType: "",
      location: "",
      reportedBy: "",
      modeOfCommunication: "",
      title: "",
      description: "",
      assignedTo: "",
      taskStatusId: "",
      priority: "",
      deadline: "",
      actionTaken: "",
      attachment: null,
    },
  });

  const selectedArea = watch("area");
  const selectedTaskType = watch("type");

  useEffect(() => {
    setValue("subType", "");
  }, [selectedTaskType, setValue]);

  const subTypeOptions = getSubTypeOptionsForTaskType(
    selectedTaskType as TaskType,
  );

  const onSubmit = (values: FormValues) => {
    const formData = new FormData();

    formData.append("area", values.area);
    formData.append("type", values.type);
    if (values.subType) formData.append("subType", values.subType);
    formData.append("location", values.location);
    formData.append("reportedBy", values.reportedBy);
    formData.append("modeOfCommunication", values.modeOfCommunication);
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("assignedTo", values.assignedTo);
    formData.append("taskStatusId", values.taskStatusId);
    formData.append("buildingId", String(buildingId));
    formData.append("priority", values.priority);
    formData.append("deadline", values.deadline);
    formData.append("actionTaken", values.actionTaken);

    if (values.area === "IN_SUITE" && values.residentId) {
      formData.append("residentId", values.residentId);
    }

    if (values.attachment?.isLocal) {
      formData.append("attachmentRequestPojoList[0].file", {
        uri: values.attachment.uri,
        name: values.attachment.name,
        type: values.attachment.mimeType,
      } as any);
    }

    addTask(formData, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <View className="flex-1 bg-white">
      <PageHeader
        showBackButton
        icon="clipboard"
        title="Add Task"
        subtitle="Create and assign a task"
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={20}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          {/* Area + Task Type */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="area"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Area"
                    value={value}
                    onChange={onChange}
                    options={TASK_AREA_OPTIONS}
                    placeholder="Select Area"
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="type"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Task Type"
                    value={value}
                    onChange={onChange}
                    options={TASK_TYPE_OPTIONS}
                    placeholder="Select Type"
                  />
                )}
              />
            </View>
          </View>

          {/* Unit — only when IN_SUITE */}
          {selectedArea === "IN_SUITE" && (
            <View className="mt-3">
              <Controller
                control={control}
                name="residentId"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Unit"
                    value={value}
                    onChange={onChange}
                    options={residences}
                    placeholder="Select Unit"
                  />
                )}
              />
            </View>
          )}

          {/* Sub Type — only when options exist */}
          {subTypeOptions.length > 0 && (
            <View className="mt-3">
              <Controller
                control={control}
                name="subType"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Sub Type"
                    value={value}
                    onChange={onChange}
                    options={subTypeOptions}
                    placeholder="Select Sub Type"
                  />
                )}
              />
            </View>
          )}

          {/* Title */}
          <View className="mt-3">
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange } }) => (
                <AppInput
                  label="Title"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Task title"
                />
              )}
            />
          </View>

          {/* Description */}
          <View className="mt-3">
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <TextAreaField
                  label="Description"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Task description"
                  multiline
                  numberOfLines={4}
                />
              )}
            />
          </View>

          {/* Location */}
          <View className="mt-3">
            <Controller
              control={control}
              name="location"
              render={({ field: { value, onChange } }) => (
                <AppInput
                  label="Location"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter location"
                />
              )}
            />
          </View>

          {/* Reported By + Communication */}
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="reportedBy"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Reported By"
                    value={value}
                    onChange={onChange}
                    options={TASK_REPORTED_BY_OPTIONS}
                    placeholder="Select Reporter"
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="modeOfCommunication"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Communication"
                    value={value}
                    onChange={onChange}
                    options={TASK_MODE_OPTIONS}
                    placeholder="Select Mode"
                  />
                )}
              />
            </View>
          </View>

          {/* Task Status */}
          <View className="mt-3">
            <Controller
              control={control}
              name="taskStatusId"
              render={({ field: { value, onChange } }) => (
                <SelectField
                  label="Task Status"
                  value={value}
                  onChange={onChange}
                  options={taskStatus}
                  placeholder="Select Status"
                />
              )}
            />
          </View>

          {/* Assigned To + Priority */}
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="assignedTo"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Assigned To"
                    value={value}
                    onChange={onChange}
                    options={employees}
                    placeholder="Select Employee"
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="priority"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Priority"
                    value={value}
                    onChange={onChange}
                    options={PRIORITY_OPTIONS}
                    placeholder="Select Priority"
                  />
                )}
              />
            </View>
          </View>

          {/* Deadline */}
          <View className="mt-3">
            <Text className="mb-2 text-base font-semibold text-slate-700">
              Deadline
            </Text>
            <Controller
              control={control}
              name="deadline"
              render={({ field: { value, onChange } }) => (
                <DatePickerField value={value} onChange={onChange} />
              )}
            />
          </View>

          {/* Action Taken */}
          <View className="mt-3">
            <Controller
              control={control}
              name="actionTaken"
              render={({ field: { value, onChange } }) => (
                <TextAreaField
                  label="Action Taken"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Action taken"
                  multiline
                  numberOfLines={4}
                />
              )}
            />
          </View>

          {/* Attachment */}
          <View className="mt-3">
            <Controller
              control={control}
              name="attachment"
              render={({ field: { value, onChange } }) => (
                <FilePicker
                  compact
                  accept="all"
                  label="Attachment"
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>

      {/* Pinned submit button — always visible above the home indicator */}
      <View
        className="border-t border-slate-200 bg-white px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <AppButton loading={isPending} onPress={handleSubmit(onSubmit)}>
          Create Task
        </AppButton>
      </View>
    </View>
  );
}
