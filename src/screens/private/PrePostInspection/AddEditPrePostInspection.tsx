import {
  useGetBookingAmenityByResidentDate,
  useGetBookingById,
} from "@/src/api/booking.api";
import {
  useCreatePrePostInspection,
  useDeletePrePostInspectionImage,
  useGetPrePostInspectionById,
  useUpdatePrePostInspection,
} from "@/src/api/prePostInspection.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import DatePickerField from "@/src/components/ui/DatePickerField";
import SelectField from "@/src/components/ui/SelectField";
import SignaturePad from "@/src/components/ui/SignaturePad";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  BookingRevenueResponse,
  paidTypeLabel,
} from "@/src/types/booking.types";
import {
  IMAGE_AREA_MAX,
  IMAGE_DESCRIPTION_MAX,
  PRE_POST_INSPECTION_STATUSES,
  PrePostInspectionAmenityResponse,
  PrePostInspectionImageResponse,
  PrePostInspectionMutationPayload,
  PrePostInspectionStatus,
} from "@/src/types/prePostInspection.types";
import AppIcon from "@/src/components/ui/AppIcon";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { resolveInspectionImageUrl } from "./imageHelpers";
import { buildPrePostInspectionFormData } from "./prePostInspectionFormData";

type AmenityOption = {
  amenityId: number;
  name: string;
  bookingId?: number;
  revenue?: BookingRevenueResponse | null;
};

type ImageFormItem = {
  key: string;
  id?: number;
  file?: {
    uri: string;
    name: string;
    mimeType: string;
    isLocal: boolean;
  };
  area: string;
  description: string;
  fileUrl?: string;
  originalFileName?: string;
};

type AmenityFormRow = {
  key: string;
  id?: number;
  amenityId: number | undefined;
  amenityName?: string;
  bookingId?: number;
  revenue?: BookingRevenueResponse | null;
  residentSignature: string;
  caretakerSignature: string;
  preImages: ImageFormItem[];
  postImages: ImageFormItem[];
};

function newImageKey() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newAmenityRow(partial?: Partial<AmenityFormRow>): AmenityFormRow {
  return {
    key: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amenityId: undefined,
    residentSignature: "",
    caretakerSignature: "",
    preImages: [],
    postImages: [],
    ...partial,
  };
}

function mapServerImage(img: PrePostInspectionImageResponse): ImageFormItem {
  return {
    key: `server-img-${img.id}`,
    id: img.id,
    area: img.area ?? "",
    description: img.description ?? "",
    fileUrl: img.fileUrl,
    originalFileName: img.originalFileName,
    file: img.fileUrl
      ? {
          uri: resolveInspectionImageUrl(img),
          name: img.originalFileName ?? `image-${img.id}.jpg`,
          mimeType: "image/jpeg",
          isLocal: false,
        }
      : undefined,
  };
}

function mapAmenityFromResponse(
  a: PrePostInspectionAmenityResponse,
): AmenityFormRow {
  return newAmenityRow({
    key: `server-${a.id}`,
    id: a.id,
    amenityId: a.amenityId,
    amenityName: a.amenityName,
    residentSignature: a.residentSignature ?? "",
    caretakerSignature: a.caretakerSignature ?? "",
    preImages: (a.preImages ?? []).map(mapServerImage),
    postImages: (a.postImages ?? []).map(mapServerImage),
  });
}

function toYmd(isoOrDate: string): string {
  if (!isoOrDate) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) return isoOrDate;
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayYmd() {
  return toYmd(new Date().toISOString());
}

function nowHm() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function normalizeTimeInput(t: string | undefined | null): string {
  if (!t?.trim()) return "";
  const trimmed = t.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5);
  return trimmed;
}

function inspectionDateInputValue(iso: string | undefined): string {
  if (!iso) return "";
  return toYmd(iso);
}

function isRevenuePaid(revenue: BookingRevenueResponse | null | undefined) {
  if (!revenue) return false;
  if (revenue.isPaid === true) return true;
  if (revenue.isPaid === false) return false;
  return !!(
    revenue.paidFee ||
    revenue.receiptNumber ||
    (revenue.paidType && revenue.paidType !== "NONE") ||
    revenue.damageDeposit ||
    revenue.depositReceiptNumber
  );
}

