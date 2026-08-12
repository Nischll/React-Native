import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import {
  hasAccessDeviceOwnerApproval,
} from "@/src/helper/accessDeviceFormData";
import { hasTenantFormK } from "@/src/helper/tenantFormData";
import {
  AccessDeviceRequestPojo,
  EmergencyContactRequestPojo,
  OwnerRequestPojo,
  PropertyAgentRequestPojo,
  ResidentResponse,
  TenantRequestPojo,
  VehicleRequestPojo,
  VisitorPassRequestPojo,
  labelFobStatus,
} from "@/src/types/resident.types";
import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type RecordKey =
  | "owners"
  | "tenants"
  | "agents"
  | "vehicles"
  | "passes"
  | "devices"
  | "emergency";

type RecordConfig = {
  key: RecordKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  pathname: Href;
  accent: string;
  getItems: (resident: ResidentResponse) => unknown[];
  preview: (resident: ResidentResponse) => string;
  renderItems: (resident: ResidentResponse) => React.ReactNode;
};

function joinPreview(parts: (string | null | undefined)[], empty: string) {
  const cleaned = parts.map((p) => p?.trim()).filter(Boolean) as string[];
  if (!cleaned.length) return empty;
  if (cleaned.length <= 2) return cleaned.join(" · ");
  return `${cleaned.slice(0, 2).join(" · ")} +${cleaned.length - 2}`;
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value?: string | null | boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  return (
    <View className="flex-row items-start justify-between py-1">
      <Text className="pr-3 text-xs text-textSecondary">{label}</Text>
      <Text className="flex-1 text-right text-xs font-semibold text-textPrimary">
        {display}
      </Text>
    </View>
  );
}

function ItemBlock({
  children,
  isFirst,
}: {
  children: React.ReactNode;
  isFirst: boolean;
}) {
  return (
    <View className={isFirst ? "" : "mt-2 border-t border-slate-100 pt-2"}>
      {children}
    </View>
  );
}

const RECORDS: RecordConfig[] = [
  {
    key: "owners",
    label: "Owners",
    icon: "person-outline",
    pathname: "/(private)/owner-management",
    accent: "#453956",
    getItems: (r) => r.owners ?? [],
    preview: (r) =>
      joinPreview(
        (r.owners ?? []).map((o: OwnerRequestPojo) => o.fullName),
        "No owners yet",
      ),
    renderItems: (r) =>
      (r.owners ?? []).map((owner: OwnerRequestPojo, i: number) => (
        <ItemBlock key={i} isFirst={i === 0}>
          <DetailLine label="Name" value={owner.fullName} />
          <DetailLine label="Phone" value={owner.phoneNumber} />
          <DetailLine label="Email" value={owner.email} />
        </ItemBlock>
      )),
  },
  {
    key: "tenants",
    label: "Tenants",
    icon: "people-outline",
    pathname: "/(private)/tenant-management",
    accent: "#2563EB",
    getItems: (r) => r.tenants ?? [],
    preview: (r) =>
      joinPreview(
        (r.tenants ?? []).map((t: TenantRequestPojo) => t.fullName),
        "No tenants yet",
      ),
    renderItems: (r) =>
      (r.tenants ?? []).map((tenant: TenantRequestPojo, i: number) => (
        <ItemBlock key={i} isFirst={i === 0}>
          <DetailLine label="Name" value={tenant.fullName} />
          <DetailLine label="Phone" value={tenant.phoneNumber} />
          <DetailLine
            label="Email"
            value={tenant.emailAddress || tenant.email}
          />
          <DetailLine
            label="Form K file"
            value={hasTenantFormK(tenant) ? "Attached" : "None"}
          />
        </ItemBlock>
      )),
  },
  {
    key: "agents",
    label: "Property agents",
    icon: "briefcase-outline",
    pathname: "/(private)/property-agent-management",
    accent: "#B45309",
    getItems: (r) => r.propertyAgents ?? [],
    preview: (r) =>
      joinPreview(
        (r.propertyAgents ?? []).map(
          (a: PropertyAgentRequestPojo) =>
            a.companyName || a.propertyManagerName,
        ),
        "No property agents yet",
      ),
    renderItems: (r) =>
      (r.propertyAgents ?? []).map(
        (agent: PropertyAgentRequestPojo, i: number) => (
          <ItemBlock key={i} isFirst={i === 0}>
            <DetailLine label="Company" value={agent.companyName} />
            <DetailLine label="Manager" value={agent.propertyManagerName} />
            <DetailLine label="Phone" value={agent.phoneNumber} />
          </ItemBlock>
        ),
      ),
  },
  {
    key: "vehicles",
    label: "Vehicles",
    icon: "car-outline",
    pathname: "/(private)/vehicle-management",
    accent: "#0F766E",
    getItems: (r) => r.vehicles ?? [],
    preview: (r) =>
      joinPreview(
        (r.vehicles ?? []).map(
          (v: VehicleRequestPojo) =>
            v.licensePlateNumber || v.makeAndModel,
        ),
        "No vehicles yet",
      ),
    renderItems: (r) =>
      (r.vehicles ?? []).map((vehicle: VehicleRequestPojo, i: number) => (
        <ItemBlock key={i} isFirst={i === 0}>
          <DetailLine label="Plate" value={vehicle.licensePlateNumber} />
          <DetailLine label="Make / model" value={vehicle.makeAndModel} />
          <DetailLine label="Color" value={vehicle.color} />
        </ItemBlock>
      )),
  },
  {
    key: "passes",
    label: "Visitor passes",
    icon: "ticket-outline",
    pathname: "/(private)/visitor-pass-management",
    accent: "#6D28D9",
    getItems: (r) => r.visitorPasses ?? [],
    preview: (r) =>
      joinPreview(
        (r.visitorPasses ?? []).map(
          (p: VisitorPassRequestPojo) => p.visitorPassNumber,
        ),
        "No visitor passes yet",
      ),
    renderItems: (r) =>
      (r.visitorPasses ?? []).map(
        (pass: VisitorPassRequestPojo, i: number) => (
          <ItemBlock key={i} isFirst={i === 0}>
            <DetailLine label="Pass #" value={pass.visitorPassNumber} />
            <DetailLine
              label="Status"
              value={pass.status === "ACTIVE" ? "Active" : "Lost"}
            />
          </ItemBlock>
        ),
      ),
  },
  {
    key: "devices",
    label: "Access devices",
    icon: "key-outline",
    pathname: "/(private)/access-device-management",
    accent: "#BE185D",
    getItems: (r) => r.accessDevices ?? [],
    preview: (r) =>
      joinPreview(
        (r.accessDevices ?? []).map((d: AccessDeviceRequestPojo) => {
          const type = d.type === "KEY_TAG" ? "Key tag" : "Remote";
          return d.cardNumber ? `${type} ${d.cardNumber}` : type;
        }),
        "No access devices yet",
      ),
    renderItems: (r) =>
      (r.accessDevices ?? []).map(
        (device: AccessDeviceRequestPojo, i: number) => (
          <ItemBlock key={i} isFirst={i === 0}>
            <DetailLine
              label="Type"
              value={device.type === "KEY_TAG" ? "Key tag" : "Remote"}
            />
            <DetailLine label="Card #" value={device.cardNumber} />
            <DetailLine label="Status" value={labelFobStatus(device.status)} />
            <DetailLine
              label="Owner approval"
              value={
                hasAccessDeviceOwnerApproval(device) ? "Attached" : "None"
              }
            />
          </ItemBlock>
        ),
      ),
  },
  {
    key: "emergency",
    label: "Emergency contacts",
    icon: "medkit-outline",
    pathname: "/(private)/emergency-contact-management",
    accent: "#DC2626",
    getItems: (r) => r.emergencyContacts ?? [],
    preview: (r) =>
      joinPreview(
        (r.emergencyContacts ?? []).map(
          (c: EmergencyContactRequestPojo) => c.name,
        ),
        "No emergency contacts yet",
      ),
    renderItems: (r) =>
      (r.emergencyContacts ?? []).map(
        (contact: EmergencyContactRequestPojo, i: number) => (
          <ItemBlock key={i} isFirst={i === 0}>
            <DetailLine label="Name" value={contact.name} />
            <DetailLine label="Phone" value={contact.phoneNumber} />
            <DetailLine label="Relationship" value={contact.relationship} />
          </ItemBlock>
        ),
      ),
  },
];

