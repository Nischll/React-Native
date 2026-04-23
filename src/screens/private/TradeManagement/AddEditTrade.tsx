import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Keyboard, Text, TouchableWithoutFeedback, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";

import PageHeader from "@/src/components/layout/PageHeader";

import {
  useCreateTradeVisit,
  useGetTradeVisits,
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

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import {
  ENTRY_TYPE_OPTIONS,
  WORK_TYPE_OPTIONS,
} from "@/src/types/tradeManagement.types";

export default function AddEditTrade() {
  const { id } = useLocalSearchParams();
  const isEdit = !!id;

  const { buildingId } = useAuth();
  const { residences } = useResidencesForActiveBuilding();

  const queryClient = useQueryClient();

  const createMutation = useCreateTradeVisit();
  const updateMutation = useUpdateTradeVisit(Number(id));

  // ---------------- FORM STATE ----------------
  const [form, setForm] = useState({
    entryType: "",
    workType: "",
    tradeName: "",
    company: "",
    workOrderNumber: "",
    phoneNumber: "",
    reasonForVisit: "",
    location: "",
    residentId: "",
    scheduledAppointmentAt: "",
  });

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ---------------- CACHE + FALLBACK DATA ----------------
  const cachedQueries = queryClient.getQueriesData({
    queryKey: ["trade-visit"],
  });

  const cachedTrades = cachedQueries
    .map(([, data]: any) => data?.data?.data ?? [])
    .flat();

  let trade = cachedTrades.find((t) => t.id === Number(id));

  const { data: fallbackData } = useGetTradeVisits(
    {
      page: 1,
      limit: 20,
      buildingId: buildingId ?? undefined,
    },
    !!buildingId && isEdit && !trade,
  );

  const fallbackTrades = fallbackData?.data?.data ?? [];

  if (!trade) {
    trade = fallbackTrades.find((t) => t.id === Number(id));
  }

  // ---------------- HYDRATE FORM ----------------
  useEffect(() => {
    if (!isEdit || !trade) return;

    setForm({
      entryType: trade.entryType ?? "",
      workType: trade.workType ?? "",
      tradeName: trade.tradeName ?? "",
      company: trade.company ?? "",
      workOrderNumber: trade.workOrderNumber ?? "",
      phoneNumber: trade.phoneNumber ?? "",
      reasonForVisit: trade.reasonForVisit ?? "",
      location: trade.location ?? "",
      residentId: trade.residentId ? String(trade.residentId) : "",
      scheduledAppointmentAt: trade.scheduledAppointmentAt ?? "",
    });
  }, [trade, isEdit]);

  // ---------------- CONDITIONS ----------------
  const showDatePicker = form.entryType === "BOOKED";
  const showResident = form.workType === "INSUITE";

  // ---------------- SUBMIT ----------------
  const handleSubmit = () => {
    const payload: any = {
      entryType: form.entryType,
      workType: form.workType,
      tradeName: form.tradeName,
      company: form.company || undefined,
      workOrderNumber: form.workOrderNumber || undefined,
      phoneNumber: form.phoneNumber || undefined,
      reasonForVisit: form.reasonForVisit || undefined,
      location: form.location || undefined,
      buildingId,
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
        title={isEdit ? "Edit Trade Visit" : "Add Trade Visit"}
        subtitle="Manage contractor visit"
        icon="construct"
        showBackButton
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 30,
          }}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* VISIT TYPE */}
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

          {/* TRADE */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Trade & Contractor</Text>

            <AppInput
              placeholder="Trade / Technician Name"
              value={form.tradeName}
              onChangeText={(v) => updateField("tradeName", v)}
            />

            <View className="mt-3">
              <AppInput
                placeholder="Company"
                value={form.company}
                onChangeText={(v) => updateField("company", v)}
              />
            </View>

            <View className="mt-3">
              <AppInput
                placeholder="Work Order (optional)"
                value={form.workOrderNumber}
                onChangeText={(v) => updateField("workOrderNumber", v)}
              />
            </View>

            {showResident && (
              <View className="mt-3">
                <SelectField
                  placeholder="Select Unit / Resident"
                  value={form.residentId}
                  options={residences}
                  onChange={(v) => updateField("residentId", v)}
                />
              </View>
            )}
          </Card>

          {/* CONTACT */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Contact</Text>

            <AppInput
              placeholder="Contact Number"
              value={form.phoneNumber}
              onChangeText={(v) => updateField("phoneNumber", v)}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </Card>

          {/* WORK DETAILS */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Work Details</Text>

            <TextAreaField
              placeholder="Reason for visit"
              value={form.reasonForVisit}
              onChangeText={(v: string) => updateField("reasonForVisit", v)}
            />

            <View className="mt-3">
              <AppInput
                placeholder="Location"
                value={form.location}
                onChangeText={(v) => updateField("location", v)}
              />
            </View>
          </Card>

          {/* SUBMIT */}
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
