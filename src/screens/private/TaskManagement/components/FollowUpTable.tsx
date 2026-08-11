import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import DatePickerField from "@/src/components/ui/DatePickerField";
import SelectField from "@/src/components/ui/SelectField";
import { FOLLOW_UP_METHOD_OPTIONS } from "@/src/enums/taskEnums";
import { Control, Controller, useFieldArray } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { emptyFollowUpRow } from "../followUpFormData";

type Props = {
  // Parent form includes other task fields; RHF Control is typed at the form root.
  control: Control<any>;
};

/**
 * Dynamic follow-up rows for task create/edit.
 * Removals are omitted from the next FormData submit so the backend sync soft-deletes them.
 */
export default function FollowUpTable({ control }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "followUpRequestPojoList",
    // Preserve backend follow-up `id` (RHF defaults keyName to "id")
    keyName: "_key",
  });

  return (
    <View className="mt-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-700">
          Follow-ups
        </Text>
        <Pressable
          onPress={() => append(emptyFollowUpRow())}
          className="flex-row items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
        >
          <AppIcon name="add" size={16} color="#453956" />
          <Text className="text-sm font-medium text-primary">Add follow-up</Text>
        </Pressable>
      </View>

      {fields.length === 0 ? (
        <View className="items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-6">
          <Text className="text-sm text-slate-400">No follow-ups yet</Text>
        </View>
      ) : (
        <View className="gap-3">
          {fields.map((field, index) => (
            <View
              key={field._key}
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-3"
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Follow-up {index + 1}
                </Text>
                <Pressable
                  onPress={() => remove(index)}
                  hitSlop={8}
                  className="rounded-md p-1"
                >
                  <AppIcon name="trash-outline" size={18} color="#A32D2D" />
                </Pressable>
              </View>

              <Controller
                control={control}
                name={`followUpRequestPojoList.${index}.followUpDate`}
                render={({ field: { value, onChange } }) => (
                  <View className="mb-2">
                    <Text className="mb-1.5 text-sm font-medium text-slate-600">
                      Date *
                    </Text>
                    <DatePickerField value={value} onChange={onChange} />
                  </View>
                )}
              />

              <Controller
                control={control}
                name={`followUpRequestPojoList.${index}.description`}
                render={({ field: { value, onChange } }) => (
                  <AppInput
                    label="Description"
                    value={value ?? ""}
                    onChangeText={onChange}
                    placeholder="Follow-up notes"
                    multiline
                    style={{ minHeight: 64, textAlignVertical: "top" }}
                  />
                )}
              />

              <View className="mt-2 flex-row gap-3">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name={`followUpRequestPojoList.${index}.followUpMethod`}
                    render={({ field: { value, onChange } }) => (
                      <SelectField
                        label="Method *"
                        value={value}
                        onChange={onChange}
                        options={FOLLOW_UP_METHOD_OPTIONS}
                        placeholder="Select method"
                      />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Controller
                    control={control}
                    name={`followUpRequestPojoList.${index}.trade`}
                    render={({ field: { value, onChange } }) => (
                      <AppInput
                        label="Trade"
                        value={value ?? ""}
                        onChangeText={onChange}
                        placeholder="Trade / company"
                      />
                    )}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
