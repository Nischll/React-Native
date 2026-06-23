import { useGetTaskById } from "@/src/api/taskManagement.api";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import { CommentResponse } from "@/src/types/task-management.types";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import TaskInformationCard from "./components/TaskInfoCard";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";

const TABS = [
  { key: "info", label: "Info", icon: "information-circle-outline" },
  { key: "attachments", label: "Attachments", icon: "attach-outline" },
  { key: "comments", label: "Comments", icon: "chatbubble-outline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export const TaskDetails = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const parsedTaskId = taskId ? Number(taskId) : undefined;

  const { data: taskData, isLoading: isLoadingTask } =
    useGetTaskById(parsedTaskId);

  const task = taskData?.data?.data?.[0];

  const attachmentCount = task?.attachmentResponsePojoList?.length ?? 0;
  const getTotalComments = (comments: CommentResponse[] = []): number =>
    comments.reduce(
      (count, comment) => count + 1 + getTotalComments(comment.replies ?? []),
      0,
    );

  const commentCount = getTotalComments(task?.commentResponsePojoList ?? []);

  const getBadge = (key: TabKey) => {
    if (key === "attachments") return attachmentCount;
    if (key === "comments") return commentCount;
    return 0;
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="clipboard"
        title="Task Details"
        subtitle={
          task?.taskNumber
            ? `${task.taskNumber} • ${task.title}`
            : "View task information, status and activity"
        }
      />

      {isLoadingTask ? (
        <>
          <View className="bg-white border-b border-slate-200 flex-row px-3 py-2">
            {[1, 2, 3].map((item) => (
              <View
                key={item}
                className="flex-1 h-8 mx-1 rounded-lg bg-gray-200"
              />
            ))}
          </View>

          <ScrollView className="flex-1 p-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </ScrollView>
        </>
      ) : (
        <View className="flex-1">
          {/* ── Tab Bar ── */}
          <View className="bg-white border-b border-slate-200 flex-row gap-4">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const badge = getBadge(tab.key);

              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className="flex-1 items-center"
                >
                  <View className="flex-row items-center gap-1 py-1.5">
                    <AppIcon
                      name={tab.icon as any}
                      size={15}
                      color={isActive ? "#453956" : "#94A3B8"}
                    />
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      {tab.label}
                    </Text>
                    {badge > 0 && (
                      <View className="bg-primary/20 rounded-full px-1.5 py-0.5">
                        <Text className="text-primary text-[10px] font-semibold">
                          {badge}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    className={`h-0.5 w-full rounded-t-full ${
                      isActive ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* ── Tab Content ── */}
          {activeTab !== "comments" ? (
            <ScrollView
              className="flex-1"
              contentContainerClassName="p-3 pb-8"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {activeTab === "info" && task && (
                <TaskInformationCard task={task} />
              )}
              {activeTab === "attachments" && task && (
                <TaskAttachments
                  attachments={task?.attachmentResponsePojoList}
                />
              )}
            </ScrollView>
          ) : (
            task && <TaskComments task={task} />
          )}
        </View>
      )}
    </View>
  );
};
