import { PurchaseType, useGetPurchases } from "@/src/api/purchases.api";
import {
  MobileColumn,
  MobileDataList,
} from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu, {
  MenuItem,
} from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import { useDateRangeFilter } from "@/src/hooks/useDateRangeFilter";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  getRevenueAmount,
  getRevenueReference,
  isRevenuePaid,
  RevenueDetailItem,
} from "@/src/types/revenueDetail.types";
import { PAGE_SIZE } from "@/src/utils/listPagination";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { TaskFilterModal } from "../TaskManagement/components/TaskFilterModal";
import PurchaseFormModal from "./PurchaseFormModal";

type PurchaseSection = "all" | "one-time" | "recurring";

type OneTimeTab = "FILTER" | "ENTERPHONE" | "VISITOR_PASS" | "ACCESS_DEVICE";

const SECTIONS: {
  key: PurchaseSection;
  label: string;
  icon: React.ComponentProps<typeof AppIcon>["name"];
}[] = [
  { key: "all", label: "All", icon: "grid-outline" },
  { key: "one-time", label: "One-time", icon: "flash-outline" },
  { key: "recurring", label: "Recurring", icon: "repeat-outline" },
];

const ONE_TIME_TABS: {
  key: OneTimeTab;
  label: string;
  icon: React.ComponentProps<typeof AppIcon>["name"];
}[] = [
  { key: "FILTER", label: "Filter", icon: "funnel-outline" },
  { key: "ENTERPHONE", label: "Enterphone", icon: "call-outline" },
  { key: "VISITOR_PASS", label: "Visitor pass", icon: "ticket-outline" },
  { key: "ACCESS_DEVICE", label: "Access device", icon: "key-outline" },
];

const ALL_CREATE_TYPES: { label: string; value: PurchaseType }[] = [
  { label: "Filter", value: "FILTER" },
  { label: "Enterphone", value: "ENTERPHONE" },
  { label: "Visitor Pass", value: "VISITOR_PASS" },
  { label: "Access Device", value: "ACCESS_DEVICE" },
  { label: "Rental", value: "RENTAL" },
];

const ONE_TIME_CREATE_TYPES = ALL_CREATE_TYPES.filter(
  (t) => t.value !== "RENTAL",
);

