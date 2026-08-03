import { fetchMonthlyReportPdf, useGetMonthlyReport } from "@/src/api/reporting.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import MonthYearPicker from "@/src/components/ui/MonthYearPicker";
import { useAuth } from "@/src/providers/AuthProvider";
import { MonthlyReportResponse } from "@/src/types/reporting.types";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

function countOf(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <View className="w-1/2 p-1">
      <View className="rounded-xl border border-slate-200 bg-white px-3 py-3 items-center">
        <Text className="text-[11px] text-textSecondary text-center">
          {label}
        </Text>
        <Text className="text-xl font-bold text-textPrimary mt-1">{value}</Text>
      </View>
    </View>
  );
}

function ReportSection({
  title,
  rows,
  defaultOpen = false,
}: {
  title: string;
  rows: unknown[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const preview = rows.slice(0, 30);

  return (
    <Card className="mb-3 overflow-hidden">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <Text className="text-base font-bold text-textPrimary flex-1">
          {title}
          <Text className="text-sm font-normal text-textSecondary">
            {" "}
            ({rows.length})
          </Text>
        </Text>
        <AppIcon
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#64748B"
        />
      </Pressable>
      {open ? (
        <View className="px-4 pb-3 border-t border-slate-100">
          {rows.length === 0 ? (
            <Text className="text-sm text-textSecondary py-3">
              No rows for this period.
            </Text>
          ) : (
            preview.map((row, idx) => {
              if (typeof row !== "object" || row === null) {
                return (
                  <Text
                    key={idx}
                    className="text-xs text-textPrimary py-2 border-b border-slate-50"
                  >
                    {formatCell(row)}
                  </Text>
                );
              }
              const entries = Object.entries(row as Record<string, unknown>).slice(
                0,
                6,
              );
              return (
                <View
                  key={idx}
                  className="py-2.5 border-b border-slate-50"
                >
                  {entries.map(([k, v]) => (
                    <View
                      key={k}
                      className="flex-row justify-between gap-2 py-0.5"
                    >
                      <Text className="text-[11px] text-textSecondary flex-shrink-0">
                        {k}
                      </Text>
                      <Text
                        className="text-[11px] font-medium text-textPrimary flex-1 text-right"
                        numberOfLines={2}
                      >
                        {formatCell(v)}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })
          )}
          {rows.length > preview.length ? (
            <Text className="text-[11px] text-textSecondary mt-2">
              Showing {preview.length} of {rows.length}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function Reporting() {
  const { buildingId, selectedBuilding } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data, isLoading, refetch, isRefetching } = useGetMonthlyReport(
    month,
    buildingId ?? undefined,
    !!buildingId,
  );
  const report: MonthlyReportResponse = data?.data ?? {};
  const revenue = report.revenueSummary;

  const summary = useMemo(
    () => ({
      tasks: countOf(report.tasks),
      bookings: countOf(report.bookings),
      purchases: countOf(report.purchaseRecords),
      parcels: countOf(report.parcelLogs),
      visitorPasses: countOf(report.visitorPassLogs),
      visitorParking: countOf(report.visitorParkingLogs),
      trade: countOf(report.tradeServiceLogs),
    }),
    [report],
  );

  const handleDownloadPdf = async () => {
    if (!buildingId) return;
    setDownloading(true);
    try {
      const response = await fetchMonthlyReportPdf(month, buildingId);
      const base64 = Buffer.from(response.data as ArrayBuffer).toString(
        "base64",
      );
      const fileName = `monthly-report-${month}.pdf`;

      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          Alert.alert(
            "Permission required",
            "Please allow access to save files.",
          );
          return;
        }
        const fileUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            "application/pdf",
          );
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        Alert.alert("Downloaded", `${fileName} saved successfully.`);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: `Save ${fileName}`,
        });
      }
    } catch {
      Alert.alert("Error", "Failed to download the report PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <PageHeader
        showBackButton
        icon="stats-chart"
        title="Monthly Reporting"
        subtitle={
          selectedBuilding?.label
            ? `Operational summary · ${selectedBuilding.label.split("(")[0]?.trim()}`
            : "Operational summary for the selected month."
        }
      />

      <View className="flex-row items-end gap-2 mb-3">
        <View className="flex-1">
          <MonthYearPicker value={month} onChange={setMonth} />
        </View>
        <AppButton
          variant="outline"
          size="md"
          fullWidth={false}
          loading={isRefetching}
          onPress={() => refetch()}
          disabled={!buildingId}
        >
          Refresh
        </AppButton>
      </View>

      <AppButton
        leftIcon="download-outline"
        onPress={handleDownloadPdf}
        loading={downloading}
        disabled={!buildingId}
      >
        Download PDF Report
      </AppButton>

      {!buildingId ? (
        <Text className="text-sm text-textSecondary mt-4 px-1">
          Select a building to view the monthly report.
        </Text>
      ) : isLoading ? (
        <LoadingState message="Loading report..." />
      ) : (
        <View className="mt-3">
          <Text className="text-sm font-semibold text-textPrimary mb-2 px-1">
            Summary
          </Text>
          <View className="flex-row flex-wrap -mx-1 mb-3">
            <Kpi label="Tasks" value={summary.tasks} />
            <Kpi label="Bookings" value={summary.bookings} />
            <Kpi label="Purchases" value={summary.purchases} />
            <Kpi label="Parcels" value={summary.parcels} />
            <Kpi label="Visitor passes" value={summary.visitorPasses} />
            <Kpi label="Visitor parking" value={summary.visitorParking} />
            <Kpi label="Trade visits" value={summary.trade} />
          </View>

          <Card className="p-4 mb-3">
            <Text className="text-base font-bold text-textPrimary mb-2">
              Revenue
            </Text>
            <View className="flex-row justify-between py-1">
              <Text className="text-sm text-textSecondary">Total</Text>
              <Text className="text-sm font-semibold text-textPrimary">
                {revenue?.total != null ? `$${revenue.total}` : "—"}
              </Text>
            </View>
            {revenue?.breakdownByType &&
              Object.entries(revenue.breakdownByType).map(([type, amount]) => (
                <View key={type} className="flex-row justify-between py-1">
                  <Text className="text-sm text-textSecondary">{type}</Text>
                  <Text className="text-sm font-semibold text-textPrimary">
                    ${amount}
                  </Text>
                </View>
              ))}
          </Card>

          <ReportSection title="Tasks" rows={(report.tasks as unknown[]) ?? []} />
          <ReportSection
            title="Bookings"
            rows={(report.bookings as unknown[]) ?? []}
          />
          <ReportSection
            title="Purchase records"
            rows={(report.purchaseRecords as unknown[]) ?? []}
          />
          <ReportSection
            title="Parcels"
            rows={(report.parcelLogs as unknown[]) ?? []}
          />
          <ReportSection
            title="Visitor passes"
            rows={(report.visitorPassLogs as unknown[]) ?? []}
          />
          <ReportSection
            title="Visitor parking"
            rows={(report.visitorParkingLogs as unknown[]) ?? []}
          />
          <ReportSection
            title="Trade visits"
            rows={(report.tradeServiceLogs as unknown[]) ?? []}
          />
        </View>
      )}
    </ScrollView>
  );
}
