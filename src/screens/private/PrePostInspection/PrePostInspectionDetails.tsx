import { useGetPrePostInspectionById } from "@/src/api/prePostInspection.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import Card from "@/src/components/ui/Card";
import { renderSignature } from "@/src/helper/renderSignature";
import {
  depositReturnedLabel,
  residentDisplayLabel,
  statusLabel,
} from "@/src/types/prePostInspection.types";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Svg from "react-native-svg";
import { resolveInspectionImageUrl } from "./imageHelpers";
import type { PrePostInspectionImageResponse } from "@/src/types/prePostInspection.types";

function inspectionDateDisplay(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function SignatureBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const v = value?.trim() ?? "";
  const [boxWidth, setBoxWidth] = useState(0);

  return (
    <View className="mb-3 w-full overflow-hidden">
      <Text className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </Text>
      {!v ? (
        <Text className="text-sm text-slate-400">—</Text>
      ) : v.startsWith("SIGNATURE_JSON:") ? (
        <View
          className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2"
          onLayout={(e) => {
            const w = Math.floor(e.nativeEvent.layout.width);
            if (w > 0 && w !== boxWidth) setBoxWidth(w);
          }}
        >
          {boxWidth > 0 ? (
            <Svg height={120} width={boxWidth}>
              {renderSignature(v, boxWidth, 120)}
            </Svg>
          ) : (
            <View style={{ height: 120 }} />
          )}
        </View>
      ) : v.startsWith("data:image") ? (
        <Image
          source={{ uri: v }}
          style={{
            height: 112,
            width: "100%",
            borderRadius: 8,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#e2e8f0",
          }}
          resizeMode="contain"
        />
      ) : (
        <Text className="text-sm text-slate-800">{v}</Text>
      )}
    </View>
  );
}

