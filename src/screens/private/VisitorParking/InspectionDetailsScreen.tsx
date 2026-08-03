import {
  useCheckOutVisitorParkingInspection,
  useGetVisitorParkingInspectionById,
} from "@/src/api/visitorParking.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import Card from "@/src/components/ui/Card";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

export default function InspectionDetailsScreen() {
  const { inspectionId } = useLocalSearchParams();
  const id = Number(inspectionId);

  const { data, isLoading, refetch } = useGetVisitorParkingInspectionById(id);
  const { mutate: checkOutMutate, isPending: isCheckingOut } =
    useCheckOutVisitorParkingInspection();

  const inspection = data?.data;

  if (isLoading) return <LoadingState message="Inspection details loading." />;
  if (!inspection) return <EmptyState message="No inspection details found." />;

  const checkedOut = !!inspection.checkOutAt;

  return (
    <View className="flex-1">
      <PageHeader
        icon="car"
        title="Inspection Details"
        subtitle={inspection.licensePlate}
        showBackButton
      />

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View
          className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl mb-4 ${
            checkedOut ? "bg-green-50" : "bg-amber-50"
          }`}
        >
          <View
            className={`w-2.5 h-2.5 rounded-full ${
              checkedOut ? "bg-green-500" : "bg-amber-500"
            }`}
          />
          <Text
            className={`font-semibold text-sm ${
              checkedOut ? "text-green-700" : "text-amber-600"
            }`}
          >
            {checkedOut ? "Checked Out" : "Currently Parked"}
          </Text>
        </View>

        <Card className="p-4 mb-4">
          <SectionLabel label="Vehicle" />
          <InfoRow>
            <InfoField label="License Plate" value={inspection.licensePlate} />
            <InfoField label="Stall" value={inspection.stallIdentifier} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Make" value={inspection.vehicleMake} />
            <InfoField label="Model" value={inspection.vehicleModel} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Color" value={inspection.vehicleColor} />
            <InfoField label="Pass Number" value={inspection.passNumberDisplay} />
          </InfoRow>
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel label="Timing" />
          <InfoRow>
            <InfoField
              label="Check-In"
              value={inspection.checkInAt ? formatDateTime(inspection.checkInAt) : undefined}
            />
            <InfoField
              label="Check-Out"
              value={
                inspection.checkOutAt
                  ? formatDateTime(inspection.checkOutAt)
                  : undefined
              }
            />
          </InfoRow>
          <InfoRow>
            <InfoField label="Period of Day" value={inspection.periodOfDay} />
            <InfoField
              label="Unit"
              value={inspection.residentName ?? inspection.registeredVehicleResidentName}
            />
          </InfoRow>
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel label="Enforcement" />
          <InfoRow>
            <InfoField
              label="Tow Status"
              value={inspection.towWorkflowStatus}
            />
            <InfoField
              label="Bylaw Notice"
              value={inspection.bylawNoticeIssued ? "Issued" : "No"}
            />
          </InfoRow>
          <InfoRow>
            <InfoField
              label="Violation Slip"
              value={inspection.violationSlipIssued ? "Issued" : "No"}
            />
          </InfoRow>
          <InfoRow>
            <InfoField label="Violation Notes" value={inspection.violationNotes} />
          </InfoRow>
        </Card>

        {!checkedOut && (
          <AppButton
            loading={isCheckingOut}
            onPress={() =>
              checkOutMutate(
                { pathVars: { id: inspection.id } },
                { onSuccess: () => refetch() },
              )
            }
          >
            Check Out Vehicle
          </AppButton>
        )}
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
