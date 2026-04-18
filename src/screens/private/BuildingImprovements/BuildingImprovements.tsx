import PageHeader from "@/src/components/layout/PageHeader";
import { View } from "react-native";

export default function BuildingImprovements() {
  return (
    <>
      <View>
        <PageHeader
          title="Building Improvements"
          subtitle="Track improvement work, locations, and before / after images."
          icon="hammer"
          showBackButton
        />
      </View>
    </>
  );
}
