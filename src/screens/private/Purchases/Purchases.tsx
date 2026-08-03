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
import { useAuth } from "@/src/providers/AuthProvider";
import {
  getRevenueAmount,
  getRevenueReference,
  isRevenuePaid,
  RevenueDetailItem,
} from "@/src/types/revenueDetail.types";
import { PAGE_SIZE } from "@/src/utils/listPagination";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import PurchaseFormModal from "./PurchaseFormModal";

const TYPES: { label: string; value: PurchaseType }[] = [
  { label: "Filter", value: "FILTER" },
  { label: "Rental", value: "RENTAL" },
  { label: "Access Device", value: "ACCESS_DEVICE" },
  { label: "Visitor Pass", value: "VISITOR_PASS" },
  { label: "Enterphone", value: "ENTERPHONE" },
];

export default function Purchases() {
  const { buildingId, user } = useAuth();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<PurchaseType>("FILTER");
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formType, setFormType] = useState<PurchaseType>("FILTER");
  const [editItem, setEditItem] = useState<RevenueDetailItem | null>(null);
  const [typePickerVisible, setTypePickerVisible] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useGetPurchases(
    {
      page,
      limit: PAGE_SIZE,
      buildingId: buildingId ?? undefined,
      type,
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

  const openCreate = () => {
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

  const columns: MobileColumn<RevenueDetailItem>[] = [
    {
      key: "residentName",
      label: "Resident",
      primary: true,
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

  return (
    <>
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="cart"
          title="Purchases"
          subtitle="Create and manage resident purchases."
        />

        <View className="flex-row flex-wrap gap-2 mb-3">
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => {
                setType(t.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full border ${
                type === t.value
                  ? "bg-primary border-primary"
                  : "border-slate-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  type === t.value ? "text-white" : "text-textPrimary"
                }`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-1">
          <MobileDataList<RevenueDetailItem>
            data={items}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            backendMode
            keyExtractor={(item) => `${item.type}-${item.sourceId}`}
            emptyMessage="No purchases found"
            onRefresh={refetch}
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

      {/* Type picker for create */}
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
            {TYPES.map((t) => (
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
