import { useGetRevenueDetails, useUpdateRevenueDetail } from "@/src/api/revenue.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  getRevenueAmount,
  getRevenueSubDetail,
  isRevenuePaid,
  RevenueDetailItem,
  RevenueDetailType,
} from "@/src/types/revenueDetail.types";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

const TYPES: { label: string; value: RevenueDetailType | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Booking", value: "BOOKING" },
  { label: "Filter", value: "FILTER" },
  { label: "Rental", value: "RENTAL" },
  { label: "Access Device", value: "ACCESS_DEVICE" },
  { label: "Visitor Pass", value: "VISITOR_PASS" },
  { label: "Enterphone", value: "ENTERPHONE" },
];

export default function RevenueDetails() {
  const { buildingId, user } = useAuth();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<RevenueDetailType | "ALL">("ALL");
  const [editItem, setEditItem] = useState<RevenueDetailItem | null>(null);
  const [amount, setAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  const { data, isLoading, refetch, isRefetching } = useGetRevenueDetails(
    {
      page,
      limit: 10,
      buildingId: buildingId ?? undefined,
      type: type === "ALL" ? undefined : type,
    },
    !!user?.userId && !!buildingId,
  );

  const raw: any = data?.data;
  const items: RevenueDetailItem[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const total: number = Array.isArray(raw) ? raw.length : (raw?.total ?? items.length);

  const { mutate: updateMutate, isPending } = useUpdateRevenueDetail(editItem?.sourceId);

  const columns: MobileColumn<RevenueDetailItem>[] = [
    { key: "type", label: "Type", primary: true },
    { key: "residentName", label: "Resident", searchable: true },
    { key: "residentUnit", label: "Unit" },
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

  const openEdit = (row: RevenueDetailItem) => {
    const detail = getRevenueSubDetail(row);
    setEditItem(row);
    setAmount(String(detail?.paidFee ?? detail?.paidAmount ?? ""));
    setReceiptNumber(String(detail?.receiptNumber ?? detail?.receipt ?? ""));
  };

  const submitPayment = (markPaid: boolean) => {
    if (!editItem) return;
    updateMutate(
      {
        isPaid: markPaid,
        paidFee: amount || undefined,
        paidAmount: amount || undefined,
        receiptNumber: receiptNumber || undefined,
        receipt: receiptNumber || undefined,
      },
      {
        onSuccess: () => {
          setEditItem(null);
          refetch();
        },
      },
    );
  };

  return (
    <>
      <View className="flex-1">
        <PageHeader showBackButton icon="cash" title="Revenue Details" subtitle="Track fees, deposits, and payments." />
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
            emptyMessage="No revenue records found"
            onRefresh={refetch}
            pagination={{ page, pageSize: 10, total, hasMore: page * 10 < total, onPageChange: setPage }}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[{ label: "Update Payment", icon: "create", onPress: () => openEdit(row) }]}
              />
            )}
          />
        </View>
      </View>
      <Modal
        transparent
        visible={!!editItem}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setEditItem(null)}
      >
        <Pressable
          onPress={() => setEditItem(null)}
          className="flex-1 bg-black/50 items-center justify-center px-6"
        >
          <Pressable onPress={(e) => e.stopPropagation()} className="w-full rounded-2xl bg-white p-5 gap-3">
            <Text className="text-lg font-bold text-textPrimary">Update Payment</Text>
            <Text className="text-sm text-textSecondary">
              {editItem?.residentName} · {editItem?.residentUnit}
            </Text>
            <AppInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <AppInput label="Receipt Number" value={receiptNumber} onChangeText={setReceiptNumber} />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <AppButton variant="outline" onPress={() => setEditItem(null)} disabled={isPending}>
                  Cancel
                </AppButton>
              </View>
              <View className="flex-1">
                <AppButton onPress={() => submitPayment(true)} loading={isPending}>
                  Mark Paid
                </AppButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