function ImageThumb({
  img,
  onPress,
}: {
  img: PrePostInspectionImageResponse;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mr-2 mb-2">
      <Image
        source={{ uri: resolveInspectionImageUrl(img) }}
        style={{
          width: 80,
          height: 80,
          borderRadius: 8,
          backgroundColor: "#f1f5f9",
        }}
        resizeMode="cover"
      />
      {(img.area?.trim() || img.description?.trim()) && (
        <View style={{ width: 80, marginTop: 4 }}>
          <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "600" }}>
            {img.area?.trim() || "—"}
          </Text>
          <Text numberOfLines={2} style={{ fontSize: 10, color: "#64748b" }}>
            {img.description?.trim() || ""}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function PrePostInspectionDetails() {
  const { inspectionId } = useLocalSearchParams<{ inspectionId?: string }>();
  const id =
    inspectionId && !Number.isNaN(Number(inspectionId))
      ? Number(inspectionId)
      : undefined;

  const { data, isLoading, isError } = useGetPrePostInspectionById(
    id,
    id != null,
  );
  const row = data?.data;

  const [viewer, setViewer] = useState<{
    uri: string;
    title: string;
    area?: string;
    description?: string;
  } | null>(null);

  const residentLabel = useMemo(
    () => (row ? residentDisplayLabel(row) : "—"),
    [row],
  );

  if (isLoading) {
    return <LoadingState message="Loading inspection details..." />;
  }

  if (isError || !row) {
    return (
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="clipboard-outline"
          title="Inspection details"
        />
        <EmptyState message="Inspection not found or failed to load." />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="clipboard-outline"
        title="Inspection details"
        subtitle={[row.buildingName, `#${row.id}`].filter(Boolean).join(" · ")}
      />

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Card className="mb-4 p-4">
          <SectionLabel label="Header" />
          <InfoRow>
            <InfoField label="Building" value={row.buildingName} />
            <InfoField label="Resident / unit" value={residentLabel} />
          </InfoRow>
          <InfoRow>
            <InfoField
              label="Booking"
              value={row.bookingId != null ? `#${row.bookingId}` : "—"}
            />
            <InfoField
              label="Date"
              value={inspectionDateDisplay(row.inspectionDate)}
            />
          </InfoRow>
          <InfoRow>
            <InfoField
              label="Time"
              value={row.inspectionTime?.trim() || "—"}
            />
            <InfoField label="Status" value={statusLabel(String(row.status))} />
          </InfoRow>
          <InfoRow>
            <InfoField
              label="Deposit returned"
              value={depositReturnedLabel(row.depositReturned)}
            />
            <InfoField
              label="Created by"
              value={row.createdByUserName?.trim() || "—"}
            />
          </InfoRow>
          <InfoRow>
            <InfoField
              label="Created date"
              value={
                row.createdDate
                  ? inspectionDateDisplay(row.createdDate)
                  : "—"
              }
            />
          </InfoRow>
          {row.notes?.trim() ? (
            <View className="mt-1">
              <Text className="mb-1 text-xs text-slate-400">Notes</Text>
              <Text className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-800">
                {row.notes}
              </Text>
            </View>
          ) : null}
        </Card>

        <Card className="mb-4 p-4">
          <SectionLabel
            label={`Amenities (${row.amenities?.length ?? 0})`}
          />
          {(row.amenities ?? []).length === 0 ? (
            <Text className="text-sm text-slate-400">No amenities.</Text>
          ) : (
            (row.amenities ?? []).map((a, idx) => (
              <View
                key={a.id}
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 last:mb-0"
              >
                <Text className="mb-3 text-sm font-semibold text-slate-900">
                  {a.amenityName?.trim() || `Amenity ${idx + 1}`}
                </Text>

                <Text className="mb-1.5 text-xs font-semibold text-slate-700">
                  Pre inspection
                </Text>
                <View className="mb-3 flex-row flex-wrap">
                  {(a.preImages ?? []).length === 0 ? (
                    <Text className="text-xs text-slate-400">None</Text>
                  ) : (
                    (a.preImages ?? []).map((img) => (
                      <ImageThumb
                        key={img.id}
                        img={img}
                        onPress={() =>
                          setViewer({
                            uri: resolveInspectionImageUrl(img),
                            title: img.originalFileName ?? "Pre",
                            area: img.area ?? undefined,
                            description: img.description ?? undefined,
                          })
                        }
                      />
                    ))
                  )}
                </View>

                <Text className="mb-1.5 text-xs font-semibold text-slate-700">
                  Post inspection
                </Text>
                <View className="mb-3 flex-row flex-wrap">
                  {(a.postImages ?? []).length === 0 ? (
                    <Text className="text-xs text-slate-400">None</Text>
                  ) : (
                    (a.postImages ?? []).map((img) => (
                      <ImageThumb
                        key={img.id}
                        img={img}
                        onPress={() =>
                          setViewer({
                            uri: resolveInspectionImageUrl(img),
                            title: img.originalFileName ?? "Post",
                            area: img.area ?? undefined,
                            description: img.description ?? undefined,
                          })
                        }
                      />
                    ))
                  )}
                </View>

                <SignatureBlock
                  label="Resident signature"
                  value={a.residentSignature}
                />
                <SignatureBlock
                  label="Caretaker signature"
                  value={a.caretakerSignature}
                />
              </View>
            ))
          )}
        </Card>

        <Card className="mb-4 p-4">
          <SectionLabel label="Final signatures" />
          <SignatureBlock
            label="Final resident signature"
            value={row.finalResidentSignature}
          />
          <SignatureBlock
            label="Final caretaker signature"
            value={row.finalCaretakerSignature}
          />
        </Card>

        <AppButton
          onPress={() =>
            router.push({
              pathname: "/(private)/pre-post-inspection/inspection-add-edit",
              params: { inspectionId: String(row.id) },
            })
          }
          leftIcon="pencil-outline"
        >
          Edit
        </AppButton>
      </ScrollView>

      <Modal
        visible={viewer != null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewer(null)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/80 px-4"
          onPress={() => setViewer(null)}
        >
          <View className="w-full max-w-lg overflow-hidden rounded-2xl bg-white">
            {viewer?.uri ? (
              <Image
                source={{ uri: viewer.uri }}
                style={{ width: "100%", height: 320 }}
                resizeMode="contain"
              />
            ) : null}
            <View className="px-4 py-3">
              <Text className="font-semibold text-slate-900">
                {viewer?.title}
              </Text>
              {viewer?.area ? (
                <Text className="mt-1 text-sm text-slate-700">
                  Area: {viewer.area}
                </Text>
              ) : null}
              {viewer?.description ? (
                <Text className="mt-1 text-sm text-slate-500">
                  {viewer.description}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
      {label}
    </Text>
  );
}

function InfoRow({ children }: { children: React.ReactNode }) {
  return <View className="mb-3 flex-row last:mb-0">{children}</View>;
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
      <Text className="mb-0.5 text-xs text-gray-400">{label}</Text>
      <Text className="text-sm font-medium text-gray-800">
        {value && String(value).trim() ? value : "—"}
      </Text>
    </View>
  );
}
