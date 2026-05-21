import AppIcon from "@/src/components/ui/AppIcon";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { refreshing, unseenUpdatesCount } = useGlobalRefresh();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "shift",
          tabBarActiveTintColor: "#453956",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: {
            height: 60 + (Platform.OS === "android" ? insets.bottom : 0),
            paddingTop: 8,
            paddingBottom: Platform.OS === "android" ? insets.bottom : 8,
            borderTopWidth: 1,
            borderTopColor: "#E2E8F0",
            backgroundColor: "#FFFFFF",
          },
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

        {/* ── REPLACED: modules → updates ── */}
        <Tabs.Screen
          name="updates"
          options={{
            title: "Updates",
            tabBarIcon: ({ color, focused }) => (
              <View>
                <TabIcon
                  icon="megaphone"
                  label="Updates"
                  color={color}
                  focused={focused}
                />

                {unseenUpdatesCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -2,
                      right: 12,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: "#EF4444",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 5,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      {unseenUpdatesCount > 99 ? "99+" : unseenUpdatesCount}
                    </Text>
                  </View>
                )}
              </View>
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
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View
      style={{ alignItems: "center", justifyContent: "center", minWidth: 84 }}
    >
      <AppIcon name={icon} color={color} size={22} />
      <Text style={{ marginTop: 3, fontSize: 11, fontWeight: "600", color }}>
        {label}
      </Text>
    </View>
  );
}
