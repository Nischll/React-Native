import {
  useAddPreventiveMaintenance,
  useGetPreventiveMaintenance,
  useUpdatePreventiveMaintenance,
} from "@/src/api/preventativeMaintenance.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  MONTH_CODES,
  MONTH_LABELS,
  parseScheduledMonths,
  PreventiveMaintenanceStatus,
  serializeScheduledMonths,
  StatusPerMonth,
  STATUS_COLORS,
} from "@/src/types/preventativeMaintenance.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const STATUS_CYCLE: PreventiveMaintenanceStatus[] = [
  "SCHEDULED",
  "REQUESTED",
  "COMPLETED",
  "CANCELLED",
];

export default function AddEditPM() {
  const { pmId } = useLocalSearchParams();
  const id = pmId ? Number(pmId) : undefined;
  const editMode = !!pmId;

  const { buildingId } = useAuth();

  const [maintenanceItem, setMaintenanceItem] = useState("");
  const [frequency, setFrequency] = useState("");
  const [estCost, setEstCost] = useState("");
  const [trade, setTrade] = useState("");
  const [notes, setNotes] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(
    new Set(),
  );
  const [statusPerMonth, setStatusPerMonth] = useState<StatusPerMonth>({});

  const { data, isLoading } = useGetPreventiveMaintenance(
    buildingId ?? undefined,
    year,
    editMode,
  );

  const editingItem = useMemo(
    () => data?.data?.find((item) => item.id === id),
    [data, id],
  );

  const { mutate: addMutate, isPending: isAdding } =
    useAddPreventiveMaintenance(buildingId ?? undefined);
  const { mutate: updateMutate, isPending: isUpdating } =
    useUpdatePreventiveMaintenance(id, buildingId ?? undefined);

  useEffect(() => {
    if (editMode && editingItem) {
      setMaintenanceItem(editingItem.maintenanceItem ?? "");
      setFrequency(editingItem.frequency ?? "");
      setEstCost(editingItem.estCost ?? "");
      setTrade(editingItem.trade ?? editingItem.tradeInvolved ?? "");
      setNotes(editingItem.notes ?? "");
      setYear(editingItem.year ?? year);
      const months = parseScheduledMonths(editingItem.scheduledMonths);
      setSelectedMonths(months);
      setStatusPerMonth(editingItem.statusPerMonth ?? {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, editingItem]);

  const toggleMonth = (monthCode: string) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthCode)) {
        const currentStatus = statusPerMonth[monthCode] ?? "SCHEDULED";
        const idx = STATUS_CYCLE.indexOf(currentStatus);
        if (idx === STATUS_CYCLE.length - 1) {
          next.delete(monthCode);
          setStatusPerMonth((spm) => {
            const copy = { ...spm };
            delete copy[monthCode];
            return copy;
          });
        } else {
          setStatusPerMonth((spm) => ({
            ...spm,
            [monthCode]: STATUS_CYCLE[idx + 1],
          }));
        }
      } else {
        next.add(monthCode);
        setStatusPerMonth((spm) => ({ ...spm, [monthCode]: "SCHEDULED" }));
      }
      return next;
    });
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

    if (editMode) {
      updateMutate(payload, { onSuccess: () => router.back() });
    } else {
      addMutate(payload, { onSuccess: () => router.back() });
    }
  };

  if (editMode && isLoading) {
    return <LoadingState message="Maintenance item loading." />;
  }

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
              Tap a month to add it, tap again to cycle its status.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {MONTH_LABELS.map((label, idx) => {
                const code = MONTH_CODES[idx];
                const checked = selectedMonths.has(code);
                const status = statusPerMonth[code] ?? "SCHEDULED";
                const style = STATUS_COLORS[status];
                return (
                  <Pressable
                    key={code}
                    onPress={() => toggleMonth(code)}
                    className={`w-14 h-10 rounded-lg items-center justify-center ${
                      checked ? style.bg : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        checked ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="flex-row flex-wrap gap-3 mt-3">
              {STATUS_CYCLE.map((s) => (
                <View key={s} className="flex-row items-center gap-1">
                  <View
                    className={`w-4 h-4 rounded ${STATUS_COLORS[s].bg}`}
                  />
                  <Text className="text-[11px] text-gray-500">
                    {STATUS_COLORS[s].label}
                  </Text>
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
    </View>
  );
}
