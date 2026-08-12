import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import { CollapsibleCard } from "@/src/components/ui/CollapsibleCard";
import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

type RelatedItem = {
  key: string;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  pathname: Href;
  accent: string;
};

const RELATED: RelatedItem[] = [
  {
    key: "owners",
    label: "Owners",
    hint: "Owner names, phones, and activity dates",
    icon: "person-outline",
    pathname: "/(private)/owner-management",
    accent: "#453956",
  },
  {
    key: "tenants",
    label: "Tenants",
    hint: "Tenant contacts and Form K",
    icon: "people-outline",
    pathname: "/(private)/tenant-management",
    accent: "#2563EB",
  },
  {
    key: "agents",
    label: "Property agents",
    hint: "Company and property manager details",
    icon: "briefcase-outline",
    pathname: "/(private)/property-agent-management",
    accent: "#D97706",
  },
  {
    key: "vehicles",
    label: "Vehicles",
    hint: "License plate, make, and color",
    icon: "car-outline",
    pathname: "/(private)/vehicle-management",
    accent: "#0F766E",
  },
  {
    key: "passes",
    label: "Visitor passes",
    hint: "Pass numbers and issue dates",
    icon: "ticket-outline",
    pathname: "/(private)/visitor-pass-management",
    accent: "#7C3AED",
  },
  {
    key: "devices",
    label: "Access devices",
    hint: "Fobs, remotes, and key tags",
    icon: "key-outline",
    pathname: "/(private)/access-device-management",
    accent: "#BE185D",
  },
  {
    key: "emergency",
    label: "Emergency contacts",
    hint: "Emergency names and phone numbers",
    icon: "medkit-outline",
    pathname: "/(private)/emergency-contact-management",
    accent: "#DC2626",
  },
];

type Props = {
  residentId: number;
  /** When true, open the first few sections by default */
  defaultOpen?: boolean;
};

export default function ResidentRelatedRecords({
  residentId,
  defaultOpen = false,
}: Props) {
  const [openKey, setOpenKey] = useState<string | null>(
    defaultOpen ? RELATED[0].key : null,
  );

  const openManage = (pathname: Href) => {
    router.push({
      pathname: pathname as any,
      params: {
        residentId: String(residentId),
        returnTo: "details",
      },
    });
  };

  return (
    <View className="mb-2">
      <Text className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Related records
      </Text>
      <Text className="mb-3 px-1 text-xs text-textSecondary">
        Expand a section, then tap Manage to create or update. After saving you
        return to resident details.
      </Text>

      {RELATED.map((item) => {
        const expanded = openKey === item.key;
        return (
          <CollapsibleCard
            key={item.key}
            icon={item.icon}
            title={item.label}
            subtitle={item.hint}
            expanded={expanded}
            onToggle={() => setOpenKey(expanded ? null : item.key)}
            accentColor={item.accent}
          >
            <Text className="mb-3 text-sm text-textSecondary">{item.hint}</Text>
            <AnimatedPressable
              onPress={() => openManage(item.pathname)}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-primary py-3"
            >
              <AppIcon name="create-outline" size={16} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">
                Manage {item.label.toLowerCase()}
              </Text>
            </AnimatedPressable>
          </CollapsibleCard>
        );
      })}
    </View>
  );
}
