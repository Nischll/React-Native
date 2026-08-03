import {
  useCheckInVisitorParkingInspection,
  useGetVisitorParkingInspectionById,
  useUpdateVisitorParkingInspection,
} from "@/src/api/visitorParking.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import SelectField from "@/src/components/ui/SelectField";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  PERIOD_OF_DAY_OPTIONS,
  PeriodOfDay,
  TOW_WORKFLOW_STATUS_OPTIONS,
  TowWorkflowStatus,
} from "@/src/types/visitorParking.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function AddEditInspection() {
  const { inspectionId } = useLocalSearchParams();
  const id = inspectionId ? Number(inspectionId) : undefined;
  const editMode = !!inspectionId;

  const { buildingId } = useAuth();

  const { data, isLoading } = useGetVisitorParkingInspectionById(id, editMode);
  const { mutate: checkInMutate, isPending: isCheckingIn } =
    useCheckInVisitorParkingInspection();
  const { mutate: updateMutate, isPending: isUpdating } =
    useUpdateVisitorParkingInspection(id);

  const [stallIdentifier, setStallIdentifier] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [passNumberDisplay, setPassNumberDisplay] = useState("");
  const [periodOfDay, setPeriodOfDay] = useState<PeriodOfDay>("DAY");
  const [towWorkflowStatus, setTowWorkflowStatus] =
    useState<TowWorkflowStatus>("NOT_APPLICABLE");
  const [bylawNoticeIssued, setBylawNoticeIssued] = useState(false);
  const [violationSlipIssued, setViolationSlipIssued] = useState(false);
  const [violationNotes, setViolationNotes] = useState("");

  const matchedUnit = data?.data?.residentUnit;
  const matchedName = data?.data?.residentName;

  useEffect(() => {
    if (editMode && data?.data) {
      const item = data.data;
      setStallIdentifier(item.stallIdentifier ?? "");
      setLicensePlate(item.licensePlate ?? "");
      setVehicleMake(item.vehicleMake ?? "");
      setVehicleModel(item.vehicleModel ?? "");
      setVehicleColor(item.vehicleColor ?? "");
      setPassNumberDisplay(item.passNumberDisplay ?? "");
      setPeriodOfDay(item.periodOfDay ?? "DAY");
      setTowWorkflowStatus(item.towWorkflowStatus ?? "NOT_APPLICABLE");
      setBylawNoticeIssued(!!item.bylawNoticeIssued);
      setViolationSlipIssued(!!item.violationSlipIssued);
      setViolationNotes(item.violationNotes ?? "");
    }
  }, [editMode, data]);

  const onSubmit = () => {
    if (!buildingId || !stallIdentifier.trim() || !licensePlate.trim()) return;

    const payload = {
      buildingId,
      stallIdentifier: stallIdentifier.trim(),
      licensePlate: licensePlate.trim().toUpperCase(),
      vehicleMake: vehicleMake.trim() || undefined,
      vehicleModel: vehicleModel.trim() || undefined,
      vehicleColor: vehicleColor.trim() || undefined,
      passNumberDisplay: passNumberDisplay.trim() || undefined,
      periodOfDay,
      towWorkflowStatus,
      bylawNoticeIssued,
      violationSlipIssued,
      violationNotes: violationNotes.trim() || undefined,
    };

    if (editMode) {
      updateMutate(payload, { onSuccess: () => router.back() });
    } else {
      checkInMutate(payload, { onSuccess: () => router.back() });
    }
  };

  if (editMode && isLoading) {
    return <LoadingState message="Inspection details loading." />;
  }

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon={editMode ? "create" : "add-circle"}
        title={editMode ? "Edit Inspection" : "Check In Vehicle"}
        subtitle={
          editMode
            ? "Update this visitor parking inspection"
            : "Log a new visitor vehicle in a stall"
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
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AppInput
                label="Stall Identifier"
                value={stallIdentifier}
                onChangeText={setStallIdentifier}
                placeholder="e.g. V-12"
              />
            </View>
            <View className="flex-1">
              <AppInput
                label="License Plate"
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholder="e.g. ABC 123"
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <AppInput
                label="Vehicle Make"
                value={vehicleMake}
                onChangeText={setVehicleMake}
                placeholder="e.g. Honda"
              />
            </View>
            <View className="flex-1">
              <AppInput
                label="Vehicle Model"
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="e.g. Civic"
              />
            </View>
          </View>

          <View className="mt-3">
            <AppInput
              label="Vehicle Color"
              value={vehicleColor}
              onChangeText={setVehicleColor}
              placeholder="e.g. Black"
            />
          </View>

          <View className="mt-3">
            <AppInput
              label="Pass Number (if displayed)"
              value={passNumberDisplay}
              onChangeText={setPassNumberDisplay}
              placeholder="Visitor pass number"
            />
            <Text className="text-[11px] text-textSecondary mt-1.5 leading-4">
              Unit is linked automatically when this pass number matches an
              active visitor pass for the building.
            </Text>
          </View>

          {editMode && (matchedUnit || matchedName) ? (
            <View className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary mb-1">
                Matched unit (from pass)
              </Text>
              <Text className="text-sm font-medium text-textPrimary">
                {[matchedUnit ? `Unit ${matchedUnit}` : null, matchedName]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </Text>
            </View>
          ) : null}

          <View className="mt-3">
            <SelectField
              label="Period of Day"
              value={periodOfDay}
              onChange={(v) => setPeriodOfDay(v as PeriodOfDay)}
              options={PERIOD_OF_DAY_OPTIONS}
              mode="dropdown"
            />
          </View>

          <View className="mt-3">
            <SelectField
              label="Tow Workflow Status"
              value={towWorkflowStatus}
              onChange={(v) => setTowWorkflowStatus(v as TowWorkflowStatus)}
              options={TOW_WORKFLOW_STATUS_OPTIONS}
              mode="dropdown"
            />
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-base font-medium text-slate-700">
              Bylaw Notice Issued
            </Text>
            <Switch
              value={bylawNoticeIssued}
              onValueChange={setBylawNoticeIssued}
            />
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-base font-medium text-slate-700">
              Violation Slip Issued
            </Text>
            <Switch
              value={violationSlipIssued}
              onValueChange={setViolationSlipIssued}
            />
          </View>

          <View className="mt-3">
            <TextAreaField
              label="Violation Notes"
              value={violationNotes}
              onChangeText={setViolationNotes}
              placeholder="No pass, over limit, over hours, tow notes, etc."
            />
          </View>

          <View className="mt-6">
            <AppButton
              loading={editMode ? isUpdating : isCheckingIn}
              onPress={onSubmit}
            >
              {editMode ? "Update Inspection" : "Check In"}
            </AppButton>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
