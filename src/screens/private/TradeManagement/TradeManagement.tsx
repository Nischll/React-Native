import { useGetTradeVisits } from "@/src/api/tradeManagement.api";
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
import { formatDateTime } from "@/src/helper/formatDateTime";
import { useAuth } from "@/src/providers/AuthProvider";
import { TradeVisitResponse } from "@/src/types/tradeManagement.types";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, TouchableOpacity, View } from "react-native";

export default function TradeManagement() {
  const { user, buildingId } = useAuth();

  const [page, setPage] = useState(1);
  const [lifecycle, setLifecycle] = useState<string | undefined>();

  const { data, isLoading, refetch, isRefetching } = useGetTradeVisits(
    {
      page,
      limit: 10,
      buildingId: buildingId ?? undefined,
      lifecycle,
    },
    !!user?.userId,
  );

  const tradeVisits = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

  const columns: MobileColumn<TradeVisitResponse>[] = [
    {
      key: "tradeName",
      label: "Trade",
      primary: true,
      searchable: true,
      render: (value, row) =>
        `${row.tradeName}${row.company ? ` (${row.company})` : ""}`,
    },
    {
      key: "workType",
      label: "Work Type",
      searchable: true,
      render: (value) =>
        String(value)
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase()),
    },
    {
      key: "lifecycleStatus",
      label: "Visit Status",
      searchable: true,
      render: (value) => {
        const status = String(value);

        if (status === "REGISTERED") return "Registered";
        if (status === "ON_SITE") return "On Site";
        if (status === "COMPLETED") return "Completed";

        return status;
      },
    },
    {
      key: "pmApproved",
      label: "Approval",
      searchable: false,
      render: (value) => (value ? "Approved" : "Pending"),
    },
    {
      key: "residentUnit",
      label: "Unit",
      searchable: true,
      render: (value) =>
        typeof value === "string" && value.trim() ? value : "-",
    },
    {
      key: "scheduledAppointmentAt",
      label: "Schedule / Time",
      render: (_, row) => {
        if (row.timeIn && row.timeOut) {
          return `In: ${formatDateTime(row.timeIn)}  Out: ${formatDateTime(row.timeOut)}`;
        }

        if (row.timeIn) {
          return `In: ${formatDateTime(row.timeIn)}`;
        }

        if (row.timeOut) {
          return `Out: ${formatDateTime(row.timeOut)}`;
        }

        if (row.scheduledAppointmentAt) {
          return `Scheduled: ${formatDateTime(row.scheduledAppointmentAt)}`;
        }

        return "-";
      },
    },
  ];

  const FILTERS = [
    { label: "All", value: "" },
    { label: "Registered", value: "REGISTERED" },
    { label: "On Site", value: "ON_SITE" },
    { label: "Completed", value: "COMPLETED" },
  ];

  const animatedValues = useRef(
    FILTERS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  ).current;

  const handleFilterChange = (value: string, index: number) => {
    setPage(1);
    setLifecycle(value || undefined);

    FILTERS.forEach((_, i) => {
      Animated.timing(animatedValues[i], {
        toValue: i === index ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };
  return (
    <View className="flex-1 relative">
      <PageHeader
        title="Trade Management"
        subtitle="Contractor visits, check-in & checkout"
        icon="construct"
        showBackButton
      />

      <View className="flex-row bg-gray-200 rounded-xl p-1">
        {FILTERS.map((filter, index) => {
          const bgColor = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: ["transparent", "#453956"], // e.g. "#
          });
          const textColor = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: ["#4B5563", "#FFFFFF"], // gray-600 → white
          });

          return (
            <TouchableOpacity
              key={filter.value}
              onPress={() => handleFilterChange(filter.value, index)}
              className="flex-1 py-2 rounded-lg items-center"
              activeOpacity={0.7}
            >
              <Animated.View
                className="absolute inset-0 rounded-lg"
                style={{ backgroundColor: bgColor }}
              />
              <Animated.Text
                className="text-xs font-semibold"
                style={{ color: textColor }}
              >
                {filter.label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="flex-1 mt-4">
        <MobileDataList<TradeVisitResponse>
          data={tradeVisits}
          columns={columns}
          loading={isLoading}
          refreshing={isRefetching}
          backendMode
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No trade visits found"
          onRefresh={refetch}
          onSearch={(value) => {
            setPage(1);
          }}
          pagination={{
            page,
            pageSize: 10,
            hasMore: page * 10 < total,
            onPageChange: setPage,
          }}
          renderActions={(row) => {
            const isPmApproved = row.pmApproved === true;
            const hasCheckedIn = !!row.timeIn;
            const hasCheckedOut = !!row.timeOut;
            const isCompleted = row.workCompleted === true;

            const items: MenuItem[] = [];

            items.push({
              label: "View Details",
              icon: "eye",
              onPress: () =>
                router.push({
                  pathname: "/(private)/trade-management/trade-details",
                  params: { id: row.id },
                }),
            });

            if (isCompleted) {
              return <AnchoredPopupMenu items={items} />;
            }

            if (!hasCheckedIn) {
              items.push({
                label: "Edit",
                icon: "pencil",
                onPress: () =>
                  router.push({
                    pathname: "/(private)/trade-management/trade-add-edit",
                    params: { id: row.id },
                  }),
              });

              items.push({
                label: "PM Approval / Document",
                icon: "document-text",
                onPress: () =>
                  router.push({
                    pathname: "/(private)/trade-management/trade-pm-approval",
                    params: { id: row.id },
                  }),
              });
            }

            if (isPmApproved && !hasCheckedIn) {
              items.push({
                label: "Check In",
                icon: "log-in",
                onPress: () =>
                  router.push({
                    pathname: "/(private)/trade-management/trade-checkin",
                    params: { id: row.id },
                  }),
              });
            }

            if (hasCheckedIn && !hasCheckedOut) {
              items.push({
                label: "Check Out",
                icon: "log-out",
                onPress: () =>
                  router.push({
                    pathname: "/(private)/trade-management/trade-checkout",
                    params: { id: row.id },
                  }),
              });
            }

            return <AnchoredPopupMenu items={items} />;
          }}
        />
      </View>

      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push({
              pathname: "/(private)/trade-management/trade-add-edit",
              params: { mode: "create" },
            })
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}
