import { useTaskAiModelStatus, useTaskAiTrain } from "@/src/api/taskAi.api";
import AppButton from "@/src/components/ui/AppButton";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useTaskAiWritePermission } from "@/src/hooks/useTaskAiWritePermission";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { useState } from "react";
import { Text, View } from "react-native";

export default function TaskAiTrainControls() {
  const trainMut = useTaskAiTrain();
  const { trainedAt, refetch } = useTaskAiModelStatus(true);
  const { canWrite, isLoading } = useTaskAiWritePermission();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !canWrite) return null;

  const trainedLabel =
    trainedAt && formatDateTime(trainedAt) !== "-"
      ? formatDateTime(trainedAt)
      : null;

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <AppButton
        variant="outline"
        size="sm"
        fullWidth={false}
        leftIcon="sparkles-outline"
        loading={trainMut.isPending}
        disabled={trainMut.isPending}
        onPress={() => setConfirmOpen(true)}
      >
        Retrain AI
      </AppButton>
      {trainedLabel ? (
        <Text className="text-[10px] text-slate-500">Last: {trainedLabel}</Text>
      ) : null}

      <ConfirmModal
        visible={confirmOpen}
        title="Retrain AI"
        message="Retrain the task AI model now? This may take a few minutes."
        confirmText="Retrain"
        loading={trainMut.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          trainMut.mutate({} as Record<string, never>, {
            onSuccess: () => {
              setConfirmOpen(false);
              void refetch();
            },
            onError: () => setConfirmOpen(false),
          });
        }}
      />
    </View>
  );
}
