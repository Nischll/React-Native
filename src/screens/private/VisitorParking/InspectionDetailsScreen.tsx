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
import {
  policyBreachDetailItems,
  TOW_WORKFLOW_STATUS_OPTIONS,
  VisitorParkingInspectionResponse,
} from "@/src/types/visitorParking.types";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

function formatNumberSafe(val?: number | null): string {
  if (val == null || Number.isNaN(val)) return "—";
  return String(val);
}

function towLabel(status?: string | null): string {
  return (
    TOW_WORKFLOW_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    status ??
    "—"
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "bad" | "warn" | "neutral";
}) {
  const styles =
    tone === "bad"
      ? "bg-red-50 border-red-200"
      : tone === "warn"
        ? "bg-amber-50 border-amber-200"
        : tone === "ok"
          ? "bg-emerald-50 border-emerald-200"
          : "bg-slate-50 border-slate-200";
  const text =
    tone === "bad"
      ? "text-red-700"
      : tone === "warn"
        ? "text-amber-800"
        : tone === "ok"
          ? "text-emerald-800"
          : "text-slate-600";
  return (
    <View className={`px-2.5 py-1 rounded-full border ${styles}`}>
      <Text className={`text-[11px] font-semibold ${text}`}>{label}</Text>
    </View>
  );
}

function FlagRow({
  active,
  label,
  hasPolicy,
}: {
  active?: boolean | null;
  label: string;
  hasPolicy: boolean;
}) {
  const text =
    active === undefined || active === null
      ? "—"
      : active
        ? hasPolicy
          ? "Violated"
          : "Yes"
        : "OK";
  const tone: "ok" | "bad" | "neutral" =
    active === undefined || active === null
      ? "neutral"
      : active
        ? "bad"
        : "ok";
  return (
    <View className="flex-row items-center justify-between gap-2 py-1.5">
      <Text className="text-sm text-textSecondary flex-1 pr-2">{label}</Text>
      <StatusBadge label={text} tone={tone} />
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-2 py-1">
      <Text className="text-xs text-textSecondary flex-1">{label}</Text>
      <Text className="text-xs font-semibold text-textPrimary">{value}</Text>
    </View>
  );
}

