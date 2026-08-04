import { useGetBookingById } from "@/src/api/booking.api";
import { useGetTowers } from "@/src/api/tower.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { downloadDepositAttachment } from "@/src/helper/downloadDepositAttachment";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import {
  BookingRevenueResponse,
  BookingResponse,
  bookingStatusLabel,
  normalizeBookingStatus,
  paidTypeLabel,
} from "@/src/types/booking.types";
import { TowerResponse } from "@/src/types/tower.types";
import { extractPaginatedList } from "@/src/utils/listPagination";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

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

function pickDisplayName(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return null;
}

/** Resolve display fields from API booking + local tower/residence lookups (AML web does the same). */
function resolveBookingDisplay(
  booking: BookingResponse & Record<string, any>,
  towers: TowerResponse[],
  residences: { label: string; value: string }[],
) {
  const nestedTower = booking.tower;
  const nestedResident = booking.resident;

  const towerId =
    booking.towerId ??
    nestedTower?.id ??
    null;

  const residentId =
    booking.residentId ??
    nestedResident?.id ??
    null;

  const towerFromList = towerId
    ? towers.find((t) => Number(t.id) === Number(towerId))
    : undefined;

  const residenceFromList = residentId
    ? residences.find((r) => r.value === String(residentId))
    : undefined;

  // Residence option label is "UNIT - Resident Name"
  let unitFromResidence: string | null = null;
  let nameFromResidence: string | null = null;
  if (residenceFromList?.label) {
    const parts = residenceFromList.label.split(" - ");
    unitFromResidence = parts[0]?.trim() || null;
    nameFromResidence = parts.slice(1).join(" - ").trim() || null;
  }

  const towerName = pickDisplayName(
    booking.towerName,
    nestedTower?.name,
    towerFromList?.name,
  );

  const residentUnit = pickDisplayName(
    booking.residentUnit,
    booking.unit,
    nestedResident?.unit,
    nestedResident?.residentUnit,
    unitFromResidence,
  );

  const residentName = pickDisplayName(
    booking.residentName,
    nestedResident?.residentName,
    nestedResident?.fullName,
    nestedResident?.name,
    nestedResident?.firstName && nestedResident?.lastName
      ? `${nestedResident.firstName} ${nestedResident.lastName}`.trim()
      : null,
    nameFromResidence,
  );

  const amenityLabel = pickDisplayName(
    booking.amenityName,
    booking.amenity?.name,
    booking.title,
  );

  const buildingName = pickDisplayName(
    booking.buildingName,
    booking.building?.name,
  );

  return {
    towerName,
    residentUnit,
    residentName,
    amenityLabel,
    buildingName,
  };
}

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams();
  const id = Number(bookingId);
  const [downloadingAttachment, setDownloadingAttachment] = useState(false);

  const { data, isLoading } = useGetBookingById(id);
  const booking = data?.data as
    | (BookingResponse & Record<string, any>)
    | undefined;

  const { data: towerData } = useGetTowers(
    booking?.buildingId ? { buildingId: booking.buildingId } : {},
    !!booking,
  );
  const { items: towers } = extractPaginatedList<TowerResponse>(towerData);
  const { residences } = useResidencesForActiveBuilding();

  const display = useMemo(() => {
    if (!booking) return null;
    return resolveBookingDisplay(booking, towers, residences);
  }, [booking, towers, residences]);

  const handleDownloadDepositAttachment = async () => {
    const ref = booking?.revenue?.attachmentForDeposit?.trim();
    if (!booking?.id || !ref) {
      Alert.alert("No attachment", "No deposit attachment is available.");
      return;
    }
    setDownloadingAttachment(true);
    try {
      await downloadDepositAttachment({
        bookingId: booking.id,
        attachmentRef: ref,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to download deposit attachment.";
      Alert.alert("Download failed", String(msg));
    } finally {
      setDownloadingAttachment(false);
    }
  };

  if (isLoading) return <LoadingState message="Booking details loading." />;
  if (!booking || !display)
    return <EmptyState message="No booking details found." />;

  const status = normalizeBookingStatus(booking.status);
  const isConfirmed = status === "CONFIRM";
  const isCancelled = status === "CANCEL";
  const revenue = booking.revenue;
  const showRevenue = hasRevenueInfo(revenue);

  const unitLabel =
    display.residentUnit && display.residentName
      ? `${display.residentUnit} (${display.residentName})`
      : display.residentUnit || display.residentName;

  return (
    <View className="flex-1">
      <PageHeader
        icon="calendar"
        title="Booking Details"
        subtitle={
          display.amenityLabel || "View booking information"
        }
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
            <InfoField label="Building" value={display.buildingName} />
            <InfoField label="Amenity" value={display.amenityLabel} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Tower" value={display.towerName} />
            <InfoField label="Unit" value={unitLabel} />
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
          <InfoRow>
            <InfoField label="Unit" value={display.residentName} />
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
              <View className="mt-1">
                <InfoField
                  label="Deposit attachment"
                  value={String(revenue.attachmentForDeposit).split("/").pop()}
                />
                <Pressable
                  onPress={handleDownloadDepositAttachment}
                  disabled={downloadingAttachment}
                  className="mt-2 flex-row items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5 active:opacity-80"
                >
                  {downloadingAttachment ? (
                    <ActivityIndicator size="small" color="#7C3AED" />
                  ) : (
                    <AppIcon name="download-outline" size={18} color="#7C3AED" />
                  )}
                  <Text className="text-sm font-semibold text-primary">
                    {downloadingAttachment
                      ? "Downloading…"
                      : "Download attachment"}
                  </Text>
                </Pressable>
              </View>
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
