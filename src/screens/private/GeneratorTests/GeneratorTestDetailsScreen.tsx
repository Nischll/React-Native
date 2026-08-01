import { useGetGeneratorTestById } from "@/src/api/generatorTests.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { GENERATOR_CHECK_FIELDS } from "@/src/types/generatorTests.types";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

export default function GeneratorTestDetailsScreen() {
  const { testId } = useLocalSearchParams();
  const id = Number(testId);

  const { data, isLoading } = useGetGeneratorTestById(id);
  const test = data?.data;

  if (isLoading) return <LoadingState message="Generator test loading." />;
  if (!test) return <EmptyState message="No generator test details found." />;

  return (
    <View className="flex-1">
      <PageHeader
        icon="flash"
        title="Generator Test Details"
        subtitle={formatDateTime(test.testDate)}
        showBackButton
      />

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Card className="p-4 mb-4">
          <SectionLabel label="Inspection Checks" />
          {GENERATOR_CHECK_FIELDS.map((field) => {
            const done = !!(test as any)[field.key];
            return (
              <View
                key={field.key}
                className="flex-row items-center justify-between py-1.5"
              >
                <Text className="text-sm text-gray-700">{field.label}</Text>
                <AppIcon
                  name={done ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={done ? "#16a34a" : "#d1d5db"}
                />
              </View>
            );
          })}
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel label="Readings" />
          <InfoRow>
            <InfoField label="Fuel Level" value={test.fuelLevel} />
            <InfoField label="Battery Fluid" value={test.batteryFluidLevel} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Hour Meter (Before)" value={test.hourMeterReading} />
            <InfoField
              label="Hour Meter (After)"
              value={test.hourMeterReadingAfterTest}
            />
          </InfoRow>
          <InfoRow>
            <InfoField label="Oil Pressure" value={test.oilPressure} />
            <InfoField label="Coolant Temp" value={test.coolantTemperature} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Voltage" value={test.voltage} />
            <InfoField label="Amps" value={test.amps} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Frequency" value={test.frequency} />
            <InfoField label="Duration" value={test.duration} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Damper Operation" value={test.damperOperation} />
          </InfoRow>
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel label="Notes" />
          <InfoRow>
            <InfoField label="Miscellaneous" value={test.miscellaneous} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Comment" value={test.comment} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Tested By" value={test.testedByDisplayName} />
          </InfoRow>
        </Card>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
      {label}
    </Text>
  );
}

function InfoRow({ children }: { children: React.ReactNode }) {
  return <View className="flex-row mb-3 last:mb-0">{children}</View>;
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-1 pr-3">
      <Text className="text-xs text-gray-400 mb-0.5">{label}</Text>
      <Text className="text-sm font-medium text-gray-800">
        {value && String(value).trim() ? value : "—"}
      </Text>
    </View>
  );
}