export default function Purchases() {
  const { buildingId, user } = useAuth();
  const [page, setPage] = useState(1);
  const [section, setSection] = useState<PurchaseSection>("all");
  const [oneTimeTab, setOneTimeTab] = useState<OneTimeTab>("FILTER");
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formType, setFormType] = useState<PurchaseType>("FILTER");
  const [editItem, setEditItem] = useState<RevenueDetailItem | null>(null);
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const {
    dateType,
    fromDate,
    toDate,
    applyPreset,
    setFromDate,
    setToDate,
  } = useDateRangeFilter("month");

  const apiType: PurchaseType | undefined = useMemo(() => {
    if (section === "all") return undefined;
    if (section === "recurring") return "RENTAL";
    return oneTimeTab;
  }, [section, oneTimeTab]);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, section, oneTimeTab]);

  const { data, isLoading, refetch, isRefetching } = useGetPurchases(
    {
      page,
      limit: PAGE_SIZE,
      buildingId: buildingId ?? undefined,
      type: apiType,
      fromDate,
      toDate,
    },
    !!user?.userId && !!buildingId,
  );

  const raw: any = data?.data;
  const items: RevenueDetailItem[] = Array.isArray(raw)
    ? raw
    : (raw?.data ?? []);
  const total: number = Array.isArray(raw)
    ? raw.length
    : (raw?.total ?? items.length);

  const switchSection = (next: PurchaseSection) => {
    setSection(next);
    setPage(1);
    if (next === "one-time") setOneTimeTab("FILTER");
  };

  const openCreate = () => {
    if (section === "recurring") {
      startCreate("RENTAL");
      return;
    }
    if (section === "one-time") {
      startCreate(oneTimeTab);
      return;
    }
    setTypePickerVisible(true);
  };

  const startCreate = (purchaseType: PurchaseType) => {
    setTypePickerVisible(false);
    setFormMode("create");
    setFormType(purchaseType);
    setEditItem(null);
    setFormVisible(true);
  };

  const openEdit = (row: RevenueDetailItem) => {
    setFormMode("edit");
    setFormType(row.type as PurchaseType);
    setEditItem(row);
    setFormVisible(true);
  };

  const createPickerTypes =
    section === "one-time" ? ONE_TIME_CREATE_TYPES : ALL_CREATE_TYPES;

  const columns: MobileColumn<RevenueDetailItem>[] = [
    {
      key: "type",
      label: "Type",
      primary: section === "all",
      render: (value) => String(value ?? "—"),
    },
    {
      key: "residentName",
      label: "Resident",
      primary: section !== "all",
      searchable: true,
      render: (_, row) =>
        [row.residentUnit, row.residentName].filter(Boolean).join(" · ") ||
        "—",
    },
    {
      key: "reference" as any,
      label: "Reference",
      render: (_, row) => getRevenueReference(row),
    },
    {
      key: "buildingName",
      label: "Building",
    },
    {
      key: "amount" as any,
      label: "Amount",
      render: (_, row) =>
        row.type === "ENTERPHONE" ? "—" : `$${getRevenueAmount(row)}`,
    },
    {
      key: "paidStatus" as any,
      label: "Status",
      render: (_, row) =>
        row.type === "ENTERPHONE" ? (
          <Text className="font-semibold text-slate-500">N/A</Text>
        ) : (
          <Text
            className={`font-semibold ${
              isRevenuePaid(row) ? "text-green-600" : "text-amber-600"
            }`}
          >
            {isRevenuePaid(row) ? "Paid" : "Unpaid"}
          </Text>
        ),
    },
  ];

  const subtitle =
    section === "recurring"
      ? "Recurring rentals for the selected building"
      : section === "one-time"
        ? "One-time purchases for the selected building"
        : "One-time and recurring purchases for the selected building";

  return (
    <>
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="cart"
          title="Purchases"
          subtitle={subtitle}
        />

        {/* Section: All | One-time | Recurring */}
        <View className="flex-row mb-3 bg-slate-100 rounded-xl p-1 gap-1">
          {SECTIONS.map((s) => {
            const active = section === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => switchSection(s.key)}
                className="flex-1"
              >
                <View
                  className={`py-2.5 rounded-lg flex-row items-center justify-center gap-1 ${
                    active ? "bg-primary" : "bg-transparent"
                  }`}
                >
                  <AppIcon
                    name={s.icon}
                    size={14}
                    color={active ? "#fff" : "#64748B"}
                  />
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-slate-500"
                    }`}
                    numberOfLines={1}
                  >
                    {s.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* One-time subtype tabs — 2×2 grid, no horizontal scroll */}
        {section === "one-time" && (
          <View className="mb-3 rounded-xl border border-slate-200 bg-white p-1.5">
            <View className="flex-row flex-wrap">
              {ONE_TIME_TABS.map((t) => {
                const active = oneTimeTab === t.key;
                return (
                  <View key={t.key} className="w-1/2 p-1">
                    <Pressable
                      onPress={() => {
                        setOneTimeTab(t.key);
                        setPage(1);
                      }}
                      className={`flex-row items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 ${
                        active ? "bg-primary" : "bg-slate-50"
                      }`}
                    >
                      <AppIcon
                        name={t.icon}
                        size={14}
                        color={active ? "#fff" : "#64748B"}
                      />
                      <Text
                        className={`text-xs font-semibold ${
                          active ? "text-white" : "text-slate-600"
                        }`}
                        numberOfLines={1}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View className="flex-1">
          <MobileDataList<RevenueDetailItem>
            data={items}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            backendMode
            keyExtractor={(item) => `${item.type}-${item.sourceId}`}
            emptyMessage={
              section === "recurring"
                ? "No recurring rentals found"
                : section === "one-time"
                  ? "No one-time purchases found"
                  : "No purchases found"
            }
            onRefresh={refetch}
            onFilterPress={() => setFilterVisible(true)}
            pagination={{
              page,
              pageSize: PAGE_SIZE,
              total,
              hasMore: page * PAGE_SIZE < total,
              onPageChange: setPage,
            }}
            renderActions={(row) => {
              const menuItems: MenuItem[] = [
                {
                  label: "Edit",
                  icon: "create",
                  onPress: () => openEdit(row),
                },
              ];
              return <AnchoredPopupMenu items={menuItems} />;
            }}
          />
        </View>

        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={openCreate}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
      </View>

      <TaskFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        dateType={dateType}
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        applyPreset={applyPreset}
        showResident={false}
      />

      <Modal
        transparent
        visible={typePickerVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setTypePickerVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setTypePickerVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-3xl bg-white px-5 pt-4 pb-8"
          >
            <Text className="text-lg font-bold text-textPrimary mb-1">
              Create purchase
            </Text>
            <Text className="text-sm text-textSecondary mb-4">
              Choose the purchase type
            </Text>
            {createPickerTypes.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => startCreate(t.value)}
                className="flex-row items-center justify-between py-3.5 border-b border-slate-100"
              >
                <Text className="text-base font-semibold text-textPrimary">
                  {t.label}
                </Text>
                <AppIcon name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <PurchaseFormModal
        visible={formVisible}
        mode={formMode}
        purchaseType={formType}
        item={editItem}
        onClose={() => {
          setFormVisible(false);
          setEditItem(null);
        }}
        onSaved={refetch}
      />
    </>
  );
}
