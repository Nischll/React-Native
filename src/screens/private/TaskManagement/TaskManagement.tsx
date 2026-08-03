import { useGetAllCategory } from "@/src/api/taskManagement.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import { getDatePresetRange } from "@/src/helper/formatDateTime";
import { useTaskStatusOptions } from "@/src/hooks/useTaskStatus";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import BuildingHeader from "./components/BuildingHeader";
import { TaskFilterModal } from "./components/TaskFilterModal";
import TaskSearchBar from "./components/TaskSearchBar";
import TaskStatusSection from "./components/TaskStatusSection";
import TaskStatusTabs from "./components/TaskStatusTabs";

export default function TaskManagement() {
  const { selectedBuilding } = useAuth();
  const buildingId = Number(selectedBuilding?.value);

  const { data: categoryData } = useGetAllCategory();
  const categories = categoryData?.data ?? [];

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [selectedStatusValue, setSelectedStatusValue] = useState<string>("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [residentId, setResidentId] = useState<number>();
  const [dateType, setDateType] = useState<
    "today" | "week" | "month" | "custom"
  >("month");
  const [fromDate, setFromDate] = useState<string>();
  const [toDate, setToDate] = useState<string>();

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

  const { taskStatus, isLoading: statusLoading } = useTaskStatusOptions();

  const filteredStatuses = useMemo(() => {
    if (selectedCategoryId === null) return taskStatus;
    return taskStatus.filter((s) => s.categoryId === selectedCategoryId);
  }, [taskStatus, selectedCategoryId]);

  const hasStatuses = !statusLoading && filteredStatuses.length > 0;

  useEffect(() => {
    if (filteredStatuses.length > 0) {
      setSelectedStatusValue(filteredStatuses[0].value);
    } else {
      setSelectedStatusValue("");
    }
  }, [filteredStatuses]);
  const handleCountResolved = useCallback((statusId: number, count: number) => {
    setTaskCounts((prev) => {
      if (prev[String(statusId)] === count) return prev;
      return { ...prev, [String(statusId)]: count };
    });
  }, []);

  const applyPreset = (type: "today" | "week" | "month" | "custom") => {
    if (type !== "custom") {
      const { fromDate: from, toDate: to } = getDatePresetRange(type);
      setFromDate(from);
      setToDate(to);
    }
    setDateType(type);
  };

  useEffect(() => {
    applyPreset("month");
  }, []);

  const isPageLoading =
    statusLoading || !categoryData || selectedCategoryId === null;

  if (isPageLoading) {
    return (
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="cube"
          title="Task Management"
          subtitle="Organize and track tasks across statuses with comments, and attachments."
        />

        <BuildingHeader buildingName={selectedBuilding?.label ?? ""} />

        {/* Category pills skeleton */}
        <View className="flex-row p-4 gap-4">
          {[1, 2, 3].map((item) => (
            <View key={item} className="h-9 w-24 rounded-full bg-gray-200" />
          ))}
        </View>

        {/* Search skeleton */}
        <View className="mx-4 mt-3 h-12 rounded-xl bg-gray-200" />

        {/* Tabs skeleton */}
        <View className="flex-row gap-2 px-4 mt-3">
          {[1, 2, 3].map((item) => (
            <View key={item} className="h-10 flex-1 rounded-lg bg-gray-200" />
          ))}
        </View>

        {/* Task cards skeleton */}
        <ScrollView className="flex-1 px-4 mt-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1">
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
          {categories?.map((cat) => {
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

      {hasStatuses ? (
        <>
          {/* ── Search bar — only when statuses exist ── */}
          <TaskSearchBar
            onSearch={setSearch}
            onFilterPress={() => setFilterVisible(true)}
          />

          {/* ── Status tabs ── */}
          <TaskStatusTabs
            tabs={filteredStatuses}
            selectedValue={selectedStatusValue}
            onSelect={setSelectedStatusValue}
            taskCounts={taskCounts}
          />

          {/* ── Task list ── */}
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
                residentId={residentId}
                fromDate={fromDate}
                toDate={toDate}
                onCountResolved={handleCountResolved}
              />
            ))}
          </ScrollView>
        </>
      ) : (
        !statusLoading && (
          <EmptyState
            title="No Statuses Found"
            message="There are no task statuses configured for this category yet."
          />
        )
      )}

      {/* ── FAB — Add task ── */}
      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push({
              pathname: "/(private)/task-management/task-add-edit",
              params: {
                mode: "create",
                ...(selectedCategoryId != null
                  ? { categoryId: String(selectedCategoryId) }
                  : {}),
              },
            })
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <TaskFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        residentId={residentId}
        setResidentId={setResidentId}
        dateType={dateType}
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        applyPreset={applyPreset}
      />
    </View>
  );
}