type Props = {
  residentId: number;
  resident: ResidentResponse;
};

export default function ResidentRelatedRecords({
  residentId,
  resident,
}: Props) {
  const [openKey, setOpenKey] = useState<RecordKey | null>(null);

  const openManage = (pathname: Href) => {
    router.push({
      pathname: pathname as any,
      params: {
        residentId: String(residentId),
        returnTo: "edit",
      },
    });
  };

  return (
    <View className="mb-2 mt-1">
      <Text className="mb-1 px-1 text-base font-bold text-textPrimary">
        Current records
      </Text>
      <Text className="mb-3 px-1 text-xs leading-5 text-textSecondary">
        Expand a section to review, or tap Manage to add and update.
      </Text>

      {RECORDS.map((item) => {
        const count = item.getItems(resident).length;
        const expanded = openKey === item.key;
        const preview = item.preview(resident);

        return (
          <Card key={item.key} className="mb-3 overflow-hidden px-0 py-0">
            <View className="flex-row items-center gap-2 px-3 py-3">
              <Pressable
                onPress={() => setOpenKey(expanded ? null : item.key)}
                className="min-w-0 flex-1 flex-row items-center gap-3"
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${item.accent}14`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon name={item.icon} size={18} color={item.accent} />
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-semibold text-textPrimary">
                      {item.label}
                    </Text>
                    <View className="rounded-full bg-slate-100 px-2 py-0.5">
                      <Text className="text-[11px] font-semibold text-slate-600">
                        {count}
                      </Text>
                    </View>
                  </View>
                  {!expanded ? (
                    <Text
                      className="mt-0.5 text-xs text-textSecondary"
                      numberOfLines={1}
                    >
                      {preview}
                    </Text>
                  ) : null}
                </View>
                <AppIcon
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#94A3B8"
                />
              </Pressable>

              <AnimatedPressable
                onPress={() => openManage(item.pathname)}
                className="rounded-xl bg-primary/10 px-3 py-2"
              >
                <Text className="text-xs font-bold text-primary">Manage</Text>
              </AnimatedPressable>
            </View>

            {expanded ? (
              <View className="border-t border-slate-100 px-4 pb-3 pt-2">
                {count > 0 ? (
                  item.renderItems(resident)
                ) : (
                  <Text className="py-2 text-xs text-textSecondary">
                    Nothing on file yet. Tap Manage to add.
                  </Text>
                )}
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}
