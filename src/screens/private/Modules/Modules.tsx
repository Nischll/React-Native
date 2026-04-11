import PageHeader from "@/src/components/layout/PageHeader";
import ModuleCard from "@/src/components/ui/ModuleCard";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { Text, View } from "react-native";

export default function Modules() {
  const { user } = useAuth();

  const handleModulePress = (moduleCode?: string) => {
    switch (moduleCode) {
      case "PARCEL":
        router.push("/(private)/parcel-management");
        break;

      // case "RESIDENT_MANAGEMENT":
      //   router.push("/(private)/resident-management");
      //   break;

      // case "VISITOR_MANAGEMENT":
      //   router.push("/(private)/visitor-management");
      //   break;

      default:
        break;
    }
  };

  return (
    <View>
      <PageHeader
        title="Modules"
        subtitle="Access all available modules from your workspace"
      />
      {user?.moduleList?.length ? (
        <View className="gap-4">
          {user.moduleList.map((module) => (
            <ModuleCard
              key={module.code}
              title={module.name}
              icon={module.icon}
              // subtitle={module.code}
              onPress={() => handleModulePress(module.code)}
            />
          ))}
        </View>
      ) : (
        <View className="rounded-2xl bg-white p-6 shadow-sm">
          <Text className="text-base font-medium text-slate-700">
            No modules available
          </Text>
          <Text className="mt-2 text-sm text-slate-500">
            Your account currently has no assigned modules.
          </Text>
        </View>
      )}
    </View>
  );
}
