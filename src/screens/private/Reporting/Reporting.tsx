import { fetchMonthlyReportPdf, useGetMonthlyReport } from "@/src/api/reporting.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import Card from "@/src/components/ui/Card";
import MonthYearPicker from "@/src/components/ui/MonthYearPicker";
import { useAuth } from "@/src/providers/AuthProvider";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 mb-3">
      <Text className="text-base font-bold text-textPrimary mb-2">{title}</Text>
      {children}
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: any }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-textSecondary">{label}</Text>
      <Text className="text-sm font-semibold text-textPrimary">{value ?? "—"}</Text>
    </View>
  );
}

function countOf(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

export default function Reporting() {
  const { buildingId } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data, isLoading } = useGetMonthlyReport(month, buildingId ?? undefined, !!buildingId);
  const report = data?.data ?? {};
  const revenue = report.revenueSummary;

  const handleDownloadPdf = async () => {
    if (!buildingId) return;
    setDownloading(true);
    try {
      const response = await fetchMonthlyReportPdf(month, buildingId);
      const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");
      const fileName = `monthly-report-${month}.pdf`;

      if (Platform.OS === "android") {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          Alert.alert("Permission required", "Please allow access to save files.");
          return;
        }
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/pdf",
        );
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        Alert.alert("Downloaded", `${fileName} saved successfully.`);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(fileUri, { mimeType: "application/pdf", dialogTitle: `Save ${fileName}` });
      }
    } catch (e) {
      Alert.alert("Error", "Failed to download the report PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
      <PageHeader showBackButton icon="stats-chart" title="Monthly Reporting" subtitle="Operational summary for the selected month." />
      <View className="flex-row items-end gap-2 mb-3">
        <View className="flex-1">
          <MonthYearPicker value={month} onChange={setMonth} />
        </View>
      </View>
      <AppButton leftIcon="download-outline" onPress={handleDownloadPdf} loading={downloading} disabled={!buildingId}>
        Download PDF Report
      </AppButton>
      {isLoading ? (
        <LoadingState message="Loading report..." />
      ) : (
        <View className="mt-3">
          <Section title="Summary">
            <Row label="Tasks" value={countOf(report.tasks)} />
            <Row label="Bookings" value={countOf(report.bookings)} />
            <Row label="Parcels" value={countOf(report.parcelLogs)} />
            <Row label="Trade Services" value={countOf(report.tradeServiceLogs)} />
            <Row label="Residents" value={countOf(report.residents)} />
          </Section>
          <Section title="Revenue">
            <Row label="Total" value={revenue?.total != null ? `$${revenue.total}` : undefined} />
            {revenue?.breakdownByType &&
              Object.entries(revenue.breakdownByType).map(([type, amount]) => (
                <Row key={type} label={type} value={`$${amount}`} />
              ))}
          </Section>
          <Section title="Purchases & Passes">
            <Row label="Purchase Records" value={countOf(report.purchaseRecords)} />
            <Row label="Visitor Passes" value={countOf(report.visitorPassLogs)} />
            <Row label="Visitor Parking" value={countOf(report.visitorParkingLogs)} />
          </Section>
        </View>
      )}
    </ScrollView>
  );
}