function SectionHeading({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <View className="mb-3 mt-2 flex-row gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
        <Text className="text-sm font-semibold text-white">{step}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-slate-900">{title}</Text>
        <Text className="mt-0.5 text-xs text-slate-500">{description}</Text>
      </View>
    </View>
  );
}

function AmenityRevenuePanel({
  revenue,
  bookingId,
}: {
  revenue?: BookingRevenueResponse | null;
  bookingId?: number;
}) {
  const paid = isRevenuePaid(revenue);
  return (
    <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Booking revenue
        </Text>
        <View
          className={`rounded-full px-2 py-0.5 ${
            paid ? "bg-emerald-50" : "bg-amber-50"
          }`}
        >
          <Text
            className={`text-[11px] font-semibold ${
              paid ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {paid ? "Paid" : "Unpaid"}
          </Text>
        </View>
      </View>
      {bookingId != null ? (
        <Text className="mb-2 text-xs text-slate-500">Booking #{bookingId}</Text>
      ) : null}
      {!revenue ? (
        <Text className="text-xs text-slate-400">No revenue on file</Text>
      ) : (
        <View className="gap-1">
          <Text className="text-xs text-slate-600">
            Fee: {revenue.paidFee || "—"} · {paidTypeLabel(revenue.paidType)}
          </Text>
          <Text className="text-xs text-slate-600">
            Receipt: {revenue.receiptNumber || "—"}
          </Text>
          <Text className="text-xs text-slate-600">
            Deposit: {revenue.damageDeposit || "—"} ·{" "}
            {paidTypeLabel(revenue.damageDepositPaidType)}
          </Text>
          {revenue.depositReceiptNumber ? (
            <Text className="text-xs text-slate-600">
              Deposit receipt: {revenue.depositReceiptNumber}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

function TimePickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [showIOS, setShowIOS] = useState(false);
  const parsed = useMemo(() => {
    const d = new Date();
    if (/^\d{2}:\d{2}$/.test(value)) {
      const [h, m] = value.split(":").map(Number);
      d.setHours(h, m, 0, 0);
    }
    return d;
  }, [value]);

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value: parsed,
      mode: "time",
      onChange: (event, selected) => {
        if (event.type !== "set" || !selected) return;
        onChange(
          `${String(selected.getHours()).padStart(2, "0")}:${String(
            selected.getMinutes(),
          ).padStart(2, "0")}`,
        );
      },
    });
  };

  const onIOS = (_e: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return;
    onChange(
      `${String(selected.getHours()).padStart(2, "0")}:${String(
        selected.getMinutes(),
      ).padStart(2, "0")}`,
    );
  };

  return (
    <View>
      <Pressable
        onPress={() => {
          if (Platform.OS === "android") openAndroid();
          else setShowIOS(true);
        }}
        className="flex-row items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3"
      >
        <Text className="text-slate-900">{value || "Select time"}</Text>
        <AppIcon name="time-outline" size={20} color="#94a3b8" />
      </Pressable>
      {Platform.OS === "ios" && showIOS && (
        <View className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
          <DateTimePicker value={parsed} mode="time" display="spinner" onChange={onIOS} />
          <Pressable
            onPress={() => setShowIOS(false)}
            className="mt-2 rounded-lg bg-primary py-3"
          >
            <Text className="text-center font-semibold text-white">Done</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function AmenityPhotosBlock({
  images,
  onChange,
  onRequestDeleteExisting,
  label,
}: {
  images: ImageFormItem[];
  onChange: (next: ImageFormItem[]) => void;
  onRequestDeleteExisting: (id: number) => void;
  label: string;
}) {
  const handleAdd = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*"],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const added: ImageFormItem[] = result.assets.map((a) => ({
      key: newImageKey(),
      file: {
        uri: a.uri,
        name: a.name?.trim() || `image-${Date.now()}.jpg`,
        mimeType: a.mimeType ?? "image/jpeg",
        isLocal: true,
      },
      area: "",
      description: "",
      originalFileName: a.name?.trim() || undefined,
    }));
    onChange([...images, ...added]);
  };

  return (
    <View className="mb-3">
      <Text className="mb-2 text-sm font-semibold text-slate-700">{label}</Text>
      {images.map((img) => (
        <View
          key={img.key}
          className="mb-2 rounded-xl border border-slate-200 bg-white p-3"
        >
          <View className="mb-2 flex-row items-center gap-3">
            {img.file?.uri || img.fileUrl ? (
              <Image
                source={{
                  uri:
                    img.file?.uri ??
                    resolveInspectionImageUrl({
                      id: img.id!,
                      imageSide: "PRE",
                      fileUrl: img.fileUrl,
                    }),
                }}
                style={{ width: 56, height: 56, borderRadius: 8 }}
              />
            ) : null}
            <Text className="flex-1 text-xs text-slate-600" numberOfLines={2}>
              {img.originalFileName || img.file?.name || `Image #${img.id}`}
            </Text>
            <Pressable
              onPress={() => {
                if (img.id != null) onRequestDeleteExisting(img.id);
                else onChange(images.filter((x) => x.key !== img.key));
              }}
              hitSlop={8}
            >
              <Text className="text-xs font-semibold text-red-600">Remove</Text>
            </Pressable>
          </View>
          <AppInput
            label="Area"
            value={img.area}
            onChangeText={(t) =>
              onChange(
                images.map((x) =>
                  x.key === img.key
                    ? { ...x, area: t.slice(0, IMAGE_AREA_MAX) }
                    : x,
                ),
              )
            }
            placeholder="e.g. Kitchen counter"
          />
          <View className="mt-2">
            <TextAreaField
              label="Description"
              value={img.description}
              onChangeText={(t) =>
                onChange(
                  images.map((x) =>
                    x.key === img.key
                      ? {
                          ...x,
                          description: t.slice(0, IMAGE_DESCRIPTION_MAX),
                        }
                      : x,
                  ),
                )
              }
              placeholder="Optional notes"
            />
          </View>
        </View>
      ))}
      <Pressable
        onPress={() => void handleAdd()}
        className="items-center rounded-xl border border-dashed border-slate-300 bg-white py-3"
      >
        <Text className="text-sm font-semibold text-primary">+ Add photos</Text>
      </Pressable>
    </View>
  );
}

