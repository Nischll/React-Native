import AppIcon from "@/src/components/ui/AppIcon";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { refreshing } = useGlobalRefresh();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
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

        <Tabs.Screen
          name="modules"
          options={{
            title: "Modules",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="apps"
                label="Modules"
                color={color}
                focused={focused}
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
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50">
          {/* <ActivityIndicator size="large" color="#2563eb" /> */}
        </View>
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
      className={`items-center justify-center rounded-2xl 
    
      `}
      style={{
        minWidth: 84,
      }}
    >
      <AppIcon name={icon} color={color} size={22} />
      <Text
        className={`mt-1 text-sm font-semibold`}
        style={{
          color: color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
