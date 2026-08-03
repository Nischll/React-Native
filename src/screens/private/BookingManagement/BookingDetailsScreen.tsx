import { useGetBookingById } from "@/src/api/booking.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import Card from "@/src/components/ui/Card";
import { formatDateTime } from "@/src/helper/formatDateTime";
import {
  BookingRevenueResponse,
  bookingStatusLabel,
  normalizeBookingStatus,
  paidTypeLabel,
} from "@/src/types/booking.types";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

function hasRevenueInfo(revenue?: BookingRevenueResponse | null): boolean {
  if (!revenue || typeof revenue !== "object") return false;
  if (revenue.isPaid === true) return true;
  return Object.entries(revenue).some(
    ([key, value]) =>
      key !== "isPaid" &&
      key !== "id" &&
      key !== "bookingId" &&
      value != null &&
      value !== "" &&
      value !== "NONE",
  );
}

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams();
  const id = Number(bookingId);

  const { data, isLoading } = useGetBookingById(id);
  const booking = data?.data;

  if (isLoading) return <LoadingState message="Booking details loading." />;
  if (!booking) return <EmptyState message="No booking details found." />;

  const status = normalizeBookingStatus(booking.status);
  const isConfirmed = status === "CONFIRM";
  const isCancelled = status === "CANCEL";
  const revenue = booking.revenue;
  const showRevenue = hasRevenueInfo(revenue);
  const unit =
    booking.residentUnit ||
    booking.unit ||
    null;
  const amenityLabel =
    booking.amenityName || booking.title || "—";

  return (
    <View className="flex-1">
      <PageHeader
        icon="calendar"
        title="Booking Details"
        subtitle={amenityLabel !== "—" ? amenityLabel : "View booking information"}
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
            {bookingStatusLabel(booking.status)}
          </Text>
        </View>

        <Card className="p-4 mb-4">
          <SectionLabel label="Booking details" />
          <InfoRow>
            <InfoField label="Building" value={booking.buildingName} />
            <InfoField label="Amenity" value={amenityLabel} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Tower" value={booking.towerName} />
            <InfoField
              label="Unit"
              value={
                unit && booking.residentName
                  ? `${unit} (${booking.residentName})`
                  : unit || booking.residentName
              }
            />
          </InfoRow>
          {booking.amenityDescription ? (
            <InfoRow>
              <InfoField
                label="Amenity description"
                value={booking.amenityDescription}
              />
            </InfoRow>
          ) : null}
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

        {showRevenue && revenue ? (
          <Card className="p-4 mb-4">
            <SectionLabel label="Revenue information" />
            <InfoRow>
              <InfoField
                label="Paid"
                value={revenue.isPaid ? "Yes" : "No"}
              />
              <InfoField
                label="Deposit status"
                value={revenue.depositAmountStatus}
              />
            </InfoRow>

            <Text className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-2 mt-1">
              Non-refundable fee
            </Text>
            <InfoRow>
              <InfoField label="Fee amount" value={revenue.paidFee} />
              <InfoField label="Receipt number" value={revenue.receiptNumber} />
            </InfoRow>
            <InfoRow>
              <InfoField
                label="Payment type"
                value={paidTypeLabel(revenue.paidType)}
              />
            </InfoRow>

            <Text className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-2 mt-2">
              Refundable — deposit
            </Text>
            <InfoRow>
              <InfoField label="Deposit amount" value={revenue.damageDeposit} />
              <InfoField
                label="Deposit receipt number"
                value={revenue.depositReceiptNumber}
              />
            </InfoRow>
            <InfoRow>
              <InfoField
                label="Deposit payment type"
                value={paidTypeLabel(revenue.damageDepositPaidType)}
              />
              <InfoField label="Refunded by" value={revenue.refundedBy} />
            </InfoRow>

            <InfoRow>
              <InfoField label="Pre-inspection" value={revenue.preInspection} />
              <InfoField
                label="Post-inspection"
                value={revenue.postInspection}
              />
            </InfoRow>
            <InfoRow>
              <InfoField label="Revenue notes" value={revenue.description} />
            </InfoRow>
            {revenue.attachmentForDeposit ? (
              <InfoRow>
                <InfoField
                  label="Deposit attachment"
                  value={revenue.attachmentForDeposit}
                />
              </InfoRow>
            ) : null}
          </Card>
        ) : null}

        <AppButton
          onPress={() =>
            router.push({
              pathname: "/(private)/booking-management/booking-add-edit",
              params: { bookingId: String(booking.id) },
            })
          }
          leftIcon="pencil-outline"
        >
          Edit Booking
        </AppButton>
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

function InfoField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <View className="flex-1 pr-3">
      <Text className="text-xs text-gray-400 mb-0.5">{label}</Text>
      <Text className="text-sm font-medium text-gray-800">
        {value && String(value).trim() && String(value).trim() !== "—"
          ? value
          : "—"}
      </Text>
    </View>
  );
}
