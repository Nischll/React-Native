import PageHeader from "@/src/components/layout/PageHeader";
import { View } from "react-native";

export function ImprovementAddEdit() {
  return (
    <>
      <View>
        <PageHeader
          icon="hammer"
          title="Add improvement"
          subtitle="building improvement add"
          showBackButton
        />
      </View>
    </>
  );
}