export default function AddEditPrePostInspection() {
  const {
    inspectionId,
    bookingId: qBookingId,
    residentId: qResidentId,
    amenityId: qAmenityId,
  } = useLocalSearchParams<{
    inspectionId?: string;
    bookingId?: string;
    residentId?: string;
    amenityId?: string;
  }>();

  const editId =
    inspectionId && !Number.isNaN(Number(inspectionId))
      ? Number(inspectionId)
      : undefined;
  const isEdit = editId != null;

  const initialBookingId =
    qBookingId && !Number.isNaN(Number(qBookingId))
      ? Number(qBookingId)
      : undefined;
  const initialResidentId =
    qResidentId && !Number.isNaN(Number(qResidentId))
      ? Number(qResidentId)
      : undefined;
  const initialAmenityId =
    qAmenityId && !Number.isNaN(Number(qAmenityId))
      ? Number(qAmenityId)
      : undefined;

  const { buildingId } = useAuth();
  const { residences } = useResidencesForActiveBuilding();

  const [residentId, setResidentId] = useState<number | undefined>(
    initialResidentId,
  );
  const [bookingId, setBookingId] = useState<number | undefined>(
    initialBookingId,
  );
  const [inspectionDate, setInspectionDate] = useState(todayYmd());
  const [inspectionTime, setInspectionTime] = useState(nowHm());
  const [status, setStatus] = useState<PrePostInspectionStatus>("IN_PROGRESS");
  const [depositReturned, setDepositReturned] = useState<
    "yes" | "no" | "unset"
  >("unset");
  const [notes, setNotes] = useState("");
  const [finalResidentSignature, setFinalResidentSignature] = useState("");
  const [finalCaretakerSignature, setFinalCaretakerSignature] = useState("");
  const [amenities, setAmenities] = useState<AmenityFormRow[]>(() => [
    newAmenityRow(
      initialAmenityId != null ? { amenityId: initialAmenityId } : undefined,
    ),
  ]);
  const [pendingImageDeleteId, setPendingImageDeleteId] = useState<
    number | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [editId]);

  const { data: detailData, isLoading: detailLoading } =
    useGetPrePostInspectionById(editId, isEdit);

  const { data: bookingData } = useGetBookingById(
    !isEdit && initialBookingId != null ? initialBookingId : undefined,
    !isEdit && initialBookingId != null,
  );

  const { data: amenitiesData, isLoading: amenitiesLoading } =
    useGetBookingAmenityByResidentDate(
      residentId,
      inspectionDate,
      buildingId ?? undefined,
      !!residentId && !!inspectionDate.trim(),
    );

  const amenityOptions = useMemo((): AmenityOption[] => {
    const raw = amenitiesData?.data as unknown;
    if (!raw) return [];
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { data?: unknown }).data)
        ? ((raw as { data: unknown[] }).data as unknown[])
        : [];
    return list
      .map((item): AmenityOption | null => {
        const r = item as Record<string, unknown>;
        const amenityId = Number(
          r.amenityId ?? (r.amenity as { id?: number } | undefined)?.id,
        );
        const name = String(
          r.amenityName ??
            r.name ??
            (r.amenity as { name?: string } | undefined)?.name ??
            "",
        ).trim();
        if (!amenityId || Number.isNaN(amenityId)) return null;
        const bookingIdRaw = r.bookingId ?? r.id;
        const bid =
          bookingIdRaw != null && !Number.isNaN(Number(bookingIdRaw))
            ? Number(bookingIdRaw)
            : undefined;
        const option: AmenityOption = {
          amenityId,
          name: name || `Amenity #${amenityId}`,
          revenue: (r.revenue ?? null) as BookingRevenueResponse | null,
        };
        if (bid != null) option.bookingId = bid;
        return option;
      })
      .filter((x): x is AmenityOption => x != null);
  }, [amenitiesData]);

  const amenitySelectOptions = useMemo((): AmenityOption[] => {
    const byId = new Map(amenityOptions.map((a) => [a.amenityId, a]));
    for (const row of amenities) {
      if (row.amenityId != null && !byId.has(row.amenityId)) {
        byId.set(row.amenityId, {
          amenityId: row.amenityId,
          name: row.amenityName?.trim() || `Amenity #${row.amenityId}`,
          bookingId: row.bookingId,
          revenue: row.revenue,
        });
      }
    }
    return Array.from(byId.values());
  }, [amenityOptions, amenities]);

  const createMut = useCreatePrePostInspection();
  const updateMut = useUpdatePrePostInspection(editId);
  const deleteImageMut = useDeletePrePostInspectionImage();

  useEffect(() => {
    if (isEdit || !bookingData?.data) return;
    const b = bookingData.data as typeof bookingData.data & {
      revenue?: BookingRevenueResponse | null;
    };
    if (b.residentId != null && residentId == null) {
      setResidentId(b.residentId);
    }
    if (b.amenityId != null) {
      setAmenities((rows) => {
        if (rows.length === 1 && rows[0].amenityId == null) {
          return [
            {
              ...rows[0],
              amenityId: b.amenityId,
              bookingId: typeof b.id === "number" ? b.id : Number(b.id),
              revenue: b.revenue ?? null,
            },
          ];
        }
        return rows;
      });
    }
    if (bookingId == null && b.id != null) {
      setBookingId(typeof b.id === "number" ? b.id : Number(b.id));
    }
  }, [bookingData, isEdit, residentId, bookingId]);

  useEffect(() => {
    if (!isEdit || !detailData?.data || hydratedRef.current) return;
    const row = detailData.data;
    hydratedRef.current = true;
    setResidentId(row.residentId);
    setBookingId(row.bookingId ?? undefined);
    setInspectionDate(inspectionDateInputValue(row.inspectionDate));
    setInspectionTime(normalizeTimeInput(row.inspectionTime) || nowHm());
    setStatus(
      (String(row.status) as PrePostInspectionStatus) || "IN_PROGRESS",
    );
    setDepositReturned(
      row.depositReturned === true
        ? "yes"
        : row.depositReturned === false
          ? "no"
          : "unset",
    );
    setNotes(row.notes ?? "");
    setFinalResidentSignature(row.finalResidentSignature ?? "");
    setFinalCaretakerSignature(row.finalCaretakerSignature ?? "");
    setAmenities(() => {
      const mapped = (row.amenities ?? []).map(mapAmenityFromResponse);
      return mapped.length ? mapped : [newAmenityRow()];
    });
  }, [detailData, isEdit]);

  const updateAmenity = (
    key: string,
    patch: Partial<AmenityFormRow> | ((row: AmenityFormRow) => AmenityFormRow),
  ) => {
    setAmenities((rows) =>
      rows.map((r) => {
        if (r.key !== key) return r;
        return typeof patch === "function" ? patch(r) : { ...r, ...patch };
      }),
    );
  };

  const usedAmenityIds = useMemo(
    () =>
      new Set(
        amenities
          .map((a) => a.amenityId)
          .filter((id): id is number => id != null),
      ),
    [amenities],
  );

  const hasAmenityDataFilled = useMemo(
    () =>
      amenities.some(
        (a) =>
          a.amenityId != null ||
          !!a.residentSignature?.trim() ||
          !!a.caretakerSignature?.trim() ||
          a.preImages.length > 0 ||
          a.postImages.length > 0,
      ),
    [amenities],
  );

  const canChangeResident = !hasAmenityDataFilled;

  const validate = (): string | null => {
    if (buildingId == null) return "Select a building first.";
    if (residentId == null) return "Select a resident / unit.";
    if (!inspectionDate.trim()) return "Choose an inspection date.";
    if (!amenities.length) return "Add at least one amenity.";
    for (let i = 0; i < amenities.length; i++) {
      if (amenities[i].amenityId == null) {
        return "Choose an amenity for each row before saving.";
      }
    }
    return null;
  };

  const buildPayload = (
    statusOverride?: PrePostInspectionStatus,
  ): PrePostInspectionMutationPayload | null => {
    const err = validate();
    if (err) {
      Alert.alert("Validation", err);
      return null;
    }
    return {
      buildingId: buildingId!,
      residentId: residentId!,
      bookingId: bookingId ?? null,
      inspectionDate: inspectionDate.trim(),
      inspectionTime: inspectionTime.trim() || undefined,
      status: statusOverride ?? status,
      depositReturned:
        depositReturned === "yes"
          ? true
          : depositReturned === "no"
            ? false
            : null,
      finalResidentSignature: finalResidentSignature || undefined,
      finalCaretakerSignature: finalCaretakerSignature || undefined,
      notes: notes.trim() || undefined,
      amenities: amenities.map((a) => ({
        id: a.id,
        amenityId: a.amenityId!,
        residentSignature: a.residentSignature || undefined,
        caretakerSignature: a.caretakerSignature || undefined,
        preImages: a.preImages.length
          ? a.preImages.map((img) => ({
              id: img.id,
              file: img.file,
              area: img.area.trim() || undefined,
              description: img.description.trim() || undefined,
            }))
          : undefined,
        postImages: a.postImages.length
          ? a.postImages.map((img) => ({
              id: img.id,
              file: img.file,
              area: img.area.trim() || undefined,
              description: img.description.trim() || undefined,
            }))
          : undefined,
      })),
    };
  };

  const handleSave = async (markCompleted = false) => {
    const payload = buildPayload(markCompleted ? "COMPLETED" : undefined);
    if (!payload) return;
    setSubmitting(true);
    try {
      const fd = await buildPrePostInspectionFormData(payload);
      if (isEdit && editId != null) {
        updateMut.mutate(fd, {
          onSuccess: () => {
            router.replace({
              pathname: "/(private)/pre-post-inspection/inspection-details",
              params: { inspectionId: String(editId) },
            });
          },
          onSettled: () => setSubmitting(false),
        });
      } else {
        createMut.mutate(fd, {
          onSuccess: (res) => {
            const createdId = (res.data as { data?: { id?: number } })?.data
              ?.id;
            if (createdId != null) {
              router.replace({
                pathname: "/(private)/pre-post-inspection/inspection-details",
                params: { inspectionId: String(createdId) },
              });
            } else if (bookingId != null) {
              router.replace({
                pathname: "/(private)/pre-post-inspection",
                params: { bookingId: String(bookingId) },
              });
            } else {
              router.replace("/(private)/pre-post-inspection");
            }
          },
          onSettled: () => setSubmitting(false),
        });
      }
    } catch {
      setSubmitting(false);
    }
  };

  const handleConfirmDeleteImage = () => {
    if (pendingImageDeleteId == null) return;
    const removedId = pendingImageDeleteId;
    deleteImageMut.mutate(
      { imageId: removedId },
      {
        onSuccess: () => {
          setAmenities((rows) =>
            rows.map((r) => ({
              ...r,
              preImages: r.preImages.filter((img) => img.id !== removedId),
              postImages: r.postImages.filter((img) => img.id !== removedId),
            })),
          );
        },
        onSettled: () => setPendingImageDeleteId(null),
      },
    );
  };

  if (isEdit && detailLoading) {
    return <LoadingState message="Loading inspection..." />;
  }

  const isBusy =
    submitting || createMut.isPending || updateMut.isPending;

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="clipboard-outline"
        title={isEdit ? "Edit inspection" : "Create inspection"}
        subtitle={
          isEdit
            ? "Update photos, signatures, and inspection details"
            : "Capture pre/post photos and signatures for booked amenities"
        }
      />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeading
          step={1}
          title="Who & when"
          description="Resident, date, time, and status"
        />

        <SelectField
          label="Resident / unit *"
          value={residentId != null ? String(residentId) : ""}
          onChange={(v) => {
            if (!canChangeResident) {
              Alert.alert(
                "Clear amenities first",
                "Clear amenities to change resident.",
              );
              return;
            }
            setResidentId(v ? Number(v) : undefined);
          }}
          options={residences}
          placeholder="Select unit"
        />
        {!canChangeResident ? (
          <Text className="mt-1 text-xs text-amber-600">
            Clear amenities to change resident.
          </Text>
        ) : null}

        <View className="mt-3">
          <Text className="mb-1.5 text-sm font-medium text-slate-700">
            Inspection date *
          </Text>
          <DatePickerField
            value={inspectionDate ? `${inspectionDate}T12:00:00` : ""}
            onChange={(iso) => setInspectionDate(toYmd(iso))}
            placeholder="Select date"
          />
        </View>

        <View className="mt-3">
          <Text className="mb-1.5 text-sm font-medium text-slate-700">
            Inspection time
          </Text>
          <TimePickerField value={inspectionTime} onChange={setInspectionTime} />
        </View>

        <View className="mt-3">
          <SelectField
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as PrePostInspectionStatus)}
            options={PRE_POST_INSPECTION_STATUSES.map((s) => ({
              label: s.label,
              value: s.value,
            }))}
          />
        </View>

        <SectionHeading
          step={2}
          title="Amenities"
          description="Booked amenities for this resident on the inspection date"
        />

        {!residentId || !inspectionDate ? (
          <Text className="mb-3 text-sm text-slate-400">
            Select a resident and date to load amenities.
          </Text>
        ) : amenitiesLoading ? (
          <Text className="mb-3 text-sm text-slate-400">Loading amenities…</Text>
        ) : amenitySelectOptions.length === 0 ? (
          <Text className="mb-3 text-sm text-slate-400">
            No booked amenities found for this resident/date.
          </Text>
        ) : null}

        {amenities.map((row, idx) => {
          const optionsForRow = amenitySelectOptions
            .filter(
              (o) =>
                o.amenityId === row.amenityId ||
                !usedAmenityIds.has(o.amenityId),
            )
            .map((o) => ({
              label: o.name,
              value: String(o.amenityId),
            }));

          return (
            <View
              key={row.key}
              className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-semibold text-slate-900">
                  Amenity {idx + 1}
                </Text>
                {amenities.length > 1 ? (
                  <Pressable
                    onPress={() =>
                      setAmenities((rows) =>
                        rows.length <= 1
                          ? rows
                          : rows.filter((r) => r.key !== row.key),
                      )
                    }
                  >
                    <Text className="text-xs font-semibold text-red-600">
                      Remove
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <SelectField
                label="Amenity *"
                value={row.amenityId != null ? String(row.amenityId) : ""}
                onChange={(v) => {
                  const aid = v ? Number(v) : undefined;
                  const opt = amenitySelectOptions.find(
                    (o) => o.amenityId === aid,
                  );
                  updateAmenity(row.key, {
                    amenityId: aid,
                    amenityName: opt?.name,
                    bookingId: opt?.bookingId,
                    revenue: opt?.revenue ?? null,
                  });
                  if (opt?.bookingId != null && bookingId == null) {
                    setBookingId(opt.bookingId);
                  }
                }}
                options={optionsForRow}
                placeholder="Select amenity"
              />

              <View className="mt-3">
                <AmenityRevenuePanel
                  revenue={row.revenue}
                  bookingId={row.bookingId}
                />
              </View>

              <AmenityPhotosBlock
                label="Pre inspection photos"
                images={row.preImages}
                onChange={(next) =>
                  updateAmenity(row.key, { preImages: next })
                }
                onRequestDeleteExisting={setPendingImageDeleteId}
              />
              <AmenityPhotosBlock
                label="Post inspection photos"
                images={row.postImages}
                onChange={(next) =>
                  updateAmenity(row.key, { postImages: next })
                }
                onRequestDeleteExisting={setPendingImageDeleteId}
              />

              <Text className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Amenity signatures
              </Text>
              <Text className="mb-1 text-sm text-slate-700">Resident</Text>
              {row.residentSignature?.trim() ? (
                <Text className="mb-1 text-xs text-emerald-600">
                  Signature on file — draw again to replace
                </Text>
              ) : null}
              <View className="w-full overflow-hidden">
                <SignaturePad
                  height={140}
                  onChange={(v: string) =>
                    updateAmenity(row.key, { residentSignature: v })
                  }
                />
              </View>
              <Text className="mb-1 mt-3 text-sm text-slate-700">Caretaker</Text>
              {row.caretakerSignature?.trim() ? (
                <Text className="mb-1 text-xs text-emerald-600">
                  Signature on file — draw again to replace
                </Text>
              ) : null}
              <View className="w-full overflow-hidden">
                <SignaturePad
                  height={140}
                  onChange={(v: string) =>
                    updateAmenity(row.key, { caretakerSignature: v })
                  }
                />
              </View>
            </View>
          );
        })}

        <AppButton
          variant="outline"
          onPress={() => setAmenities((rows) => [...rows, newAmenityRow()])}
          leftIcon="add"
        >
          Add amenity
        </AppButton>

        <SectionHeading
          step={3}
          title="Wrap-up"
          description="Deposit, notes, and final signatures"
        />

        <SelectField
          label="Deposit returned"
          value={depositReturned}
          onChange={(v) =>
            setDepositReturned(v as "yes" | "no" | "unset")
          }
          options={[
            { label: "Not set", value: "unset" },
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
        />

        <View className="mt-3">
          <TextAreaField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
          />
        </View>

        <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Final signatures
        </Text>
        <Text className="mb-1 text-sm text-slate-700">Final resident</Text>
        {finalResidentSignature?.trim() ? (
          <Text className="mb-1 text-xs text-emerald-600">
            Signature on file — draw again to replace
          </Text>
        ) : null}
        <View className="w-full overflow-hidden">
          <SignaturePad
            height={140}
            onChange={setFinalResidentSignature}
          />
        </View>
        <Text className="mb-1 mt-3 text-sm text-slate-700">Final caretaker</Text>
        {finalCaretakerSignature?.trim() ? (
          <Text className="mb-1 text-xs text-emerald-600">
            Signature on file — draw again to replace
          </Text>
        ) : null}
        <View className="w-full overflow-hidden">
          <SignaturePad
            height={140}
            onChange={setFinalCaretakerSignature}
          />
        </View>

        <View className="mt-6 gap-3">
          <AppButton
            onPress={() => void handleSave(false)}
            loading={isBusy}
            disabled={isBusy || !buildingId}
          >
            {isEdit ? "Save changes" : "Save"}
          </AppButton>
          <AppButton
            variant="outline"
            onPress={() => void handleSave(true)}
            loading={isBusy}
            disabled={isBusy || !buildingId}
            leftIcon="checkmark-circle-outline"
          >
            Mark completed
          </AppButton>
          <AppButton
            variant="ghost"
            onPress={() => router.back()}
            disabled={isBusy}
          >
            Cancel
          </AppButton>
        </View>
      </KeyboardAwareScrollView>

      <ConfirmModal
        visible={pendingImageDeleteId != null}
        title="Remove image?"
        message="This will soft-delete the image from the inspection."
        confirmText="Remove"
        destructive
        loading={deleteImageMut.isPending}
        onCancel={() => setPendingImageDeleteId(null)}
        onConfirm={handleConfirmDeleteImage}
      />
    </View>
  );
}
