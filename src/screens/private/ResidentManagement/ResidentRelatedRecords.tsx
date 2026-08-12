import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { Text, View } from "react-native";

type RelatedItem = {
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  pathname: Href;
};

const RELATED: RelatedItem[] = [
  {
    label: "Owners",
    hint: "Add or update owners",
    icon: "person-outline",
    pathname: "/(private)/owner-management",
  },
  {
    label: "Tenants",
    hint: "Add or update tenants",
    icon: "people-outline",
    pathname: "/(private)/tenant-management",
  },
  {
    label: "Property agents",
    hint: "Add or update agents",
    icon: "briefcase-outline",
    pathname: "/(private)/property-agent-management",
  },
  {
    label: "Vehicles",
    hint: "Add or update vehicles",
    icon: "car-outline",
    pathname: "/(private)/vehicle-management",
  },
  {
    label: "Visitor passes",
    hint: "Add or update passes",
    icon: "ticket-outline",
    pathname: "/(private)/visitor-pass-management",
  },
  {
    label: "Access devices",
    hint: "Fobs, remotes, key tags",
    icon: "key-outline",
    pathname: "/(private)/access-device-management",
  },
  {
    label: "Emergency contacts",
    hint: "Add or update contacts",
    icon: "medkit-outline",
    pathname: "/(private)/emergency-contact-management",
  },
];

type Props = {
  residentId: number;
};

export default function ResidentRelatedRecords({ residentId }: Props) {
  return (
    <Card className="mb-4 overflow-hidden p-0">
      <View className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
        <Text className="text-base font-bold text-textPrimary">
          Related records
        </Text>
        <Text className="mt-0.5 text-xs text-textSecondary">
          Same as the web resident form — create and update owners, tenants,
          agents, vehicles, passes, access devices, and emergency contacts.
        </Text>
      </View>
      {RELATED.map((item, index) => (
        <AnimatedPressable
          key={item.label}
          onPress={() =>
            router.push({
              pathname: item.pathname as any,
              params: { residentId: String(residentId) },
            })
          }
          className={`flex-row items-center gap-3 px-4 py-3 ${
            index > 0 ? "border-t border-gray-100" : ""
          }`}
        >
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <AppIcon name={item.icon} size={17} color="#453956" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-textPrimary">
              {item.label}
            </Text>
            <Text className="text-xs text-textSecondary">{item.hint}</Text>
          </View>
          <AppIcon name="chevron-forward" size={16} color="#B4B2A9" />
        </AnimatedPressable>
      ))}
    </Card>
  );
}
