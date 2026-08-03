import {
  useDeleteGeneratorTest,
  useGetGeneratorTests,
} from "@/src/api/generatorTests.api";
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
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import MonthYearPicker from "@/src/components/ui/MonthYearPicker";
import { formatDateOnly } from "@/src/helper/formatDateTime";
import { useAuth } from "@/src/providers/AuthProvider";
import { GeneratorTestResponse } from "@/src/types/generatorTests.types";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

function monthRange(monthYm: string | null): {
  testDateFrom?: string;
  testDateTo?: string;
} {
  if (!monthYm) return {};
  const [y, m] = monthYm.split("-").map(Number);
  if (!y || !m) return {};
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0);
  return {
    testDateFrom: formatDateOnly(from),
    testDateTo: formatDateOnly(to),
  };
}

export default function GeneratorTests() {
  const { user, buildingId } = useAuth();

  const [page, setPage] = useState(1);
  const [monthFilter, setMonthFilter] = useState<string | null>(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [deleteItem, setDeleteItem] = useState<GeneratorTestResponse | null>(
    null,
  );

  const dateRange = useMemo(() => monthRange(monthFilter), [monthFilter]);

  useEffect(() => {
    setPage(1);
  }, [monthFilter, buildingId]);

  const { data, isLoading, refetch, isRefetching } = useGetGeneratorTests(
    {
      buildingId: buildingId ?? undefined,
      page,
      limit: 10,
      ...dateRange,
    },
    !!user?.userId,
  );

  const { mutate: deleteMutate, isPending: isDeleting } =
    useDeleteGeneratorTest();

  const tests = useMemo(() => {
    const raw = data?.data as any;
    if (Array.isArray(raw)) return raw as GeneratorTestResponse[];
    return (raw?.data as GeneratorTestResponse[]) ?? [];
  }, [data]);

  const total = useMemo(() => {
    const raw = data?.data as any;
    return Array.isArray(raw) ? raw.length : (raw?.total ?? tests.length);
  }, [data, tests]);

  const handleDelete = () => {
    if (!deleteItem?.id || !buildingId) return;
    deleteMutate(
      { id: deleteItem.id, buildingId },
      {
        onSuccess: () => {
          setDeleteItem(null);
          refetch();
        },
        onError: () => setDeleteItem(null),
      },
    );
  };

  const columns: MobileColumn<GeneratorTestResponse>[] = [
    {
      key: "testDate",
      label: "Test Date",
      primary: true,
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
    {
      key: "testedByDisplayName",
      label: "Created by",
    },
    {
      key: "duration",
      label: "Duration",
    },
    {
      key: "comment",
      label: "Comment",
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="flash"
        title="Generator Tests"
        subtitle="Log and review generator load-bank tests."
      />

      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push("/(private)/generator-tests/generator-add-edit" as any)
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View className="flex-row items-end gap-2 mb-3 px-1">
        <View className="flex-1">
          <MonthYearPicker
            value={monthFilter ?? ""}
            onChange={(v) => setMonthFilter(v || null)}
            variant="light"
          />
        </View>
        {monthFilter ? (
          <Pressable
            onPress={() => setMonthFilter(null)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 mb-0.5"
          >
            <Text className="text-xs font-semibold text-slate-600">
              All months
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-1">
        <MobileDataList<GeneratorTestResponse>
          data={tests}
          columns={columns}
          loading={isLoading}
          refreshing={isRefetching}
          backendMode
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No generator tests found"
          onRefresh={refetch}
          pagination={{
            page,
            pageSize: 10,
            total,
            hasMore: page * 10 < total,
            onPageChange: setPage,
          }}
          renderActions={(row) => {
            const items: MenuItem[] = [
              {
                label: "View Details",
                icon: "eye",
                onPress: () =>
                  router.push({
                    pathname:
                      "/(private)/generator-tests/generator-details" as any,
                    params: { testId: row.id },
                  }),
              },
              {
                label: "Edit",
                icon: "pencil",
                onPress: () =>
                  router.push({
                    pathname:
                      "/(private)/generator-tests/generator-add-edit" as any,
                    params: { testId: row.id },
                  }),
              },
              {
                label: "Delete",
                icon: "trash",
                danger: true,
                onPress: () => setDeleteItem(row),
              },
            ];

            return <AnchoredPopupMenu items={items} />;
          }}
        />
      </View>

      <ConfirmModal
        visible={!!deleteItem}
        title="Delete Generator Test"
        message={`Are you sure you want to delete the test from "${
          deleteItem ? new Date(deleteItem.testDate).toLocaleDateString() : ""
        }"?`}
        confirmText="Delete"
        destructive
        loading={isDeleting}
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
