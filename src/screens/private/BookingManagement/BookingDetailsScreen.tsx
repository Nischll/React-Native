import { useGetBookingById } from "@/src/api/booking.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import Card from "@/src/components/ui/Card";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams();
  const id = Number(bookingId);

  const { data, isLoading } = useGetBookingById(id);
  const booking = data?.data;

  if (isLoading) return <LoadingState message="Booking details loading." />;
  if (!booking) return <EmptyState message="No booking details found." />;

  const isConfirmed = booking.status === "CONFIRMED";
  const isCancelled = booking.status === "CANCELLED";

  return (
    <View className="flex-1">
      <PageHeader
        icon="calendar"
        title="Booking Details"
        subtitle={booking.title}
        showBackButton
      />

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View
          className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl mb-4 ${
            isConfirmed
              ? "bg-green-50"
              : isCancelled
                ? "bg-red-50"
                : "bg-amber-50"
          }`}
        >
          <View
            className={`w-2.5 h-2.5 rounded-full ${
              isConfirmed
                ? "bg-green-500"
                : isCancelled
                  ? "bg-red-500"
                  : "bg-amber-500"
            }`}
          />
          <Text
            className={`font-semibold text-sm ${
              isConfirmed
                ? "text-green-700"
                : isCancelled
                  ? "text-red-600"
                  : "text-amber-600"
            }`}
          >
            {booking.status}
          </Text>
        </View>

        <Card className="p-4 mb-4">
          <SectionLabel label="Location" />
          <InfoRow>
            <InfoField label="Amenity" value={booking.amenityName} />
            <InfoField label="Tower" value={booking.towerName} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Resident" value={booking.residentName} />
            <InfoField label="Unit" value={booking.unit} />
          </InfoRow>
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel label="Schedule" />
          <InfoRow>
            <InfoField
              label="Start"
              value={formatDateTime(booking.startDate)}
            />
            <InfoField label="End" value={formatDateTime(booking.endDate)} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Description" value={booking.description} />
          </InfoRow>
        </Card>

        {booking.revenue && (
          <Card className="p-4 mb-4">
            <SectionLabel label="Revenue" />
            <InfoRow>
              <InfoField
                label="Paid"
                value={booking.revenue.isPaid ? "Yes" : "No"}
              />
              <InfoField label="Fee" value={booking.revenue.paidFee} />
            </InfoRow>
            <InfoRow>
              <InfoField
                label="Receipt #"
                value={booking.revenue.receiptNumber}
              />
              <InfoField
                label="Deposit"
                value={booking.revenue.damageDeposit}
              />
            </InfoRow>
            <InfoRow>
              <InfoField
                label="Deposit Receipt #"
                value={booking.revenue.depositReceiptNumber}
              />
              <InfoField label="Payment Type" value={booking.revenue.paidType} />
            </InfoRow>
          </Card>
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
