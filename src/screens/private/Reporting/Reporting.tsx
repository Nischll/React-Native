import {
  fetchMonthlyReportPdf,
  useGetMonthlyReport,
} from "@/src/api/reporting.api";
import MonthlyReportPdfSheet from "@/src/components/domain/MonthlyReportPdfSheet";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { PickedFile } from "@/src/components/ui/FilePicker";
import MonthYearPicker from "@/src/components/ui/MonthYearPicker";
import { saveMonthlyReportPdfOptions } from "@/src/helper/reportSignatures";
import {
  saveAndSharePdf,
  waitForModalDismiss,
} from "@/src/helper/savePdfFile";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  MonthlyReportPdfOptions,
  MonthlyReportResponse,
} from "@/src/types/reporting.types";
import { PAGE_SIZE } from "@/src/utils/listPagination";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

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

function Bone({ className }: { className: string }) {
  return <View className={`rounded bg-gray-200 ${className}`} />;
}

function ReportingSkeleton() {
  return (
    <View className="mt-3">
      <Bone className="h-4 w-20 mb-2 mx-1" />
      <View className="flex-row flex-wrap -mx-1 mb-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} className="w-1/2 p-1">
            <View className="rounded-xl border border-slate-200 bg-white px-3 py-3 items-center">
              <Bone className="h-3 w-16" />
              <Bone className="h-6 w-10 mt-2" />
            </View>
          </View>
        ))}
      </View>

      <Card className="p-4 mb-3">
        <Bone className="h-5 w-24 mb-3" />
        <Bone className="h-4 w-full mb-2" />
        <Bone className="h-4 w-5/6 mb-2" />
        <Bone className="h-4 w-2/3" />
      </Card>

      {Array.from({ length: 7 }).map((_, i) => (
        <Card key={i} className="mb-3 overflow-hidden">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Bone className="h-5 w-2/3" />
            <Bone className="h-5 w-5 rounded-full" />
          </View>
        </Card>
      ))}
    </View>
  );
}

function ReportRow({ row }: { row: unknown }) {
  if (typeof row !== "object" || row === null) {
    return (
      <Text className="text-xs text-textPrimary py-2 border-b border-slate-50">
        {formatCell(row)}
      </Text>
    );
  }
  const entries = Object.entries(row as Record<string, unknown>).slice(0, 6);
  return (
    <View className="py-2.5 border-b border-slate-50">
      {entries.map(([k, v]) => (
        <View key={k} className="flex-row justify-between gap-2 py-0.5">
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
}

function ReportSection({
  title,
  rows,
}: {
  title: string;
  rows: unknown[];
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = open
    ? rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : [];
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, total);

  const toggle = () => {
    setOpen((wasOpen) => {
      if (wasOpen) return false;
      setPage(1);
      return true;
    });
  };

  return (
    <Card className="mb-3 overflow-hidden">
      <Pressable
        onPress={toggle}
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
          {total === 0 ? (
            <Text className="text-sm text-textSecondary py-3">
              No rows for this period.
            </Text>
          ) : (
            <>
              {pageRows.map((row, idx) => (
                <ReportRow key={`${currentPage}-${idx}`} row={row} />
              ))}
              {total > PAGE_SIZE ? (
                <View className="mt-3 flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <Pressable
                    disabled={!canGoPrev}
                    onPress={() => setPage(Math.max(1, currentPage - 1))}
                    className={`flex-row items-center gap-1 rounded-xl px-3 py-2 ${
                      canGoPrev ? "bg-primary/10" : "bg-slate-100 opacity-50"
                    }`}
                  >
                    <AppIcon
                      name="chevron-back"
                      size={16}
                      color={canGoPrev ? "#453956" : "#94A3B8"}
                    />
                    <Text
                      className={`text-sm font-semibold ${
                        canGoPrev ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      Prev
                    </Text>
                  </Pressable>
                  <View className="flex-1 items-center px-1">
                    <Text
                      className="text-sm font-semibold text-textPrimary"
                      numberOfLines={1}
                    >
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Text
                      className="text-[11px] text-textSecondary mt-0.5"
                      numberOfLines={1}
                    >
                      {rangeStart}–{rangeEnd} of {total}
                    </Text>
                  </View>
                  <Pressable
                    disabled={!canGoNext}
                    onPress={() => setPage(currentPage + 1)}
                    className={`flex-row items-center gap-1 rounded-xl px-3 py-2 ${
                      canGoNext ? "bg-primary/10" : "bg-slate-100 opacity-50"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        canGoNext ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      Next
                    </Text>
                    <AppIcon
                      name="chevron-forward"
                      size={16}
                      color={canGoNext ? "#453956" : "#94A3B8"}
                    />
                  </Pressable>
                </View>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </Card>
  );
}

export default function Reporting() {
  const { buildingId, selectedBuilding } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
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

  const handleDownloadPdf = async (
    options: MonthlyReportPdfOptions,
    logo: PickedFile | null,
  ) => {
    if (!buildingId || !month || !/^\d{4}-\d{2}$/.test(month)) {
      Alert.alert(
        "Select month",
        "Choose a calendar month and building first.",
      );
      return;
    }
    setDownloading(true);
    try {
      const base64 = await fetchMonthlyReportPdf(
        month,
        buildingId,
        options,
        logo,
      );
      await saveAndSharePdf(`monthly-report-${month}.pdf`, base64);
      setSheetVisible(false);
      await waitForModalDismiss();
    } catch (e) {
      const message =
        e instanceof Error && e.message
          ? e.message
          : "Failed to download the report PDF.";
      Alert.alert("Error", message);
    } finally {
      setDownloading(false);
    }
  };

  const openDownloadSheet = () => {
    if (!buildingId || !month || !/^\d{4}-\d{2}$/.test(month)) {
      Alert.alert(
        "Select month",
        "Choose a calendar month and building first.",
      );
      return;
    }
    setSheetVisible(true);
  };

  const handleConfirmDownload = async (
    options: MonthlyReportPdfOptions,
    logo: PickedFile | null,
  ) => {
    await saveMonthlyReportPdfOptions(options);
    await handleDownloadPdf(options, logo);
  };

  return (
    <>
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
          <MonthYearPicker value={month} onChange={setMonth} variant="light" />
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
        onPress={openDownloadSheet}
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
        <ReportingSkeleton />
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
    {buildingId ? (
      <MonthlyReportPdfSheet
        visible={sheetVisible}
        month={month}
        buildingId={buildingId}
        loading={downloading}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleConfirmDownload}
      />
    ) : null}
    </>
  );
}
