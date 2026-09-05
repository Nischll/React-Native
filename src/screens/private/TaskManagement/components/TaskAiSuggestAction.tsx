import { useTaskAiChat, useTaskAiModelStatus } from "@/src/api/taskAi.api";
import AppButton from "@/src/components/ui/AppButton";
import {
  TaskAiChatResponseData,
  TaskAiResourceResult,
  TaskAiSimilarExample,
  buildTaskAiQuestion,
  extractTaskAiChatData,
  taskAiErrorMessage,
} from "@/src/types/taskAi.types";
import { showToast } from "@/src/utils/toast";
import { useState } from "react";
import { Text, View } from "react-native";
import TaskAiResourceMatches from "./TaskAiResourceMatches";

type Props = {
  title?: string;
  description?: string;
  location?: string;
  buildingId?: number | null;
  onApply: (suggestedActionTaken: string) => void;
};

export default function TaskAiSuggestAction({
  title,
  description,
  location,
  buildingId,
  onApply,
}: Props) {
  const chatMut = useTaskAiChat();
  const { modelReady } = useTaskAiModelStatus(true);
  const [result, setResult] = useState<TaskAiChatResponseData | null>(null);

  const question = buildTaskAiQuestion({ title, description, location });

  const handleSuggest = () => {
    if (!question.trim()) {
      showToast("error", "Add a title or description first");
      return;
    }
    chatMut.mutate(
      {
        question,
        buildingId: buildingId != null && buildingId > 0 ? buildingId : null,
      },
      {
        onSuccess: (response) => {
          const data = extractTaskAiChatData(response);
          setResult(data);
          const suggestion = data?.suggestedActionTaken?.trim();
          if (suggestion) {
            onApply(suggestion);
            return;
          }
          const hasResources =
            Array.isArray(data?.resourceResults) &&
            data!.resourceResults!.length > 0;
          showToast(
            hasResources ? "success" : "error",
            hasResources
              ? data?.resourceMessage?.trim() ||
                  "No matching past tasks — see related resources below."
              : data?.rationale?.trim() ||
                  "The model did not return a suggested action",
          );
        },
        onError: (error) => {
          showToast("error", taskAiErrorMessage(error));
        },
      },
    );
  };

  const examples: TaskAiSimilarExample[] = Array.isArray(result?.similarExamples)
    ? result!.similarExamples!
    : [];
  const resources: TaskAiResourceResult[] = Array.isArray(
    result?.resourceResults,
  )
    ? result!.resourceResults!
    : [];

  return (
    <View className="mb-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <AppButton
          variant="outline"
          size="sm"
          fullWidth={false}
          leftIcon="sparkles-outline"
          loading={chatMut.isPending}
          disabled={!modelReady || chatMut.isPending}
          onPress={handleSuggest}
        >
          Suggest with AI
        </AppButton>
        {!modelReady ? (
          <Text className="text-xs text-slate-500">
            Model not ready — retrain from Ask AI
          </Text>
        ) : null}
      </View>

      {result?.rationale?.trim() ? (
        <Text className="mt-2 text-xs leading-5 text-slate-500">
          {result.rationale}
        </Text>
      ) : null}

      {examples.length > 0 ? (
        <View className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Text className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Similar past tasks
          </Text>
          {examples.slice(0, 3).map((ex) => (
            <View key={ex.taskId} className="mb-2 last:mb-0">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="min-w-0 flex-1 text-xs font-semibold text-slate-800">
                  {ex.title?.trim() || `Task #${ex.taskId}`}
                </Text>
                {ex.similarity != null ? (
                  <Text className="text-xs text-slate-400">
                    {Math.round(Number(ex.similarity) * 100)}%
                  </Text>
                ) : null}
              </View>
              {ex.actionTaken?.trim() ? (
                <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={2}>
                  {ex.actionTaken}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {resources.length > 0 ? (
        <View className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Text className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {result?.resourceMessage?.trim() || "Related resources"}
          </Text>
          <TaskAiResourceMatches resources={resources} embedded />
        </View>
      ) : null}
    </View>
  );
}
