import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Text, TouchableWithoutFeedback, View } from "react-native";

import PageHeader from "@/src/components/layout/PageHeader";

import { useGetTaskById } from "@/src/api/taskManagement.api";
import { useGetTrades } from "@/src/api/tradeDirectory.api";
import {
  useCreateTradeVisit,
  useGetTradeVisitById,
  useUpdateTradeVisit,
} from "@/src/api/tradeManagement.api";

import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import DatePickerField from "@/src/components/ui/DatePickerField";
import SelectField from "@/src/components/ui/SelectField";
import TextAreaField from "@/src/components/ui/TextAreaFeld";

import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useAuth } from "@/src/providers/AuthProvider";
import { TradeDirectoryResponse } from "@/src/types/tradeDirectory.types";
import { extractPaginatedList } from "@/src/utils/listPagination";
import { showToast } from "@/src/utils/toast";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import {
  ENTRY_TYPE_OPTIONS,
  TradeVisitCreatePojo,
  WORK_TYPE_OPTIONS,
} from "@/src/types/tradeManagement.types";

function firstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function AddEditTrade() {
  const {
    id,
    fromTaskId,
    reasonForVisit: reasonParam,
    location: locationParam,
  } = useLocalSearchParams<{
    id?: string;
    fromTaskId?: string | string[];
    reasonForVisit?: string | string[];
    location?: string | string[];
  }>();
  const isEdit = !!id;
  const idNum = Number(id);
  const fromTaskIdNum = Number(firstParam(fromTaskId));
  const isFromTask = !isEdit && Number.isFinite(fromTaskIdNum) && fromTaskIdNum > 0;

  const { buildingId } = useAuth();
  const { residences } = useResidencesForActiveBuilding();

  const createMutation = useCreateTradeVisit();
  const updateMutation = useUpdateTradeVisit(idNum);

  const { data: tradesData } = useGetTrades(
    { page: 1, limit: 1000 },
    true,
  );
  const { items: trades } = extractPaginatedList<TradeDirectoryResponse>(
    tradesData,
  );

  const tradeOptions = useMemo(
    () =>
      trades.map((t) => ({
        value: String(t.id),
        label: `${t.name}${t.company ? ` · ${t.company}` : ""}`,
      })),
    [trades],
  );

  const [form, setForm] = useState({
    entryType: "",
    workType: "",
    tradeId: "",
    tradeName: "",
    company: "",
    phoneNumber: "",
    reasonForVisit: firstParam(reasonParam),
    location: firstParam(locationParam),
    residentId: "",
    scheduledAppointmentAt: "",
  });
  const taskPrefillApplied = useRef(false);

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyTrade = (idValue: string) => {
    const selected = trades.find((t) => String(t.id) === idValue);
    setForm((prev) => ({
      ...prev,
      tradeId: idValue,
      tradeName: selected?.name ?? "",
      company: selected?.company ?? "",
      phoneNumber: selected?.contact ?? "",
    }));
  };

  const { data: tradeData } = useGetTradeVisitById(
    isEdit ? idNum : undefined,
    isEdit,
  );
  const trade = tradeData?.data;

  const { data: taskPrefillData } = useGetTaskById(
    isFromTask ? fromTaskIdNum : undefined,
    isFromTask,
  );
  const fromTask = taskPrefillData?.data?.data?.[0];

  useEffect(() => {
    if (!isFromTask || taskPrefillApplied.current || !fromTask) return;
    setForm((prev) => ({
      ...prev,
      reasonForVisit: prev.reasonForVisit || fromTask.description || "",
      location: prev.location || fromTask.location || "",
    }));
    taskPrefillApplied.current = true;
  }, [isFromTask, fromTask]);

  useEffect(() => {
    if (!isEdit || !trade) return;

    setForm((prev) => ({
      ...prev,
      entryType: trade.entryType ?? "",
      workType: trade.workType ?? "",
      tradeName: trade.tradeName ?? "",
      company: trade.company ?? "",
      phoneNumber: trade.phoneNumber ?? "",
      reasonForVisit: trade.reasonForVisit ?? "",
      location: trade.location ?? "",
      residentId: trade.residentId ? String(trade.residentId) : "",
      scheduledAppointmentAt: trade.scheduledAppointmentAt ?? "",
    }));
  }, [trade, isEdit]);

  useEffect(() => {
    if (!isEdit || !trade || trades.length === 0) return;
    const match =
      trades.find(
        (t) =>
          t.name === trade.tradeName &&
          (t.company ?? "") === (trade.company ?? "") &&
          (t.contact ?? "") === (trade.phoneNumber ?? ""),
      ) ?? trades.find((t) => t.name === trade.tradeName);
    if (match) {
      setForm((prev) =>
        prev.tradeId === String(match.id)
          ? prev
          : { ...prev, tradeId: String(match.id) },
      );
    }
  }, [isEdit, trade, trades]);

  const showDatePicker = form.entryType === "BOOKED";
  const showResident = form.workType === "INSUITE";

  const handleSubmit = () => {
    if (!form.tradeName.trim()) {
      showToast("error", "Please select a trade");
      return;
    }

    const payload: TradeVisitCreatePojo = {
      entryType: form.entryType as TradeVisitCreatePojo["entryType"],
      workType: form.workType as TradeVisitCreatePojo["workType"],
      tradeName: form.tradeName.trim(),
      company: form.company.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
      reasonForVisit: form.reasonForVisit || undefined,
      location: form.location || undefined,
      buildingId: buildingId!,
      residentId: showResident
        ? form.residentId
          ? Number(form.residentId)
          : null
        : null,
      scheduledAppointmentAt: showDatePicker
        ? form.scheduledAppointmentAt
        : null,
    };

    if (isEdit) {
      updateMutation.mutate(payload, {
        onSuccess: () => router.back(),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => router.back(),
      });
    }
  };

  return (
    <View className="flex-1">
      <PageHeader
        title={
          isEdit
            ? "Edit Trade Visit"
            : isFromTask
              ? "Register Trade Visit"
              : "Add Trade Visit"
        }
        subtitle="Manage contractor visit"
        icon="construct"
        showBackButton
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Visit Type & Schedule</Text>

            <SelectField
              placeholder="Entry Type"
              value={form.entryType}
              options={ENTRY_TYPE_OPTIONS}
              onChange={(v) => updateField("entryType", v)}
              mode="dropdown"
            />

            <View className="mt-3">
              <SelectField
                placeholder="Work Type"
                value={form.workType}
                options={WORK_TYPE_OPTIONS}
                onChange={(v) => updateField("workType", v)}
                mode="dropdown"
              />
            </View>

            {showDatePicker && (
              <View className="mt-3">
                <DatePickerField
                  value={form.scheduledAppointmentAt}
                  onChange={(v) => updateField("scheduledAppointmentAt", v)}
                  showTime
                  placeholder="Select Appointment Date & Time"
                />
              </View>
            )}
          </Card>

          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Trade & Contractor</Text>

            <SelectField
              label="Trade"
              placeholder="Select trade"
              value={form.tradeId}
              options={tradeOptions}
              onChange={applyTrade}
            />

            <View className="mt-3">
              <AppInput
                label="Trade / technician name"
                placeholder="Select a trade"
                value={form.tradeName}
                editable={false}
              />
            </View>

            <View className="mt-3">
              <AppInput
                label="Company"
                placeholder="—"
                value={form.company}
                editable={false}
              />
            </View>

            <View className="mt-3">
              <AppInput
                label="Contact number"
                placeholder="—"
                value={form.phoneNumber}
                editable={false}
              />
            </View>

            {showResident && (
              <View className="mt-3">
                <SelectField
                  label="Unit"
                  placeholder="Select unit"
                  value={form.residentId}
                  options={residences}
                  onChange={(v) => updateField("residentId", v)}
                />
              </View>
            )}
          </Card>

          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Work Details</Text>

            <TextAreaField
              label="Reason for visit"
              placeholder="Brief description of work"
              value={form.reasonForVisit}
              onChangeText={(v: string) => updateField("reasonForVisit", v)}
            />

            <View className="mt-3">
              <AppInput
                label="On-site location"
                placeholder="e.g. Loading dock, lobby"
                value={form.location}
                onChangeText={(v) => updateField("location", v)}
              />
            </View>
          </Card>

          <View className="mb-6">
            <AppButton
              onPress={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEdit ? "Update Trade Visit" : "Create Trade Visit"}
            </AppButton>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
