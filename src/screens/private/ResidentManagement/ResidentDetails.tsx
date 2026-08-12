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
import { hasAccessDeviceOwnerApproval } from "@/src/helper/accessDeviceFormData";
import { hasTenantFormK } from "@/src/helper/tenantFormData";
import {
  viewAccessDeviceOwnerApproval,
  viewTenantFormK,
} from "@/src/helper/viewResidentAttachment";
import { showToast } from "@/src/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

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

function Divider() {
  return <View className="h-px bg-gray-200 my-2" />;
}

function FileLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      className="mt-1 flex-row items-center gap-2 rounded-xl bg-primary/10 px-3 py-2"
    >
      <AppIcon name="document-text-outline" size={16} color="#453956" />
      <Text className="flex-1 text-sm font-semibold text-primary">{label}</Text>
      <AppIcon name="open-outline" size={14} color="#453956" />
    </AnimatedPressable>
  );
}

function ExpandableSection({
  sectionKey,
  openKey,
  setOpenKey,
  icon,
  title,
  count,
  accentColor = "#453956",
  children,
}: {
  sectionKey: string;
  openKey: string | null;
  setOpenKey: (key: string | null) => void;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  count?: number;
  accentColor?: string;
  children: React.ReactNode;
}) {
  const expanded = openKey === sectionKey;
  const subtitle =
    typeof count === "number"
      ? `${count} record${count === 1 ? "" : "s"}`
      : undefined;

  return (
    <Card className="mb-3 overflow-hidden px-0 py-0">
      <Pressable
        onPress={() => setOpenKey(expanded ? null : sectionKey)}
        className="flex-row items-center gap-3 px-4 py-3.5"
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            backgroundColor: `${accentColor}18`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name={icon} size={16} color={accentColor} />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-sm font-bold text-textPrimary">{title}</Text>
          {subtitle ? (
            <Text className="mt-0.5 text-[11px] text-textSecondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <AppIcon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#6B7280"
        />
      </Pressable>
      {expanded ? (
        <View className="border-t border-slate-100 px-4 pb-4 pt-3">
          {children}
        </View>
      ) : null}
    </Card>
  );
}

export default function ResidentDetails() {
  const { residentId } = useLocalSearchParams<{ residentId: string }>();
  const parsedResidentId = residentId ? parseInt(residentId, 10) : undefined;
  const [openKey, setOpenKey] = useState<string | null>("owners");

  const { data, isLoading, isError, refetch } =
    useGetResidentByBuildingResidenceOnly(parsedResidentId, !!parsedResidentId);

  useFocusEffect(
    useCallback(() => {
      if (parsedResidentId) refetch();
    }, [parsedResidentId, refetch]),
  );

  const resident = data?.data;

  if (isLoading) {
    return (
      <View>
        <PageHeader
          icon="person"
          title="Resident Details"
          subtitle="View resident information and related records."
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
          subtitle="View resident information and related records."
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
          subtitle="View resident information and related records."
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
      <PageHeader
        icon="person"
        title="Resident Details"
        subtitle="Review current records, or edit to make changes."
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

        <AnimatedPressable
          onPress={() =>
            router.push({
              pathname: "/(private)/resident-management/resident-add-edit",
              params: { residentId: String(resident.id) },
            })
          }
          className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-white/15 py-2.5"
        >
          <AppIcon name="create-outline" size={16} color="#FFFFFF" />
          <Text className="text-sm font-semibold text-white">Edit Resident</Text>
        </AnimatedPressable>
      </View>

      <Text className="mb-2 mt-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Current records
      </Text>

      {!resident.owners?.length &&
      !resident.tenants?.length &&
      !resident.propertyAgents?.length &&
      !resident.accessDevices?.length &&
      !resident.vehicles?.length &&
      !resident.visitorPasses?.length &&
      !resident.emergencyContacts?.length &&
      !resident.filters?.length &&
      !resident.rentals?.length &&
      !resident.enterphones?.length &&
      !resident.documents?.length ? (
        <EmptyState
          title="No current records"
          message="Nothing is on file for this unit yet. Use Edit Resident to add them."
        />
      ) : null}

      {!!resident.owners?.length && (
        <ExpandableSection
          sectionKey="owners"
          openKey={openKey}
          setOpenKey={setOpenKey}
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
        </ExpandableSection>
      )}

      {!!resident.tenants?.length && (
        <ExpandableSection
          sectionKey="tenants"
          openKey={openKey}
          setOpenKey={setOpenKey}
          icon="people-outline"
          title="Tenants"
          count={resident.tenants.length}
          accentColor="#2563EB"
        >
          {resident.tenants.map((tenant: TenantRequestPojo, i: number) => (
            <View key={i}>
              {i > 0 && <Divider />}
              <DetailRow label="Full name" value={tenant.fullName} />
              <DetailRow label="Phone" value={tenant.phoneNumber} />
              <DetailRow
                label="Email"
                value={tenant.emailAddress || tenant.email}
              />
              <DetailRow
                label="Form K submitted"
                value={
                  tenant.formKSubmitted === "UPLOADED" ||
                  tenant.formKSubmitted === "UPLOAD"
                    ? "Upload"
                    : tenant.formKSubmitted
                }
              />
              {hasTenantFormK(tenant) && tenant.id != null ? (
                <FileLink
                  label="View Form K file"
                  onPress={() =>
                    void viewTenantFormK({
                      tenantId: tenant.id!,
                      formKFilePath: tenant.formKFilePath,
                      formKFileUrl: tenant.formKFileUrl,
                    }).catch((error: any) =>
                      showToast(
                        "error",
                        error?.message || "Could not open Form K file.",
                      ),
                    )
                  }
                />
              ) : null}
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
        </ExpandableSection>
      )}

      {!!resident.propertyAgents?.length && (
        <ExpandableSection
          sectionKey="agents"
          openKey={openKey}
          setOpenKey={setOpenKey}
          icon="briefcase-outline"
          title="Property agents"
          count={resident.propertyAgents.length}
          accentColor="#D97706"
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
        </ExpandableSection>
      )}

      {!!resident.accessDevices?.length && (
        <ExpandableSection
          sectionKey="devices"
          openKey={openKey}
          setOpenKey={setOpenKey}
          icon="key-outline"
          title="Access devices"
          count={resident.accessDevices.length}
          accentColor="#BE185D"
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
                {hasAccessDeviceOwnerApproval(device) && device.id != null ? (
                  <FileLink
                    label="View owner approval"
                    onPress={() =>
                      void viewAccessDeviceOwnerApproval({
                        deviceId: device.id!,
                        ownerApproval:
                          typeof device.ownerApproval === "string"
                            ? device.ownerApproval
                            : null,
                        ownerApprovalUrl: device.ownerApprovalUrl,
                      }).catch((error: any) =>
                        showToast(
                          "error",
                          error?.message ||
                            "Could not open owner approval file.",
                        ),
                      )
                    }
                  />
                ) : null}
              </View>
            ),
          )}
        </ExpandableSection>
      )}

      {!!resident.vehicles?.length && (
        <ExpandableSection
          sectionKey="vehicles"
          openKey={openKey}
          setOpenKey={setOpenKey}
          icon="car-outline"
          title="Vehicles"
          count={resident.vehicles.length}
          accentColor="#0F766E"
        >
          {resident.vehicles.map((vehicle: VehicleRequestPojo, i: number) => (
            <View key={i}>
              {i > 0 && <Divider />}
              <DetailRow label="Plate" value={vehicle.licensePlateNumber} />
              <DetailRow label="Make and model" value={vehicle.makeAndModel} />
              <DetailRow label="Color" value={vehicle.color} />
            </View>
          ))}
        </ExpandableSection>
      )}

      {!!resident.visitorPasses?.length && (
        <ExpandableSection
          sectionKey="passes"
          openKey={openKey}
          setOpenKey={setOpenKey}
          icon="ticket-outline"
          title="Visitor passes"
          count={resident.visitorPasses.length}
          accentColor="#7C3AED"
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
        </ExpandableSection>
      )}

      {!!resident.emergencyContacts?.length && (
        <ExpandableSection
          sectionKey="emergency"
          openKey={openKey}
          setOpenKey={setOpenKey}
          icon="medkit-outline"
          title="Emergency contacts"
          count={resident.emergencyContacts.length}
          accentColor="#DC2626"
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
        </ExpandableSection>
      )}

      {!!resident.filters?.length && (
        <ExpandableSection
          sectionKey="filters"
          openKey={openKey}
          setOpenKey={setOpenKey}
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
        </ExpandableSection>
      )}

      {!!resident.rentals?.length && (
        <ExpandableSection
          sectionKey="rentals"
          openKey={openKey}
          setOpenKey={setOpenKey}
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
        </ExpandableSection>
      )}

      {!!resident.enterphones?.length && (
        <ExpandableSection
          sectionKey="enterphones"
          openKey={openKey}
          setOpenKey={setOpenKey}
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
        </ExpandableSection>
      )}

      {!!resident.documents?.length && (
        <ExpandableSection
          sectionKey="documents"
          openKey={openKey}
          setOpenKey={setOpenKey}
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
        </ExpandableSection>
      )}
    </View>
  );
}
