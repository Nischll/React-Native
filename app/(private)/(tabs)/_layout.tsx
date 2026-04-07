import AppIcon from "@/src/components/ui/AppIcon";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
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
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="home" label="Home" color={color} focused={focused} />
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
        className={`mt-1 text-sm font-semibold ${
          focused ? "text-blue-600" : "text-slate-400"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
