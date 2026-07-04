import { useGetResidentByBuildingResidenceOnly } from "@/src/api/resident.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import ErrorState from "@/src/components/feedback/ErrorState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import {
  AccessDeviceRequestPojo,
  EmergencyContactRequestPojo,
  EnterphoneRequestPojo,
  FilterRequestPojo,
  OwnerRequestPojo,
  PropertyAgentRequestPojo,
  RentalRequestPojo,
  ResidentAttachmentResponse,
  ResidentStatus,
  TenantRequestPojo,
  VehicleRequestPojo,
  VisitorPassRequestPojo,
  labelEnterphoneStatus,
  labelFobStatus,
} from "@/src/types/resident.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Linking, Text, View } from "react-native";

interface ResidentDetailsViewProps {
  residentId: number | undefined;
}

const STATUS_META: Record<
  ResidentStatus,
  { label: string; bg: string; text: string }
> = {
  OWNER: { label: "Owner", bg: "bg-primary/10", text: "text-primary" },
  TENANT: { label: "Tenant", bg: "bg-blue-50", text: "text-blue-700" },
  PROPERTY_AGENT: {
    label: "Property agent",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("default", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value?: string) {
  if (!value) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `$${num.toLocaleString()}`;
}

/** A single label/value line used throughout every detail card. */
function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null | boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  return (
    <View className="flex-row items-start justify-between py-1.5">
      <Text className="text-sm text-textSecondary pr-3">{label}</Text>
      <Text className="text-sm font-semibold text-textPrimary text-right">
        {display}
      </Text>
    </View>
  );
}

function SectionCard({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-3 overflow-hidden p-0">
      {/* Header — separated from content with its own background + border */}
      <View className="flex-row items-center gap-2.5 bg-gray-50/80 px-4 py-3 border-b border-gray-100">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary">
          <AppIcon name={icon} size={17} color="#FFFFFF" />
        </View>
        <Text className="flex-1 text-base font-bold text-textPrimary tracking-tight">
          {title}
        </Text>
        {typeof count === "number" && count > 1 && (
          <View className="min-w-[26px] items-center rounded-full bg-primary px-2 py-1">
            <Text className="text-xs font-bold text-white">{count}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="px-4 py-3">{children}</View>
    </Card>
  );
}

function Divider() {
  return <View className="h-px bg-gray-300 my-3" />;
}

export default function ResidentDetails() {
  const { residentId } = useLocalSearchParams<{ residentId: string }>();
  const parsedResidentId = residentId ? parseInt(residentId, 10) : undefined;

  const { data, isLoading, isError, refetch } =
    useGetResidentByBuildingResidenceOnly(parsedResidentId, !!parsedResidentId);

  const resident = data?.data;

  if (isLoading) {
    return (
      <View>
        <PageHeader
          icon="person"
          title="Resident Details"
          subtitle="View resident information, contacts, access devices, and related records."
          showBackButton
        />
        <View className="p-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View>
        <PageHeader
          icon="person"
          title="Resident Details"
          subtitle="View resident information, contacts, access devices, and related records."
          showBackButton
        />
        <ErrorState
          title="Couldn't load this resident"
          message="Check your connection and try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  if (!resident) {
    return (
      <View>
        <PageHeader
          icon="person"
          title="Resident Details"
          subtitle="View resident information, contacts, access devices, and related records."
          showBackButton
        />
        <EmptyState
          title="No resident found"
          message="This resident may have been removed or doesn't exist."
        />
      </View>
    );
  }
  const statusMeta = STATUS_META[resident.status];

  return (
    <View>
      {/* ── Header ── */}
      <PageHeader
        icon="person"
        title="Resident Details"
        subtitle="View resident information, contacts, access devices, and related records."
        showBackButton
      />

      <View className="bg-primary rounded-3xl p-5 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-semibold text-white/70">
              Unit {resident.unit}
            </Text>
            <Text
              className="mt-1 text-lg font-bold text-white"
              numberOfLines={2}
            >
              {resident.residentName || "Unnamed resident"}
            </Text>
            <Text className="mt-1 text-sm text-white/70" numberOfLines={2}>
              {resident.buildingName}
              {resident.buildingAddress ? ` · ${resident.buildingAddress}` : ""}
            </Text>
          </View>
          <View className={`rounded-full px-3 py-1 ${statusMeta.bg}`}>
            <Text className={`text-sm font-semibold ${statusMeta.text}`}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        {(resident.parkingStall || resident.storageLocker) && (
          <View className="flex-row gap-2 mt-4">
            {resident.parkingStall ? (
              <View className="flex-1 rounded-xl bg-white/10 px-3 py-2">
                <Text className="text-[10px] text-white/60">Parking</Text>
                <Text className="text-sm font-semibold text-white">
                  {resident.parkingStall}
                </Text>
              </View>
            ) : null}
            {resident.storageLocker ? (
              <View className="flex-1 rounded-xl bg-white/10 px-3 py-2">
                <Text className="text-[10px] text-white/60">Storage</Text>
                <Text className="text-sm font-semibold text-white">
                  {resident.storageLocker}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* ── Owners ── */}
      {!!resident.owners?.length && (
        <SectionCard
          icon="person-outline"
          title="Owners"
          count={resident.owners.length}
        >
          {resident.owners.map((owner: OwnerRequestPojo, i: number) => (
            <View key={i}>
              {i > 0 && <Divider />}
              <DetailRow label="Full name" value={owner.fullName} />
              <DetailRow label="Phone" value={owner.phoneNumber} />
              <DetailRow label="Email" value={owner.email} />
              <DetailRow
                label="Emergency assistance"
                value={owner.needsEmergencyAssistance}
              />
              <DetailRow
                label="Active from"
                value={formatDate(owner.activeFromDate)}
              />
              <DetailRow
                label="Active to"
                value={formatDate(owner.activeToDate)}
              />
            </View>
          ))}
        </SectionCard>
      )}

      {/* ── Tenants ── */}
      {!!resident.tenants?.length && (
        <SectionCard
          icon="people-outline"
          title="Tenants"
          count={resident.tenants.length}
        >
          {resident.tenants.map((tenant: TenantRequestPojo, i: number) => (
            <View key={i}>
              {i > 0 && <Divider />}
              <DetailRow label="Full name" value={tenant.fullName} />
              <DetailRow label="Phone" value={tenant.phoneNumber} />
              <DetailRow label="Email" value={tenant.email} />
              <DetailRow
                label="Form K submitted"
                value={tenant.formKSubmitted}
              />
              <DetailRow
                label="Needs emergency assistance"
                value={tenant.needsEmergencyAssistance}
              />
              <DetailRow
                label="Active from"
                value={formatDate(tenant.activeFromDate)}
              />
              <DetailRow
                label="Active to"
                value={formatDate(tenant.activeToDate)}
              />
            </View>
          ))}
        </SectionCard>
      )}

      {/* ── Property agents ── */}
      {!!resident.propertyAgents?.length && (
        <SectionCard
          icon="briefcase-outline"
          title="Property agents"
          count={resident.propertyAgents.length}
        >
          {resident.propertyAgents.map(
            (agent: PropertyAgentRequestPojo, i: number) => (
              <View key={i}>
                {i > 0 && <Divider />}
                <DetailRow label="Company" value={agent.companyName} />
                <DetailRow label="Manager" value={agent.propertyManagerName} />
                <DetailRow label="Phone" value={agent.phoneNumber} />
                <DetailRow label="Email" value={agent.email} />
              </View>
            ),
          )}
        </SectionCard>
      )}

      {/* ── Access devices / fobs ── */}
      {!!resident.accessDevices?.length && (
        <SectionCard
          icon="key-outline"
          title="Access devices"
          count={resident.accessDevices.length}
        >
          {resident.accessDevices.map(
            (device: AccessDeviceRequestPojo, i: number) => (
              <View key={i}>
                {i > 0 && <Divider />}
                <DetailRow
                  label="Type"
                  value={device.type === "KEY_TAG" ? "Key tag" : "Remote"}
                />
                <DetailRow label="Card number" value={device.cardNumber} />
                <DetailRow label="Access level" value={device.accessLevel} />
                <DetailRow label="Assigned to" value={device.assignedTo} />
                <DetailRow
                  label="Status"
                  value={labelFobStatus(device.status)}
                />
                <DetailRow
                  label="Paid amount"
                  value={formatMoney(device.paidAmount)}
                />
              </View>
            ),
          )}
        </SectionCard>
      )}

      {/* ── Vehicles ── */}
      {!!resident.vehicles?.length && (
        <SectionCard
          icon="car-outline"
          title="Vehicles"
          count={resident.vehicles.length}
        >
          {resident.vehicles.map((vehicle: VehicleRequestPojo, i: number) => (
            <View key={i}>
              {i > 0 && <Divider />}
              <DetailRow label="Plate" value={vehicle.licensePlateNumber} />
              <DetailRow label="Make and model" value={vehicle.makeAndModel} />
              <DetailRow label="Color" value={vehicle.color} />
            </View>
          ))}
        </SectionCard>
      )}

      {/* ── Visitor passes ── */}
      {!!resident.visitorPasses?.length && (
        <SectionCard
          icon="ticket-outline"
          title="Visitor passes"
          count={resident.visitorPasses.length}
        >
          {resident.visitorPasses.map(
            (pass: VisitorPassRequestPojo, i: number) => (
              <View key={i}>
                {i > 0 && <Divider />}
                <DetailRow label="Pass number" value={pass.visitorPassNumber} />
                <DetailRow
                  label="Issued"
                  value={formatDate(pass.dateOfIssue)}
                />
                <DetailRow
                  label="Status"
                  value={pass.status === "ACTIVE" ? "Active" : "Lost"}
                />
                <DetailRow
                  label="Paid amount"
                  value={formatMoney(pass.paidAmount)}
                />
              </View>
            ),
          )}
        </SectionCard>
      )}

      {/* ── Emergency contacts ── */}
      {!!resident.emergencyContacts?.length && (
        <SectionCard
          icon="medkit-outline"
          title="Emergency contacts"
          count={resident.emergencyContacts.length}
        >
          {resident.emergencyContacts.map(
            (contact: EmergencyContactRequestPojo, i: number) => (
              <View key={i}>
                {i > 0 && <Divider />}
                <DetailRow label="Name" value={contact.name} />
                <DetailRow label="Phone" value={contact.phoneNumber} />
                <DetailRow label="Relationship" value={contact.relationship} />
                <DetailRow
                  label="Consent to contact"
                  value={contact.consentToContact}
                />
              </View>
            ),
          )}
        </SectionCard>
      )}

      {/* ── Filters ── */}
      {!!resident.filters?.length && (
        <SectionCard
          icon="funnel-outline"
          title="Filters"
          count={resident.filters.length}
        >
          {resident.filters.map((filter: FilterRequestPojo, i: number) => (
            <View key={i}>
              {i > 0 && <Divider />}
              <DetailRow label="Type" value={filter.typeOfFilter} />
              <DetailRow label="Size" value={filter.size} />
              <DetailRow label="Quantity" value={String(filter.noOfFilter)} />
              <DetailRow
                label="Paid amount"
                value={formatMoney(filter.paidAmount)}
              />
            </View>
          ))}
        </SectionCard>
      )}

      {/* ── Rentals ── */}
      {!!resident.rentals?.length && (
        <SectionCard
          icon="calendar-outline"
          title="Rentals"
          count={resident.rentals.length}
        >
          {resident.rentals.map(
            (rental: RentalRequestPojo & { id?: number }, i: number) => (
              <View key={i}>
                {i > 0 && <Divider />}
                <DetailRow
                  label="For"
                  value={rental.purchaseFor?.replace(/_/g, " ")}
                />
                <DetailRow label="Start" value={formatDate(rental.startDate)} />
                <DetailRow label="End" value={formatDate(rental.endDate)} />
                <DetailRow
                  label="Payment"
                  value={
                    rental.paymentOption === "MONTHLY" ? "Monthly" : "Yearly"
                  }
                />
                <DetailRow
                  label="Status"
                  value={rental.status === "ACTIVE" ? "Active" : "Inactive"}
                />
                <DetailRow
                  label="Paid amount"
                  value={formatMoney(rental.paidAmount)}
                />
              </View>
            ),
          )}
        </SectionCard>
      )}

      {/* ── Enterphones ── */}
      {!!resident.enterphones?.length && (
        <SectionCard
          icon="call-outline"
          title="Enterphones"
          count={resident.enterphones.length}
        >
          {resident.enterphones.map(
            (phone: EnterphoneRequestPojo, i: number) => (
              <View key={i}>
                {i > 0 && <Divider />}
                <DetailRow label="Code" value={phone.code} />
                <DetailRow label="Display name" value={phone.displayName} />
                <DetailRow
                  label="Programmed number"
                  value={phone.programmedPhoneNumber}
                />
                <DetailRow
                  label="Status"
                  value={labelEnterphoneStatus(phone.status)}
                />
              </View>
            ),
          )}
        </SectionCard>
      )}

      {/* ── Documents ── */}
      {!!resident.documents?.length && (
        <SectionCard
          icon="document-outline"
          title="Documents"
          count={resident.documents.length}
        >
          {resident.documents.map(
            (doc: ResidentAttachmentResponse, i: number) => (
              <AnimatedPressable
                key={doc.id}
                onPress={() => doc.fileUrl && Linking.openURL(doc.fileUrl)}
                className={`flex-row items-center gap-3 py-2 ${
                  i > 0 ? "border-t border-gray-100" : ""
                }`}
              >
                <AppIcon
                  name="document-text-outline"
                  size={16}
                  color="#453956"
                />
                <Text
                  className="flex-1 text-sm font-medium text-textPrimary"
                  numberOfLines={1}
                >
                  {doc.title || doc.originalFileName || "Document"}
                </Text>
                <AppIcon name="open-outline" size={14} color="#B4B2A9" />
              </AnimatedPressable>
            ),
          )}
        </SectionCard>
      )}
    </View>
  );
}
