import { useGetRevenueDetails } from "@/src/api/revenue.api";
import {
  MobileColumn,
  MobileDataList,
} from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu, {
  MenuItem,
} from "@/src/components/ui/AnchoredPopMenu";
import SelectField from "@/src/components/ui/SelectField";
import { useDateRangeFilter } from "@/src/hooks/useDateRangeFilter";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  depositStatusLabel,
  getDepositAmount,
  getRevenueAmount,
  getRevenueReference,
  getRevenueSubDetail,
  isRevenuePaid,
  RevenueDetailItem,
  RevenueDetailType,
  RevenueTab,
  typeLabel,
} from "@/src/types/revenueDetail.types";
import { PAGE_SIZE } from "@/src/utils/listPagination";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TaskFilterModal } from "../TaskManagement/components/TaskFilterModal";
import RevenueActionModal, {
  RevenueActionMode,
} from "./RevenueActionModal";

const TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "All types", value: "ALL" },
  { label: "Booking", value: "BOOKING" },
  { label: "Filter", value: "FILTER" },
  { label: "Access device", value: "ACCESS_DEVICE" },
  { label: "Visitor pass", value: "VISITOR_PASS" },
  { label: "Rental", value: "RENTAL" },
];

const PAID_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "Paid", value: "true" },
  { label: "Unpaid", value: "false" },
];

export default function RevenueDetails() {
  const { buildingId, user } = useAuth();
  const {
    dateType,
    fromDate,
    toDate,
    applyPreset,
    setFromDate,
    setToDate,
  } = useDateRangeFilter("month");

  const [tab, setTab] = useState<RevenueTab>("non-refundable");
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>("ALL");
  const [paidFilter, setPaidFilter] = useState<string>("ALL");
  const [filterVisible, setFilterVisible] = useState(false);
  const [actionItem, setActionItem] = useState<RevenueDetailItem | null>(null);
  const [actionMode, setActionMode] = useState<RevenueActionMode | null>(null);

  const isRefundable = tab === "refundable";

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);

  const { data, isLoading, refetch, isRefetching } = useGetRevenueDetails(
    {
      page,
      limit: PAGE_SIZE,
      buildingId: buildingId ?? undefined,
      fromDate,
      toDate,
      excludeFree: true,
      refundable: isRefundable,
      type:
        !isRefundable && type !== "ALL"
          ? (type as RevenueDetailType)
          : undefined,
      isPaid:
        paidFilter === "ALL" ? undefined : paidFilter === "true",
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

  const openAction = (row: RevenueDetailItem, mode: RevenueActionMode) => {
    setActionItem(row);
    setActionMode(mode);
  };

  const closeAction = () => {
    setActionItem(null);
    setActionMode(null);
  };

  const columns: MobileColumn<RevenueDetailItem>[] = useMemo(() => {
    const base: MobileColumn<RevenueDetailItem>[] = [
      {
        key: "type",
        label: "Type",
        primary: true,
        render: (value) => typeLabel(value as RevenueDetailType),
      },
      {
        key: "residentName",
        label: "Resident",
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
    ];

    if (isRefundable) {
      return [
        ...base,
        {
          key: "depositAmount" as any,
          label: "Deposit",
          render: (_, row) => `$${getDepositAmount(row)}`,
        },
        {
          key: "depositStatus" as any,
          label: "Deposit status",
          render: (_, row) =>
            depositStatusLabel(
              getRevenueSubDetail(row)?.depositAmountStatus,
            ),
        },
        {
          key: "refundedBy" as any,
          label: "Refunded by",
          render: (_, row) =>
            getRevenueSubDetail(row)?.refundedBy?.trim() || "—",
        },
        {
          key: "paidStatus" as any,
          label: "Paid",
          render: (_, row) => (
            <Text
              className={`font-semibold ${
                isRevenuePaid(row) ? "text-green-600" : "text-amber-600"
              }`}
            >
              {isRevenuePaid(row) ? "Yes" : "No"}
            </Text>
          ),
        },
      ];
    }

    return [
      ...base,
      {
        key: "amount" as any,
        label: "Amount",
        render: (_, row) => `$${getRevenueAmount(row)}`,
      },
      {
        key: "paidStatus" as any,
        label: "Paid",
        render: (_, row) => (
          <Text
            className={`font-semibold ${
              isRevenuePaid(row) ? "text-green-600" : "text-amber-600"
            }`}
          >
            {isRevenuePaid(row) ? "Yes" : "No"}
          </Text>
        ),
      },
    ];
  }, [isRefundable]);

  const switchTab = (next: RevenueTab) => {
    setTab(next);
    setPage(1);
    if (next === "refundable") setType("ALL");
  };

  return (
    <>
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="cash"
          title="Revenue Details"
          subtitle={
            isRefundable
              ? "Booking deposits — on hold / refunded"
              : "Fees across bookings, filters, devices, passes & rentals"
          }
        />

        {/* Tabs */}
        <View className="flex-row gap-2 mb-3 px-1">
          {(
            [
              { key: "non-refundable", label: "Non-refundable" },
              { key: "refundable", label: "Refundable" },
            ] as const
          ).map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => switchTab(t.key)}
                className={`flex-1 items-center rounded-xl border py-2.5 ${
                  active
                    ? "bg-primary border-primary"
                    : "bg-white border-slate-300"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    active ? "text-white" : "text-textPrimary"
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Filters */}
        <View className="mb-3 gap-2 px-1">
          <View className="flex-row gap-2">
            <View className="flex-1">
              <SelectField
                label="Paid"
                value={paidFilter}
                onChange={(v) => {
                  setPaidFilter(v);
                  setPage(1);
                }}
                options={PAID_FILTER_OPTIONS}
                placeholder="Paid filter"
              />
            </View>
            {!isRefundable && (
              <View className="flex-1">
                <SelectField
                  label="Type"
                  value={type}
                  onChange={(v) => {
                    setType(v);
                    setPage(1);
                  }}
                  options={TYPE_OPTIONS}
                  placeholder="Type"
                />
              </View>
            )}
          </View>
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
            emptyMessage={
              isRefundable
                ? "No refundable booking deposits found."
                : "No non-refundable fees found."
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
              const items: MenuItem[] = isRefundable
                ? [
                    {
                      label: "Deposit update",
                      icon: "wallet",
                      onPress: () => openAction(row, "deposit"),
                    },
                    {
                      label: "View details",
                      icon: "eye",
                      onPress: () => openAction(row, "view"),
                    },
                  ]
                : [
                    {
                      label: "Pay now",
                      icon: "card",
                      onPress: () => openAction(row, "pay"),
                    },
                    {
                      label: "View details",
                      icon: "eye",
                      onPress: () => openAction(row, "view"),
                    },
                  ];
              return <AnchoredPopupMenu items={items} />;
            }}
          />
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

      <RevenueActionModal
        item={actionItem}
        mode={actionMode}
        onClose={closeAction}
        onSaved={refetch}
      />
    </>
  );
}
