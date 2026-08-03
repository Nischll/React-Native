import {
  useAddPreventiveMaintenance,
  useGetPreventiveMaintenanceById,
  useUpdatePreventiveMaintenance,
} from "@/src/api/preventativeMaintenance.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  MONTH_CODES,
  MONTH_LABELS,
  PREVENTIVE_MAINTENANCE_STATUS_OPTIONS,
  parseScheduledMonths,
  PreventiveMaintenanceStatus,
  serializeScheduledMonths,
  StatusPerMonth,
  STATUS_COLORS,
} from "@/src/types/preventativeMaintenance.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function AddEditPM() {
  const { pmId, year: yearParam } = useLocalSearchParams<{
    pmId?: string;
    year?: string;
  }>();
  const id = pmId ? Number(pmId) : undefined;
  const editMode = !!id && !Number.isNaN(id);

  const { buildingId } = useAuth();

  const initialYear = (() => {
    const n = yearParam ? Number(yearParam) : NaN;
    return !Number.isNaN(n) && n >= 2025 && n <= 2035
      ? n
      : new Date().getFullYear();
  })();

  const [maintenanceItem, setMaintenanceItem] = useState("");
  const [frequency, setFrequency] = useState("");
  const [estCost, setEstCost] = useState("");
  const [trade, setTrade] = useState("");
  const [notes, setNotes] = useState("");
  const [year, setYear] = useState<number>(initialYear);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(
    new Set(),
  );
  const [statusPerMonth, setStatusPerMonth] = useState<StatusPerMonth>({});
  const [hydrated, setHydrated] = useState(!editMode);
  const [statusPickerMonth, setStatusPickerMonth] = useState<string | null>(
    null,
  );

  const { data, isLoading, isError } = useGetPreventiveMaintenanceById(
    id,
    editMode,
  );
  const editingItem = data?.data;

  const { mutate: addMutate, isPending: isAdding } =
    useAddPreventiveMaintenance(buildingId ?? undefined);
  const { mutate: updateMutate, isPending: isUpdating } =
    useUpdatePreventiveMaintenance(id, buildingId ?? undefined);

  useEffect(() => {
    if (!editMode || !editingItem) return;
    setMaintenanceItem(editingItem.maintenanceItem ?? "");
    setFrequency(editingItem.frequency ?? "");
    setEstCost(editingItem.estCost ?? "");
    setTrade(editingItem.trade ?? editingItem.tradeInvolved ?? "");
    setNotes(editingItem.notes ?? "");
    if (editingItem.year != null) setYear(editingItem.year);
    setSelectedMonths(parseScheduledMonths(editingItem.scheduledMonths));
    setStatusPerMonth(editingItem.statusPerMonth ?? {});
    setHydrated(true);
  }, [editMode, editingItem]);

  const addMonth = (monthCode: string) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      next.add(monthCode);
      return next;
    });
    setStatusPerMonth((spm) => ({ ...spm, [monthCode]: "SCHEDULED" }));
  };

  const removeMonth = (monthCode: string) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      next.delete(monthCode);
      return next;
    });
    setStatusPerMonth((spm) => {
      const copy = { ...spm };
      delete copy[monthCode];
      return copy;
    });
    setStatusPickerMonth(null);
  };

  const setMonthStatus = (
    monthCode: string,
    status: PreventiveMaintenanceStatus,
  ) => {
    setStatusPerMonth((spm) => ({ ...spm, [monthCode]: status }));
    setStatusPickerMonth(null);
  };

  const onSubmit = () => {
    if (!buildingId || !maintenanceItem.trim()) return;

    const firstStatus =
      selectedMonths.size > 0
        ? (statusPerMonth[Array.from(selectedMonths)[0]] ?? "SCHEDULED")
        : "SCHEDULED";

    const payload = {
      maintenanceItem: maintenanceItem.trim(),
      frequency: frequency.trim() || undefined,
      estCost: estCost.trim() || undefined,
      trade: trade.trim() || undefined,
      tradeInvolved: trade.trim() || undefined,
      status: firstStatus,
      statusPerMonth:
        Object.keys(statusPerMonth).length > 0 ? statusPerMonth : undefined,
      scheduledMonths: serializeScheduledMonths(selectedMonths),
      year,
      notes: notes.trim() || undefined,
      buildingId,
    };

    if (editMode && id) {
      updateMutate(
        { ...payload, pathVars: { id, buildingId } } as any,
        { onSuccess: () => router.back() },
      );
    } else {
      addMutate(payload, { onSuccess: () => router.back() });
    }
  };

  if (editMode && isLoading) {
    return <LoadingState message="Maintenance item loading." />;
  }

  if (editMode && (isError || (!isLoading && !editingItem))) {
    return <EmptyState message="Maintenance item not found." />;
  }

  if (editMode && !hydrated) {
    return <LoadingState message="Maintenance item loading." />;
  }

  const pickerStatus =
    statusPickerMonth != null
      ? (statusPerMonth[statusPickerMonth] ?? "SCHEDULED")
      : null;

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon={editMode ? "create" : "add-circle"}
        title={editMode ? "Edit Maintenance Item" : "Add Maintenance Item"}
        subtitle={
          editMode
            ? "Update maintenance schedule"
            : "Create a preventative maintenance item"
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
          <AppInput
            label="Maintenance Item"
            value={maintenanceItem}
            onChangeText={setMaintenanceItem}
            placeholder="e.g. Building Envelope"
          />

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <AppInput
                label="Frequency"
                value={frequency}
                onChangeText={setFrequency}
                placeholder="e.g. 1x a year"
              />
            </View>
            <View className="flex-1">
              <AppInput
                label="Year"
                value={String(year)}
                onChangeText={(v) => setYear(Number(v) || year)}
                placeholder="Year"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View className="mt-3">
            <Text className="mb-2 text-base font-semibold text-slate-700">
              Scheduled Months
            </Text>
            <Text className="mb-2 text-xs text-gray-500">
              Tap a month to add it. Tap a selected month to change its status.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {MONTH_LABELS.map((label, idx) => {
                const code = MONTH_CODES[idx];
                const checked = selectedMonths.has(code);
                const status = statusPerMonth[code] ?? "SCHEDULED";
                const style = STATUS_COLORS[status];
                if (checked) {
                  return (
                    <Pressable
                      key={code}
                      onPress={() => setStatusPickerMonth(code)}
                      className={`w-14 h-10 rounded-lg items-center justify-center ${style.bg}`}
                    >
                      <Text className="text-xs font-semibold text-white">
                        {style.letter} · {label}
                      </Text>
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    key={code}
                    onPress={() => addMonth(code)}
                    className="w-14 h-10 rounded-lg items-center justify-center bg-gray-100 border border-dashed border-gray-300"
                  >
                    <Text className="text-xs font-semibold text-gray-500">
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="flex-row flex-wrap gap-3 mt-3">
              {PREVENTIVE_MAINTENANCE_STATUS_OPTIONS.map((s) => (
                <View key={s.value} className="flex-row items-center gap-1">
                  <View
                    className={`w-4 h-4 rounded ${STATUS_COLORS[s.value].bg}`}
                  />
                  <Text className="text-[11px] text-gray-500">{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-3">
            <AppInput
              label="Est. Cost"
              value={estCost}
              onChangeText={setEstCost}
              placeholder="e.g. $500"
            />
          </View>

          <View className="mt-3">
            <AppInput
              label="Trade / Staff"
              value={trade}
              onChangeText={setTrade}
              placeholder="e.g. AML, Pacific Heights"
            />
          </View>

          <View className="mt-3">
            <TextAreaField
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="General notes for this maintenance item"
            />
          </View>

          <View className="mt-6">
            <AppButton
              loading={editMode ? isUpdating : isAdding}
              onPress={onSubmit}
            >
              {editMode ? "Update Maintenance" : "Add Maintenance"}
            </AppButton>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>

      <Modal
        transparent
        visible={!!statusPickerMonth}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setStatusPickerMonth(null)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setStatusPickerMonth(null)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-3xl bg-white px-5 pt-4 pb-8"
          >
            <Text className="text-lg font-bold text-textPrimary mb-1">
              Month status
            </Text>
            <Text className="text-sm text-textSecondary mb-4">
              {statusPickerMonth
                ? MONTH_LABELS[MONTH_CODES.indexOf(statusPickerMonth)]
                : ""}
            </Text>
            {PREVENTIVE_MAINTENANCE_STATUS_OPTIONS.map((opt) => {
              const style = STATUS_COLORS[opt.value];
              const active = pickerStatus === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() =>
                    statusPickerMonth &&
                    setMonthStatus(statusPickerMonth, opt.value)
                  }
                  className={`flex-row items-center gap-3 py-3 border-b border-slate-100 ${
                    active ? "opacity-100" : ""
                  }`}
                >
                  <View
                    className={`w-6 h-6 rounded-md items-center justify-center ${style.bg}`}
                  >
                    <Text className="text-[10px] font-bold text-white">
                      {style.letter}
                    </Text>
                  </View>
                  <Text className="text-base font-semibold text-textPrimary flex-1">
                    {opt.label}
                  </Text>
                  {active ? (
                    <Text className="text-xs font-semibold text-primary">
                      Selected
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() =>
                statusPickerMonth && removeMonth(statusPickerMonth)
              }
              className="py-3.5"
            >
              <Text className="text-base font-semibold text-red-600">
                Remove status
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
