import { useGetParcelById } from "@/src/api/parcelManagement.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import Card from "@/src/components/ui/Card";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { renderSignature } from "@/src/helper/renderSignature";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import Svg from "react-native-svg";

export default function ParcelDetailsScreen() {
  const { parcelId } = useLocalSearchParams();
  const id = Number(parcelId);

  const { data, isLoading } = useGetParcelById(id);
  const parcel = data?.data;

  if (isLoading) return <LoadingState message="Parcel details loading." />;
  if (!parcel) return <EmptyState message="No Parcel details found." />;

  const isDelivered = parcel.status === "DELIVERED";

  return (
    <View className="flex-1">
      <PageHeader
        icon="cube"
        title="Parcel Details"
        subtitle={`Tracking: ${parcel.trackingId}`}
        showBackButton
      />

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* STATUS BANNER */}
        <View
          className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl mb-4 ${
            isDelivered ? "bg-green-50" : "bg-blue-50"
          }`}
        >
          <View
            className={`w-2.5 h-2.5 rounded-full ${
              isDelivered ? "bg-green-500" : "bg-blue-500"
            }`}
          />
          <Text
            className={`font-semibold text-sm ${
              isDelivered ? "text-green-700" : "text-blue-600"
            }`}
          >
            {isDelivered ? "Delivered" : parcel.status}
          </Text>
        </View>

        {/* RECIPIENT */}
        <Card className="p-4 mb-4">
          <SectionLabel label="Recipient" />
          <InfoRow>
            <InfoField label="Name" value={parcel.residentName} />
            <InfoField label="Unit" value={parcel.unit} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Phone" value={parcel.phone} />
            <InfoField label="Email" value={parcel.recipientEmail} />
          </InfoRow>
        </Card>

        {/* PACKAGE */}
        <Card className="p-4 mb-4">
          <SectionLabel label="Package Info" />
          <InfoRow>
            <InfoField label="Courier" value={parcel.courier} />
            <InfoField label="Type" value={parcel.packageType} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Size" value={parcel.size} />
            <InfoField label="Condition" value={parcel.condition} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Location" value={parcel.location} />
          </InfoRow>
        </Card>

        {/* TIMELINE */}
        <Card className="p-4 mb-4">
          <SectionLabel label="Timeline" />
          <InfoRow>
            <InfoField
              label="Received At"
              value={formatDateTime(parcel.receivedTime)}
            />
            <InfoField label="Received By" value={parcel.receivedByName} />
          </InfoRow>
          {isDelivered && (
            <InfoRow>
              <InfoField label="Released By" value={parcel.releasedByName} />
              <InfoField
                label="Picked Up At"
                value={formatDateTime(parcel.pickupTimestamp)}
              />
            </InfoRow>
          )}
        </Card>

        {/* SIGNATURE */}
        {parcel.recipientSignature && (
          <Card className="p-4 mb-4">
            <SectionLabel label="Recipient Signature" />
            <View className="bg-gray-50 rounded-xl p-2 mt-1">
              <Svg height={150} width="100%">
                {renderSignature(parcel.recipientSignature)}
              </Svg>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/* ---- helpers ---- */

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
