import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { ReplySheet } from "@/src/screens/private/Updates/ReplySheet";
import { router } from "expo-router";

export default function UpdatesRepliesPage() {
  return (
    <ScreenContainer scrollable={false} refreshable={false}>
      <ReplySheet
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(private)/(tabs)/updates");
          }
        }}
      />
    </ScreenContainer>
  );
}
