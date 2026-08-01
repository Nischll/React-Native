import { useGetTrainingById } from "@/src/api/training.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

export default function TrainingDetails() {
  const { id } = useLocalSearchParams();
  const { data, isLoading } = useGetTrainingById(Number(id));
  const item = data?.data;

  if (isLoading) return <LoadingState message="Loading..." />;
  if (!item) return <EmptyState message="Training not found" />;

  return (
    <ScrollView className="flex-1">
      <PageHeader showBackButton icon="school" title="Training Details" subtitle={item.title} />
      <Card className="p-4 mb-3">
        <Text className="text-xs text-textSecondary">Template</Text>
        <Text className="text-sm font-semibold mb-3">{item.templateTitle || "—"}</Text>
        <Text className="text-xs text-textSecondary">Description</Text>
        <Text className="text-sm font-semibold mb-3">{item.description || "—"}</Text>
        <Text className="text-xs text-textSecondary">Progress</Text>
        <Text className="text-sm font-semibold">
          {item.completedEmployees ?? 0} of {item.totalEmployees ?? 0} completed
        </Text>
      </Card>
      <Text className="text-base font-bold text-textPrimary mb-2 px-1">Employees</Text>
      {(item.employees ?? []).length === 0 ? (
        <EmptyState message="No employees assigned" />
      ) : (
        (item.employees ?? []).map((emp) => (
          <View
            key={emp.id}
            className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 mb-2"
          >
            <View className="flex-row items-center gap-3 flex-1">
              <AppIcon name="person-circle-outline" size={24} color="#64748B" />
              <Text className="text-sm font-medium text-textPrimary flex-1" numberOfLines={1}>
                {emp.employeeName}
              </Text>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full ${emp.status === "COMPLETED" ? "bg-green-100" : "bg-amber-100"}`}
            >
              <Text
                className={`text-xs font-semibold ${emp.status === "COMPLETED" ? "text-green-700" : "text-amber-700"}`}
              >
                {emp.status === "COMPLETED" ? "Completed" : "In Progress"}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
