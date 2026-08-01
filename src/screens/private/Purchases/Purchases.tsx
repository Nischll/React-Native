import { PurchaseType, useGetPurchases } from "@/src/api/purchases.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  getRevenueAmount,
  isRevenuePaid,
  RevenueDetailItem,
} from "@/src/types/revenueDetail.types";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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

  const { data, isLoading, refetch, isRefetching } = useGetPurchases(
    { page, limit: 10, buildingId: buildingId ?? undefined, type },
    !!user?.userId && !!buildingId,
  );

  const raw: any = data?.data;
  const items: RevenueDetailItem[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const total: number = Array.isArray(raw) ? raw.length : (raw?.total ?? items.length);

  const columns: MobileColumn<RevenueDetailItem>[] = [
    { key: "residentName", label: "Resident", primary: true, searchable: true },
    { key: "residentUnit", label: "Unit" },
    { key: "buildingName", label: "Building" },
    {
      key: "type" as any,
      label: "Amount",
      render: (_, row) => `$${getRevenueAmount(row)}`,
    },
    {
      key: "sourceId" as any,
      label: "Status",
      render: (_, row) => (
        <Text className={`font-semibold ${isRevenuePaid(row) ? "text-green-600" : "text-amber-600"}`}>
          {isRevenuePaid(row) ? "Paid" : "Unpaid"}
        </Text>
      ),
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader showBackButton icon="cart" title="Purchases" subtitle="One-time and recurring resident purchases." />
      <View className="flex-row flex-wrap gap-2 mb-3">
        {TYPES.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => {
              setType(t.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full border ${type === t.value ? "bg-primary border-primary" : "border-slate-300"}`}
          >
            <Text className={`text-xs font-semibold ${type === t.value ? "text-white" : "text-textPrimary"}`}>
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
          pagination={{ page, pageSize: 10, hasMore: page * 10 < total, onPageChange: setPage }}
        />
      </View>
    </View>
  );
}
