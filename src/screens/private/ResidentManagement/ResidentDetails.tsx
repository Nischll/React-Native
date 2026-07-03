import { useGetResidentByBuildingResidenceOnly } from "@/src/api/resident.api";
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
      <Text className="text-xs text-textSecondary flex-1 pr-3">{label}</Text>
      <Text className="text-xs font-semibold text-textPrimary flex-1 text-right">
        {display}
      </Text>
    </View>
  );
}

/** Card wrapper for a repeating section; renders nothing if there's no data. */
function SectionCard({
  icon,
  title,
  count,
  children,
}: {
  icon: string;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4 mb-3">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <AppIcon name={icon} size={16} color="#453956" />
        </View>
        <Text className="text-sm font-semibold text-textPrimary flex-1">
          {title}
        </Text>
        {typeof count === "number" && count > 1 && (
          <View className="rounded-full bg-gray-100 px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-textSecondary">
              {count}
            </Text>
          </View>
        )}
      </View>
      {children}
    </Card>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100 my-2" />;
}

export default function ResidentDetails() {
  const { residentId } = useLocalSearchParams<{ residentId: string }>();
  const parsedResidentId = residentId ? parseInt(residentId, 10) : undefined;

  const { data, isLoading, isError, refetch } =
    useGetResidentByBuildingResidenceOnly(parsedResidentId, !!parsedResidentId);

  const resident = data?.data;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <AppIcon name="hourglass-outline" size={28} color="#B4B2A9" />
        <Text className="mt-3 text-sm text-textSecondary">
          Loading resident details...
        </Text>
      </View>
    );
  }

  if (isError || !resident) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-8">
        <AppIcon name="alert-circle-outline" size={28} color="#D85A30" />
        <Text className="mt-3 text-sm font-semibold text-textPrimary text-center">
          Couldn't load this resident
        </Text>
        <Text className="mt-1 text-xs text-textSecondary text-center">
          Check your connection and try again.
        </Text>
        <AnimatedPressable
          onPress={() => refetch()}
          className="mt-4 rounded-xl bg-primary px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">Retry</Text>
        </AnimatedPressable>
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
            <Text className="text-xs font-semibold text-white/70">
              Unit {resident.unit}
            </Text>
            <Text
              className="mt-1 text-lg font-bold text-white"
              numberOfLines={2}
            >
              {resident.residentName || "Unnamed resident"}
            </Text>
            <Text className="mt-1 text-xs text-white/70" numberOfLines={2}>
              {resident.buildingName}
              {resident.buildingAddress ? ` · ${resident.buildingAddress}` : ""}
            </Text>
          </View>
          <View className={`rounded-full px-3 py-1 ${statusMeta.bg}`}>
            <Text className={`text-xs font-semibold ${statusMeta.text}`}>
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
                label="Needs emergency assistance"
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
                  className="flex-1 text-xs font-medium text-textPrimary"
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
