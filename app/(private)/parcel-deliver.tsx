import ScreenContainer from "@/src/components/layout/ScreenContainer";
import ParcelDeliver from "@/src/screens/private/ParcelManagement/ParcelDeliver";

export default function ParcelDeliverPage() {
  // const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer
        // key="static-container"
        refreshable={false}
      >
        <ParcelDeliver
        // key={screenRefreshKey}
        />
      </ScreenContainer>

      {/* {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50">
        </View>
      )} */}
    </>
  );
}