function PolicyComparison({
  inspection,
}: {
  inspection: VisitorParkingInspectionResponse;
}) {
  const rollup = inspection.rollup;
  const policy = inspection.policy;
  const hasPolicy = !!policy?.id;
  const breached = policyBreachDetailItems(inspection);
  const showBlock =
    !!rollup ||
    !!inspection.noPassViolation ||
    !!inspection.noPassBreach ||
    !!inspection.residentMatchPolicyBreach;

  if (!showBlock && !inspection.rollupPolicyViolation) return null;

  return (
    <Card className="p-4 mb-4">
      <SectionLabel label="Violation & policy" />

      <View className="flex-row flex-wrap gap-2 mb-3">
        {inspection.rollupPolicyViolation ? (
          <StatusBadge label="Policy breach" tone="bad" />
        ) : (
          <StatusBadge label="Within policy" tone="ok" />
        )}
        {inspection.residentMatchPolicyBreach ? (
          <StatusBadge label="Resident match breach" tone="warn" />
        ) : null}
        {rollup?.calendarMonthKey ? (
          <StatusBadge
            label={`Month ${rollup.calendarMonthKey}`}
            tone="neutral"
          />
        ) : null}
      </View>

      {breached.length > 0 ? (
        <View className="mb-3">
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Violations detected
          </Text>
          {breached.map((line) => (
            <Text
              key={line}
              className="text-sm text-textPrimary leading-5 mb-1"
            >
              • {line}
            </Text>
          ))}
        </View>
      ) : (
        <Text className="text-sm text-textSecondary mb-3">
          No policy breach flags on this row.
        </Text>
      )}

      {rollup ? (
        <View className="mb-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary mb-2">
            Monthly rollup metrics
          </Text>
          <MetricRow
            label="Distinct observation days"
            value={formatNumberSafe(rollup.distinctObservationDays)}
          />
          <MetricRow
            label="Max continuous span in a session (h)"
            value={formatNumberSafe(rollup.maxContinuousSpanHoursInSession)}
          />
          <MetricRow
            label="Max consecutive overnight nights"
            value={formatNumberSafe(rollup.maxConsecutiveOvernightNights)}
          />
          <MetricRow
            label="Hours first → last observation"
            value={formatNumberSafe(rollup.hoursFromFirstToLastObservation)}
          />
          <MetricRow
            label="Total inspections"
            value={formatNumberSafe(rollup.totalInspections)}
          />
        </View>
      ) : null}

      {policy ? (
        <View className="mb-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary mb-2">
            Building policy limits
          </Text>
          <MetricRow
            label="Max sessions / month"
            value={formatNumberSafe(policy.maxSessionsPerCalendarMonth)}
          />
          <MetricRow
            label="Max consecutive overnight nights"
            value={formatNumberSafe(
              policy.maxConsecutiveOvernightNightsPerMonth,
            )}
          />
          <MetricRow
            label="Max continuous hours"
            value={formatNumberSafe(policy.maxContinuousParkingHours)}
          />
          <MetricRow
            label="Overnight parking allowed"
            value={
              policy.overnightParkingAllowed == null
                ? "—"
                : policy.overnightParkingAllowed
                  ? "Yes"
                  : "No"
            }
          />
        </View>
      ) : (
        <Text className="text-xs text-textSecondary mb-2">
          No active policy embedded on this inspection — flags are
          informational.
        </Text>
      )}

      <Text className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary mb-1">
        Policy comparison
      </Text>
      <FlagRow
        active={inspection.noPassViolation ?? inspection.noPassBreach}
        label="No visitor pass (no-pass violation)"
        hasPolicy={hasPolicy}
      />
      {rollup ? (
        <>
          <FlagRow
            active={rollup.monthlyDistinctDayLimitExceeded}
            label="Monthly distinct day limit"
            hasPolicy={hasPolicy}
          />
          <FlagRow
            active={rollup.consecutiveNightLimitExceeded}
            label="Consecutive night limit"
            hasPolicy={hasPolicy}
          />
          <FlagRow
            active={rollup.continuousHoursLimitExceeded}
            label="Continuous hours (within session)"
            hasPolicy={hasPolicy}
          />
          <FlagRow
            active={rollup.overnightRuleViolated}
            label="Overnight rule (NIGHT rows)"
            hasPolicy={hasPolicy}
          />
        </>
      ) : null}
      <FlagRow
        active={inspection.residentMatchPolicyBreach}
        label="Resident vehicle registry match"
        hasPolicy={hasPolicy}
      />
    </Card>
  );
}

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
  const vehicleDisplay = [inspection.vehicleMake, inspection.vehicleModel]
    .map((v) => v?.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(" ");
  const vehicleWithColor = [vehicleDisplay, inspection.vehicleColor?.trim()]
    .filter(Boolean)
    .join(" · ");

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
          <SectionLabel label="Stall & visit times" />
          <InfoRow>
            <InfoField label="Stall" value={inspection.stallIdentifier} />
            <InfoField label="Period" value={inspection.periodOfDay} />
          </InfoRow>
          <InfoRow>
            <InfoField
              label="Check-In"
              value={
                inspection.checkInAt
                  ? formatDateTime(inspection.checkInAt)
                  : undefined
              }
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
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel label="Vehicle & pass" />
          <InfoRow>
            <InfoField label="License Plate" value={inspection.licensePlate} />
            <InfoField label="Pass Number" value={inspection.passNumberDisplay} />
          </InfoRow>
          <InfoRow>
            <InfoField label="Vehicle" value={vehicleWithColor || undefined} />
            <InfoField
              label="Plate in registry"
              value={
                inspection.residentVehicle == null
                  ? undefined
                  : inspection.residentVehicle
                    ? "Yes"
                    : "No"
              }
            />
          </InfoRow>
          <InfoRow>
            <InfoField
              label="Matched pass ID"
              value={
                inspection.matchedVisitorPassId != null
                  ? String(inspection.matchedVisitorPassId)
                  : undefined
              }
            />
            <InfoField
              label="Matched pass #"
              value={inspection.matchedVisitorPassNumber}
            />
          </InfoRow>
          {inspection.passMatchAmbiguous ? (
            <View className="mb-2">
              <StatusBadge
                label="Ambiguous (multiple passes)"
                tone="warn"
              />
            </View>
          ) : null}
          {inspection.noPassViolation || inspection.noPassBreach ? (
            <View className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 mt-1">
              <StatusBadge label="No-pass violation" tone="bad" />
              <Text className="text-xs text-red-700 mt-2 leading-4">
                No matching active visitor pass was found for the displayed
                pass number at this building.
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-textSecondary mt-1">
              No no-pass violation — pass matches policy for this log.
            </Text>
          )}
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel label="Visitor pass match" />
          <InfoRow>
            <InfoField label="Name" value={inspection.residentName} />
            <InfoField label="Unit" value={inspection.residentUnit} />
          </InfoRow>
          <InfoRow>
            <InfoField
              label="Resident ID"
              value={
                inspection.residentId != null
                  ? String(inspection.residentId)
                  : undefined
              }
            />
          </InfoRow>

          <View className="border-t border-slate-100 pt-3 mt-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary mb-2">
              Registered vehicle (registry)
            </Text>
            {inspection.registeredVehicleMatchAmbiguous ? (
              <StatusBadge
                label="Multiple vehicles with this plate"
                tone="warn"
              />
            ) : (
              <>
                <InfoRow>
                  <InfoField
                    label="Name"
                    value={inspection.registeredVehicleResidentName}
                  />
                  <InfoField
                    label="Unit"
                    value={inspection.registeredVehicleResidentUnit}
                  />
                </InfoRow>
                <InfoRow>
                  <InfoField
                    label="Resident ID"
                    value={
                      inspection.registeredVehicleResidentId != null
                        ? String(inspection.registeredVehicleResidentId)
                        : undefined
                    }
                  />
                </InfoRow>
              </>
            )}
          </View>
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel label="Enforcement" />
          <InfoRow>
            <InfoField
              label="Tow Status"
              value={towLabel(inspection.towWorkflowStatus)}
            />
            <InfoField
              label="Bylaw Notice"
              value={
                inspection.residentVehicle
                  ? inspection.bylawNoticeIssued
                    ? "Issued"
                    : "Not issued"
                  : "—"
              }
            />
          </InfoRow>
          <InfoRow>
            <InfoField
              label="Violation Slip"
              value={inspection.violationSlipIssued ? "Issued" : "Not issued"}
            />
            <InfoField
              label="Calendar month"
              value={inspection.calendarMonthKey}
            />
          </InfoRow>
          <InfoRow>
            <InfoField label="Violation Notes" value={inspection.violationNotes} />
          </InfoRow>
        </Card>

        <PolicyComparison inspection={inspection} />

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
