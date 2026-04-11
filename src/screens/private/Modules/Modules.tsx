import PageHeader from "@/src/components/layout/PageHeader";
import ModuleCard from "@/src/components/ui/ModuleCard";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { Text, View } from "react-native";

export default function Modules() {
  const { user } = useAuth();

  const handleModulePress = (module: any) => {
    if (module.path) {
      router.push(`/(private)${module.path}` as any);
    }
  };

  return (
    <View className="flex-1 ">
      <PageHeader
        icon="apps"
        title="Modules"
        subtitle="Access all available modules from your workspace"
      />

      {user?.moduleList?.length ? (
        <View className="gap-2 ">
          {user.moduleList.map((module) => (
            <ModuleCard
              key={module.code}
              module={module}
              onPress={handleModulePress}
            />
          ))}
        </View>
      ) : (
        <View className="rounded-2xl bg-surface p-6 border border-border">
          <Text className="text-base font-medium text-textPrimary">
            No modules available
          </Text>
          <Text className="mt-2 text-sm text-textMuted">
            Your account currently has no assigned modules.
          </Text>
        </View>
      )}
    </View>
  );
}
