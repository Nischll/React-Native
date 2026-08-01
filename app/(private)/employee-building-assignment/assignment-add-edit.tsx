import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import EmployeeBuildingAssignmentAddEditScreen from "@/src/screens/private/EmployeeBuildingAssignment/EmployeeBuildingAssignmentAddEdit";
import { View } from "react-native";

export default function AssignmentAddEditPage() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer key="static-container">
        <EmployeeBuildingAssignmentAddEditScreen key={screenRefreshKey} />
      </ScreenContainer>

      {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50">
          {/* <ActivityIndicator size="large" color="#2563eb" /> */}
        </View>
      )}
    </>
  );
}
