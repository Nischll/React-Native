import { useGetAllCategory } from "@/src/api/taskManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import { useTaskStatusOptions } from "@/src/hooks/useTaskStatus";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import BuildingHeader from "./components/BuildingHeader";
import TaskSearchBar from "./components/TaskSearchBar";
import TaskStatusSection from "./components/TaskStatusSection";
import TaskStatusTabs from "./components/TaskStatusTabs";

export default function TaskManagement() {
  const { selectedBuilding } = useAuth();
  const buildingId = Number(selectedBuilding?.value);

  // ── 1. Categories ────────────────────────────────────────────────────────
  const { data: categoryData } = useGetAllCategory();
  const categories = categoryData?.data ?? [];

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

  // ── 2. Task statuses — filtered by selected category ─────────────────────
  const { taskStatus, isLoading: statusLoading } = useTaskStatusOptions();

  const filteredStatuses = useMemo(() => {
    if (selectedCategoryId === null) return taskStatus;
    return taskStatus.filter((s) => s.categoryId === selectedCategoryId);
  }, [taskStatus, selectedCategoryId]);

  const [selectedStatusValue, setSelectedStatusValue] = useState<string>("");
  useEffect(() => {
    if (filteredStatuses.length > 0) {
      setSelectedStatusValue(filteredStatuses[0].value);
    } else {
      setSelectedStatusValue("");
    }
  }, [filteredStatuses]);

  // ── 3. Search ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const handleCountResolved = useCallback((statusId: number, count: number) => {
    setTaskCounts((prev) => {
      if (prev[String(statusId)] === count) return prev;
      return { ...prev, [String(statusId)]: count };
    });
  }, []);

  return (
    <View className="flex-1">
      {/* Page header */}
      <PageHeader
        showBackButton
        icon="cube"
        title="Task Management"
        subtitle="Organize and track tasks across statuses with comments, and attachments."
      />

      {/* Building selector (read-only) */}
      <BuildingHeader buildingName={selectedBuilding?.label ?? ""} />

      {/* ── Category filter pills ── */}
      <View style={{ height: 52 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            alignItems: "center",
            height: 52,
          }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
                activeOpacity={0.7}
                className={`px-4 py-1.5 rounded-full border h-9 justify-center ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? "text-white" : "text-gray-600"
                  }`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Search bar ── */}
      <TaskSearchBar onSearch={setSearch} />

      {/* ── Status tabs (filtered by selected category) ── */}
      {!statusLoading && filteredStatuses.length > 0 && (
        <TaskStatusTabs
          tabs={filteredStatuses}
          selectedValue={selectedStatusValue}
          onSelect={setSelectedStatusValue}
          taskCounts={taskCounts}
        />
      )}

      {/* ── Task list — only the active status section renders cards ── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredStatuses.map((status) => (
          <TaskStatusSection
            key={status.value}
            statusId={Number(status.value)}
            isVisible={selectedStatusValue === status.value}
            search={search}
            buildingId={buildingId || undefined}
            onCountResolved={handleCountResolved}
          />
        ))}
      </ScrollView>

      {/* ── FAB — Add task ── */}
      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push({
              pathname: "/(private)/task-management/task-add-edit",
              params: { mode: "create" },
            })
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}
