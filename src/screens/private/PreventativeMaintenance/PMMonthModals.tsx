import AppButton from "@/src/components/ui/AppButton";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import {
  MONTH_CODES,
  MONTH_LABELS,
  PREVENTIVE_MAINTENANCE_STATUS_OPTIONS,
  PreventiveMaintenanceResponse,
  PreventiveMaintenanceStatus,
  STATUS_COLORS,
} from "@/src/types/preventativeMaintenance.types";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

function monthLabel(code?: string) {
  if (!code) return "";
  const idx = MONTH_CODES.indexOf(code);
  return idx >= 0 ? MONTH_LABELS[idx] : code;
}

type MonthActionSheetProps = {
  visible: boolean;
  item: PreventiveMaintenanceResponse | null;
  monthCode: string | null;
  isScheduled: boolean;
  onClose: () => void;
  onSelectStatus: (status: PreventiveMaintenanceStatus) => void;
  onRemoveStatus: () => void;
  onEditNote: () => void;
  onEditDetails: () => void;
};

/** Bottom sheet mirroring web month-cell dropdown. */
export function PMMonthActionSheet({
  visible,
  item,
  monthCode,
  isScheduled,
  onClose,
  onSelectStatus,
  onRemoveStatus,
  onEditNote,
  onEditDetails,
}: MonthActionSheetProps) {
  const label = monthLabel(monthCode ?? undefined);
  const hasNote = !!(item && monthCode && item.notesPerMonth?.[monthCode]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl bg-white px-5 pt-4 pb-8"
        >
          <Text className="text-lg font-bold text-textPrimary mb-1">
            {item?.maintenanceItem ?? "Maintenance"}
          </Text>
          <Text className="text-sm text-textSecondary mb-4">
            {label}
            {isScheduled ? " · scheduled" : " · not scheduled"}
          </Text>

          {PREVENTIVE_MAINTENANCE_STATUS_OPTIONS.map((opt) => {
            const style = STATUS_COLORS[opt.value];
            return (
              <Pressable
                key={opt.value}
                onPress={() => onSelectStatus(opt.value)}
                className="flex-row items-center gap-3 py-3 border-b border-slate-100"
              >
                <View
                  className={`w-6 h-6 rounded-md items-center justify-center ${style.bg}`}
                >
                  <Text className="text-[10px] font-bold text-white">
                    {style.letter}
                  </Text>
                </View>
                <Text className="text-base font-semibold text-textPrimary">
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}

          {isScheduled && (
            <Pressable
              onPress={onRemoveStatus}
              className="py-3 border-b border-slate-100"
            >
              <Text className="text-base font-semibold text-red-600">
                Remove status
              </Text>
            </Pressable>
          )}

          {isScheduled && (
            <Pressable
              onPress={onEditNote}
              className="py-3 border-b border-slate-100"
            >
              <Text className="text-base font-semibold text-textPrimary">
                {hasNote ? "Edit note" : "Add note"}
              </Text>
            </Pressable>
          )}

          <Pressable onPress={onEditDetails} className="py-3">
            <Text className="text-base font-semibold text-textPrimary">
              Edit full details
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type StatusChangeModalProps = {
  visible: boolean;
  item: PreventiveMaintenanceResponse | null;
  monthCode: string | null;
  newStatus: PreventiveMaintenanceStatus | null;
  loading?: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
};

export function PMStatusChangeModal({
  visible,
  item,
  monthCode,
  newStatus,
  loading,
  onClose,
  onSave,
}: StatusChangeModalProps) {
  const [note, setNote] = useState("");
  const label = monthLabel(monthCode ?? undefined);
  const statusStyle = newStatus
    ? STATUS_COLORS[newStatus]
    : STATUS_COLORS.SCHEDULED;

  useEffect(() => {
    if (visible && item && monthCode) {
      setNote(item.notesPerMonth?.[monthCode] ?? "");
    }
  }, [visible, item, monthCode]);

  if (!item || !monthCode || !newStatus) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl bg-white px-5 pt-4 pb-8"
        >
          <Text className="text-lg font-bold text-textPrimary mb-1">
            Update status
          </Text>
          <Text className="text-sm text-textSecondary mb-4">
            Set status for {item.maintenanceItem ?? "this item"} in {label} to{" "}
            {statusStyle.label}.
          </Text>

          <View className="flex-row items-center gap-2 mb-4">
            <View
              className={`w-8 h-8 rounded-md items-center justify-center ${statusStyle.bg}`}
            >
              <Text className="text-sm font-bold text-white">
                {statusStyle.letter}
              </Text>
            </View>
            <Text className="text-base font-semibold text-textPrimary">
              {statusStyle.label}
            </Text>
          </View>

          <TextAreaField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Completed on Jan 15. All sealants inspected."
          />

          <View className="flex-row gap-3 mt-5">
            <View className="flex-1">
              <AppButton variant="outline" onPress={onClose}>
                Cancel
              </AppButton>
            </View>
            <View className="flex-1">
              <AppButton
                loading={loading}
                onPress={() => onSave(note.trim())}
              >
                Update status
              </AppButton>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type NoteModalProps = {
  visible: boolean;
  item: PreventiveMaintenanceResponse | null;
  monthCode: string | null;
  loading?: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
};

export function PMNoteModal({
  visible,
  item,
  monthCode,
  loading,
  onClose,
  onSave,
}: NoteModalProps) {
  const [note, setNote] = useState("");
  const label = monthLabel(monthCode ?? undefined);

  useEffect(() => {
    if (visible && item && monthCode) {
      setNote(item.notesPerMonth?.[monthCode] ?? "");
    }
  }, [visible, item, monthCode]);

  if (!item || !monthCode) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl bg-white px-5 pt-4 pb-8"
        >
          <Text className="text-lg font-bold text-textPrimary mb-1">
            Note for {label}
          </Text>
          <Text className="text-sm text-textSecondary mb-4">
            Add or edit a note for {item.maintenanceItem ?? "this item"} in{" "}
            {label}.
          </Text>

          <TextAreaField
            label="Note"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Completed on Jan 15. All sealants inspected."
          />

          <View className="flex-row gap-3 mt-5">
            <View className="flex-1">
              <AppButton variant="outline" onPress={onClose}>
                Cancel
              </AppButton>
            </View>
            <View className="flex-1">
              <AppButton loading={loading} onPress={() => onSave(note)}>
                Save note
              </AppButton>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
