import {
  communicationUnseenTotal,
  useGetCommunicationUnseenSummary,
} from "@/src/api/communication.api";
import { useGetPrivateInbox } from "@/src/api/privateMessage.api";
import AppIcon from "@/src/components/ui/AppIcon";
import { hasModuleCode } from "@/src/helper/flattenModules";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import { useAuth } from "@/src/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useSegments } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { refreshing } = useGlobalRefresh();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const canMessage = hasModuleCode(user?.moduleList ?? [], "D");

  const { data: communicationCountData } = useGetCommunicationUnseenSummary(
    undefined,
    canMessage,
  );
  const { data: privateCountData } = useGetPrivateInbox(1, 1, canMessage);

  const communicationUnseen = communicationUnseenTotal(
    communicationCountData?.data?.unseenCount,
  );
  const privateUnseen =
    privateCountData?.data?.unreadConversationCount ?? 0;

  const isOnReplies = segments.includes("replies" as never);
  const tabBarStyle = isOnReplies
    ? { display: "none" as const }
    : {
        height: 60 + (Platform.OS === "android" ? insets.bottom : 0),
        paddingTop: 8,
        paddingBottom: Platform.OS === "android" ? insets.bottom : 8,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
      };
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "shift",
          tabBarActiveTintColor: "#453956",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: tabBarStyle,
          tabBarLabelStyle: {
            display: "none",
          },
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="home"
                label="Home"
                color={color}
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="(updates)"
          options={{
            title: "Communicate",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="chatbubbles"
                label="Communicate"
                color={color}
                focused={focused}
                badge={communicationUnseen}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="private-messages"
          options={{
            title: "Private",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="chatbubble-ellipses"
                label="Private"
                color={color}
                focused={focused}
                badge={privateUnseen}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="person-circle"
                label="Profile"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>

      {refreshing && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        />
      )}
    </>
  );
}

function TabIcon({
  icon,
  label,
  color,
  focused,
  badge,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View
      style={{ alignItems: "center", justifyContent: "center", minWidth: 64 }}
    >
      <View>
        <AppIcon name={icon} color={color} size={22} />
        {badge != null && badge > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -10,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#EF4444",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 9,
                fontWeight: "700",
              }}
            >
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={{ marginTop: 3, fontSize: 10, fontWeight: "600", color }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
