import {
  useAddGeneratorTest,
  useGetGeneratorTestById,
  useUpdateGeneratorTest,
} from "@/src/api/generatorTests.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import DatePickerField from "@/src/components/ui/DatePickerField";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import { formatDateOnly } from "@/src/helper/formatDateTime";
import { useAuth } from "@/src/providers/AuthProvider";
import { GENERATOR_CHECK_FIELDS } from "@/src/types/generatorTests.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

function toTestDatePayload(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) {
    const datePart = isoOrDate.split("T")[0];
    return `${datePart}T00:00:00`;
  }
  return `${formatDateOnly(d)}T00:00:00`;
}

export default function AddEditGeneratorTest() {
  const { testId } = useLocalSearchParams();
  const id = testId ? Number(testId) : undefined;
  const editMode = !!testId;

  const { buildingId, user } = useAuth();

  const { data, isLoading } = useGetGeneratorTestById(id, editMode);
  const { mutate: addMutate, isPending: isAdding } = useAddGeneratorTest(
    buildingId ?? undefined,
  );
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateGeneratorTest(
    id,
    buildingId ?? undefined,
  );

  const [testDate, setTestDate] = useState(new Date().toISOString());
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [fuelLevel, setFuelLevel] = useState("");
  const [batteryFluidLevel, setBatteryFluidLevel] = useState("");
  const [hourMeterReading, setHourMeterReading] = useState("");
  const [oilPressure, setOilPressure] = useState("");
  const [coolantTemperature, setCoolantTemperature] = useState("");
  const [voltage, setVoltage] = useState("");
  const [amps, setAmps] = useState("");
  const [frequency, setFrequency] = useState("");
  const [damperOperation, setDamperOperation] = useState("");
  const [hourMeterReadingAfterTest, setHourMeterReadingAfterTest] = useState("");
  const [duration, setDuration] = useState("");
  const [miscellaneous, setMiscellaneous] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<PickedFile[]>([]);

  useEffect(() => {
    if (editMode && data?.data) {
      const t = data.data;
      setTestDate(t.testDate ?? new Date().toISOString());
      setChecks({
        visualInspection: !!t.visualInspection,
        oilLevelChecked: !!t.oilLevelChecked,
        coolantLevelChecked: !!t.coolantLevelChecked,
        batteryChargerOperation: !!t.batteryChargerOperation,
        coolantLeakCheck: !!t.coolantLeakCheck,
        fuelLeakCheck: !!t.fuelLeakCheck,
        oilLeakCheck: !!t.oilLeakCheck,
        coolantBlockHeater: !!t.coolantBlockHeater,
        transferSwitchTest: !!t.transferSwitchTest,
      });
      setFuelLevel(t.fuelLevel ?? "");
      setBatteryFluidLevel(t.batteryFluidLevel ?? "");
      setHourMeterReading(t.hourMeterReading ?? "");
      setOilPressure(t.oilPressure ?? "");
      setCoolantTemperature(t.coolantTemperature ?? "");
      setVoltage(t.voltage ?? "");
      setAmps(t.amps ?? "");
      setFrequency(t.frequency ?? "");
      setDamperOperation(t.damperOperation ?? "");
      setHourMeterReadingAfterTest(t.hourMeterReadingAfterTest ?? "");
      setDuration(t.duration ?? "");
      setMiscellaneous(t.miscellaneous ?? "");
      setComment(t.comment ?? "");
    }
  }, [editMode, data]);

  const buildFormData = () => {
    const form = new FormData();
    form.append("testDate", toTestDatePayload(testDate));
    if (buildingId != null) form.append("buildingId", String(buildingId));
    if (user?.userId != null) {
      form.append("testedByUserId", String(user.userId));
    }

    GENERATOR_CHECK_FIELDS.forEach((field) => {
      if (checks[field.key] === true) form.append(field.key, "true");
      else if (checks[field.key] === false) form.append(field.key, "false");
    });

    const strings: Record<string, string> = {
      fuelLevel,
      batteryFluidLevel,
      hourMeterReading,
      oilPressure,
      coolantTemperature,
      voltage,
      amps,
      frequency,
      damperOperation,
      miscellaneous,
      hourMeterReadingAfterTest,
      duration,
      comment,
    };
    Object.entries(strings).forEach(([k, v]) => {
      if (v.trim()) form.append(k, v.trim());
    });

    images.forEach((f) => {
      form.append("relatedImages", {
        uri:
          Platform.OS === "android"
            ? f.uri
            : f.uri.replace("file://", ""),
        name: f.name,
        type: f.mimeType,
      } as any);
    });

    return form;
  };

  const onSubmit = () => {
    if (!buildingId || !testDate) return;
    const form = buildFormData();
    const opts = { onSuccess: () => router.back() };
    if (editMode) {
      updateMutate(form, opts);
    } else {
      addMutate(form, opts);
    }
  };

  if (editMode && isLoading) {
    return <LoadingState message="Generator test loading." />;
  }

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon={editMode ? "create" : "add-circle"}
        title={editMode ? "Edit Generator Test" : "Add Generator Test"}
        subtitle={
          editMode
            ? "Update this generator test record"
            : "Log a new generator load-bank test"
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
          <Text className="mb-2 text-base font-semibold text-slate-700">
            Test Date
          </Text>
          <DatePickerField value={testDate} onChange={setTestDate} showTime />

          <View className="mt-5 pt-4 border-t border-slate-200">
            <Text className="text-base font-semibold text-slate-700 mb-2">
              Inspection Checks
            </Text>
            {GENERATOR_CHECK_FIELDS.map((field) => (
              <View
                key={field.key}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-sm text-slate-600">{field.label}</Text>
                <Switch
                  value={!!checks[field.key]}
                  onValueChange={(v) =>
                    setChecks((prev) => ({ ...prev, [field.key]: v }))
                  }
                />
              </View>
            ))}
          </View>

          <View className="mt-5 pt-4 border-t border-slate-200">
            <Text className="text-base font-semibold text-slate-700 mb-3">
              Readings
            </Text>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <AppInput
                  label="Fuel Level"
                  value={fuelLevel}
                  onChangeText={setFuelLevel}
                  placeholder="e.g. 90%"
                />
              </View>
              <View className="flex-1">
                <AppInput
                  label="Battery Fluid Level"
                  value={batteryFluidLevel}
                  onChangeText={setBatteryFluidLevel}
                  placeholder="e.g. Full"
                />
              </View>
            </View>

            <View className="flex-row gap-3 mt-3">
              <View className="flex-1">
                <AppInput
                  label="Hour Meter (Before)"
                  value={hourMeterReading}
                  onChangeText={setHourMeterReading}
                  placeholder="e.g. 1024.5"
                />
              </View>
              <View className="flex-1">
                <AppInput
                  label="Hour Meter (After)"
                  value={hourMeterReadingAfterTest}
                  onChangeText={setHourMeterReadingAfterTest}
                  placeholder="e.g. 1025.0"
                />
              </View>
            </View>

            <View className="flex-row gap-3 mt-3">
              <View className="flex-1">
                <AppInput
                  label="Oil Pressure"
                  value={oilPressure}
                  onChangeText={setOilPressure}
                  placeholder="e.g. 45 psi"
                />
              </View>
              <View className="flex-1">
                <AppInput
                  label="Coolant Temperature"
                  value={coolantTemperature}
                  onChangeText={setCoolantTemperature}
                  placeholder="e.g. 180°F"
                />
              </View>
            </View>

            <View className="flex-row gap-3 mt-3">
              <View className="flex-1">
                <AppInput
                  label="Voltage"
                  value={voltage}
                  onChangeText={setVoltage}
                  placeholder="e.g. 480V"
                />
              </View>
              <View className="flex-1">
                <AppInput
                  label="Amps"
                  value={amps}
                  onChangeText={setAmps}
                  placeholder="e.g. 120A"
                />
              </View>
            </View>

            <View className="flex-row gap-3 mt-3">
              <View className="flex-1">
                <AppInput
                  label="Frequency"
                  value={frequency}
                  onChangeText={setFrequency}
                  placeholder="e.g. 60Hz"
                />
              </View>
              <View className="flex-1">
                <AppInput
                  label="Duration"
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="e.g. 30 min"
                />
              </View>
            </View>

            <View className="mt-3">
              <AppInput
                label="Damper Operation"
                value={damperOperation}
                onChangeText={setDamperOperation}
                placeholder="Notes on damper operation"
              />
            </View>
          </View>

          <View className="mt-5 pt-4 border-t border-slate-200">
            <TextAreaField
              label="Miscellaneous"
              value={miscellaneous}
              onChangeText={setMiscellaneous}
              placeholder="Any other observations"
            />
            <View className="mt-3">
              <TextAreaField
                label="Comment"
                value={comment}
                onChangeText={setComment}
                placeholder="Additional comments"
              />
            </View>
            <View className="mt-3">
              <FilePicker
                label="Related images"
                accept="images"
                multiple
                values={images}
                onChangeMultiple={setImages}
                hint="Optional photos from the test"
              />
            </View>
          </View>

          <View className="mt-6">
            <AppButton
              loading={editMode ? isUpdating : isAdding}
              onPress={onSubmit}
            >
              {editMode ? "Update Test" : "Save Test"}
            </AppButton>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
