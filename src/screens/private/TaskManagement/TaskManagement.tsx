import PageHeader from "@/src/components/layout/PageHeader";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import { router } from "expo-router";
import { View } from "react-native";

export default function TaskManagement() {
  return (
    <>
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="cube"
          title="Task Management"
          subtitle="Organize and track tasks across statuses with filters, comments, and attachments."
        />

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
    </>
  );
}
