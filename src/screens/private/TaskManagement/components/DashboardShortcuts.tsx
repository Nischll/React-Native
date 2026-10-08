import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { showToast } from "@/src/utils/toast";
import { router, usePathname, type Href } from "expo-router";
import { useState, type ComponentProps } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

type IconName = ComponentProps<typeof AppIcon>["name"];

type ShortcutItem = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

const PLUS_SIZE = 48;

function listPath(pathname: string, suffix: string) {
  const path = pathname.replace(/\/+$/, "");
  return path === suffix || path.endsWith(suffix);
}

function openList(pathname: Href, currentPath: string, params: Record<string, string>) {
  const suffix = String(pathname).replace("/(private)", "");
  if (listPath(currentPath, suffix)) {
    router.setParams(params);
    return;
  }
  router.navigate({ pathname, params } as Href);
}

export default function DashboardShortcuts() {
  const pathname = usePathname();
  const { buildingId } = useAuth();
  const [open, setOpen] = useState(false);

  const closeAnd = (action: () => void) => {
    setOpen(false);
    action();
  };

  const stamp = () => String(Date.now());

  const groups: { label: string; items: ShortcutItem[]; purchases?: ShortcutItem[] }[] = [
    {
      label: "Resident",
      items: [
        {
          label: "Visitor parking",
          icon: "car-outline",
          onPress: () =>
            closeAnd(() => {
              if (buildingId == null) {
                showToast(
                  "error",
                  "Visitor parking inspections require a building.",
                );
                return;
              }
              router.push(
                "/(private)/visitor-parking/inspection-add-edit" as Href,
              );
            }),
        },
      ],
    },
    {
      label: "Operation",
      items: [
        {
          label: "Task",
          icon: "clipboard-outline",
          onPress: () =>
            closeAnd(() =>
              openList("/(private)/task-management", pathname, {
                create: "1",
                at: stamp(),
              }),
            ),
        },
        {
          label: "Booking",
          icon: "calendar-outline",
          onPress: () =>
            closeAnd(() =>
              router.push(
                "/(private)/booking-management/booking-add-edit" as Href,
              ),
            ),
        },
        {
          label: "Parcel",
          icon: "cube-outline",
          onPress: () =>
            closeAnd(() =>
              router.push("/(private)/barcode-scanner" as Href),
            ),
        },
      ],
    },
    {
      label: "Maintenance",
      items: [
        {
          label: "Trade",
          icon: "construct-outline",
          onPress: () =>
            closeAnd(() =>
              router.push({
                pathname: "/(private)/trade-management/trade-add-edit",
                params: { mode: "create" },
              } as Href),
            ),
        },
      ],
    },
    {
      label: "Finance",
      items: [],
      purchases: [
        {
          label: "Filter",
          icon: "funnel-outline",
          onPress: () =>
            closeAnd(() =>
              openList("/(private)/purchases", pathname, {
                section: "one-time",
                tab: "FILTER",
                create: "filter",
                at: stamp(),
              }),
            ),
        },
        {
          label: "Access device",
          icon: "key-outline",
          onPress: () =>
            closeAnd(() =>
              openList("/(private)/purchases", pathname, {
                section: "one-time",
                tab: "ACCESS_DEVICE",
                create: "access-device",
                at: stamp(),
              }),
            ),
        },
        {
          label: "Rental",
          icon: "repeat-outline",
          onPress: () =>
            closeAnd(() =>
              openList("/(private)/purchases", pathname, {
                section: "recurring",
                create: "rental",
                at: stamp(),
              }),
            ),
        },
        {
          label: "Visitor pass",
          icon: "ticket-outline",
          onPress: () =>
            closeAnd(() =>
              openList("/(private)/purchases", pathname, {
                section: "one-time",
                tab: "VISITOR_PASS",
                create: "visitor-pass",
                at: stamp(),
              }),
            ),
        },
        {
          label: "Enterphone",
          icon: "call-outline",
          onPress: () =>
            closeAnd(() =>
              openList("/(private)/purchases", pathname, {
                section: "one-time",
                tab: "ENTERPHONE",
                create: "enterphone",
                at: stamp(),
              }),
            ),
        },
      ],
    },
  ];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Shortcuts"
        style={{
          height: PLUS_SIZE,
          width: PLUS_SIZE,
          borderRadius: PLUS_SIZE / 2,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E2E8F0",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.16,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <AppIcon name="add" size={22} color="#453956" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={() => undefined}
            className="max-h-[80%] rounded-t-3xl bg-white px-4 pb-8 pt-4"
          >
            <Text className="mb-3 text-lg font-bold text-textPrimary">
              Shortcuts
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {groups.map((group, groupIndex) => (
                <View key={group.label}>
                  {groupIndex > 0 ? (
                    <View className="my-2 h-px bg-slate-200" />
                  ) : null}
                  <Text className="px-1 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {group.label}
                  </Text>
                  {group.items.map((item) => (
                    <ShortcutRow key={item.label} item={item} />
                  ))}
                  {group.purchases ? (
                    <View className="mb-1 mt-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <View className="flex-row items-center gap-2 px-2 py-1">
                        <AppIcon name="cart-outline" size={16} color="#64748B" />
                        <Text className="text-xs font-semibold text-slate-800">
                          Purchases
                        </Text>
                      </View>
                      <View className="ml-3 border-l border-slate-200 pl-1">
                        {group.purchases.map((item) => (
                          <ShortcutRow key={item.label} item={item} />
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function ShortcutRow({ item }: { item: ShortcutItem }) {
  return (
    <Pressable
      onPress={item.onPress}
      className="flex-row items-center gap-3 rounded-xl px-2 py-3"
    >
      <AppIcon name={item.icon} size={18} color="#453956" />
      <Text className="text-base font-medium text-slate-800">{item.label}</Text>
    </Pressable>
  );
}
