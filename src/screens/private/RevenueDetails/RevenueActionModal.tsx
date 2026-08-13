import {
  useUpdateAccessDeviceRevenue,
  useUpdateBookingRevenue,
  useUpdateFilterRevenue,
  useUpdateRentalRevenue,
  useUpdateVisitorPassRevenue,
} from "@/src/api/revenue.api";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import SelectField from "@/src/components/ui/SelectField";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import { downloadDepositAttachment } from "@/src/helper/downloadDepositAttachment";
import { formatDateTime } from "@/src/helper/formatDateTime";
import {
  bookingRevenueAmountsForPayload,
  unpaidBookingRevenuePayload,
  validateBookingRevenueWhenPaid,
  validatePurchaseRevenueWhenPaid,
} from "@/src/helper/revenueAmountUtils";
import {
  PAID_TYPE_OPTIONS,
  PaidType,
  bookingStatusLabel,
} from "@/src/types/booking.types";
import {
  DEPOSIT_STATUS_OPTIONS,
  DepositAmountStatus,
  depositStatusLabel,
  getInspectionParamsFromRevenue,
  getRevenueReference,
  getRevenueSubDetail,
  RevenueDetailItem,
  typeLabel,
} from "@/src/types/revenueDetail.types";
import { showToast } from "@/src/utils/toast";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export type RevenueActionMode = "pay" | "deposit" | "view";

type Props = {
  item: RevenueDetailItem | null;
  mode: RevenueActionMode | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  isPaid: boolean;
  paidFee: string;
  paidAmount: string;
  receiptNumber: string;
  receipt: string;
  paidType: PaidType;
  paidNotes: string;
  damageDeposit: string;
  depositReceiptNumber: string;
  damageDepositPaidType: PaidType;
  depositAmountStatus: DepositAmountStatus;
  refundedBy: string;
  preInspection: string;
  postInspection: string;
  description: string;
  attachmentForDeposit: string;
};

const emptyForm = (): FormState => ({
  isPaid: false,
  paidFee: "",
  paidAmount: "",
  receiptNumber: "",
  receipt: "",
  paidType: "NONE",
  paidNotes: "",
  damageDeposit: "",
  depositReceiptNumber: "",
  damageDepositPaidType: "NONE",
  depositAmountStatus: "ON_HOLD",
  refundedBy: "",
  preInspection: "",
  postInspection: "",
  description: "",
  attachmentForDeposit: "",
});

const PAID_TYPE_NO_NONE = PAID_TYPE_OPTIONS.filter((o) => o.value !== "NONE");

/**
 * Spring expects @RequestPart("booking") as application/json + optional
 * @RequestPart("attachmentForDeposit") MultipartFile.
 * React Native cannot reliably send Blob JSON parts — write JSON to a temp file.
 */
async function buildBookingAttachmentFormData(
  bookingPayload: Record<string, any>,
  file: PickedFile,
): Promise<FormData> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error("File cache is unavailable on this device.");
  }

  const jsonUri = `${cacheDir}booking-revenue-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(
    jsonUri,
    JSON.stringify(bookingPayload),
  );

  const fd = new FormData();
  fd.append("booking", {
    uri: jsonUri,
    name: "booking.json",
    type: "application/json",
  } as any);

  const mime = file.mimeType || "application/octet-stream";
  const name =
    file.name?.trim() ||
    `deposit-attachment.${mime.includes("pdf") ? "pdf" : "bin"}`;

  fd.append("attachmentForDeposit", {
    uri: file.uri,
    name,
    type: mime,
  } as any);

  return fd;
}

export default function RevenueActionModal({
  item,
  mode,
  onClose,
  onSaved,
}: Props) {
  const visible = !!item && !!mode;
  const [form, setForm] = useState<FormState>(emptyForm());
  const [attachmentFile, setAttachmentFile] = useState<PickedFile | null>(null);
  const [downloadingAttachment, setDownloadingAttachment] = useState(false);

  const readOnly = mode === "view";
  const isDepositMode = mode === "deposit";
  const isPayMode = mode === "pay";
  const isBooking = item?.type === "BOOKING";

  const bookingId =
    item?.type === "BOOKING" ? item.sourceId : undefined;

  const { mutate: updateBooking, isPending: bookingPending } =
    useUpdateBookingRevenue(bookingId);
  const { mutate: updateFilter, isPending: filterPending } =
    useUpdateFilterRevenue();
  const { mutate: updateDevice, isPending: devicePending } =
    useUpdateAccessDeviceRevenue();
  const { mutate: updatePass, isPending: passPending } =
    useUpdateVisitorPassRevenue();
  const { mutate: updateRental, isPending: rentalPending } =
    useUpdateRentalRevenue();

  const pending =
    bookingPending ||
    filterPending ||
    devicePending ||
    passPending ||
    rentalPending;

  useEffect(() => {
    if (!item || !mode) {
      setForm(emptyForm());
      setAttachmentFile(null);
      return;
    }
    const rev = getRevenueSubDetail(item);
    const hasBookingPayment = !!(
      rev?.paidFee ||
      rev?.receiptNumber ||
      rev?.damageDeposit ||
      (rev?.paidType && rev.paidType !== "NONE")
    );
    const hasOtherPayment = !!(
      rev?.paidAmount ||
      rev?.receipt ||
      (rev?.paidType && rev.paidType !== "NONE")
    );
    const inferredPaid =
      rev?.isPaid ??
      (item.type === "BOOKING" ? hasBookingPayment : hasOtherPayment);

    const defaultPaidType: PaidType =
      item.type === "BOOKING"
        ? "NONE"
        : ((rev?.paidType as PaidType) || "CASH");

    setAttachmentFile(null);
    setForm({
      isPaid: !!inferredPaid,
      paidFee: String(rev?.paidFee ?? ""),
      paidAmount: String(rev?.paidAmount ?? ""),
      receiptNumber: String(rev?.receiptNumber ?? ""),
      receipt: String(rev?.receipt ?? ""),
      paidType: (rev?.paidType as PaidType) || defaultPaidType,
      paidNotes: String(rev?.paidNotes ?? ""),
      damageDeposit: String(rev?.damageDeposit ?? ""),
      depositReceiptNumber: String(rev?.depositReceiptNumber ?? ""),
      damageDepositPaidType:
        (rev?.damageDepositPaidType as PaidType) || "NONE",
      depositAmountStatus:
        (rev?.depositAmountStatus as DepositAmountStatus) || "ON_HOLD",
      refundedBy: String(rev?.refundedBy ?? ""),
      preInspection: String(rev?.preInspection ?? ""),
      postInspection: String(rev?.postInspection ?? ""),
      description: String(rev?.description ?? ""),
      attachmentForDeposit: String(rev?.attachmentForDeposit ?? ""),
    });
  }, [item, mode]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const attachmentPickerValue = useMemo((): PickedFile | null => {
    if (attachmentFile) return attachmentFile;
    if (form.attachmentForDeposit) {
      return {
        uri: form.attachmentForDeposit,
        name: form.attachmentForDeposit.split("/").pop() || "attachment",
        mimeType: "application/octet-stream",
        isLocal: false,
      };
    }
    return null;
  }, [attachmentFile, form.attachmentForDeposit]);

  const toggleMarkedToPay = () => {
    setForm((prev) => {
      const next = !prev.isPaid;
      if (next) return { ...prev, isPaid: true };
      if (isBooking) {
        return {
          ...prev,
          isPaid: false,
          paidFee: "",
          receiptNumber: "",
          paidType: "NONE",
          damageDeposit: "",
          depositReceiptNumber: "",
          damageDepositPaidType: "NONE",
        };
      }
      return {
        ...prev,
        isPaid: false,
        paidAmount: "",
        receipt: "",
        receiptNumber: "",
        paidType: item?.type === "FILTER" ? "CASH" : "NONE",
        paidNotes: "",
      };
    });
  };

  const handleDownloadDepositAttachment = async () => {
    if (!item || item.type !== "BOOKING" || item.sourceId == null) return;
    const ref = form.attachmentForDeposit?.trim();
    if (!ref && !attachmentFile) {
      showToast("error", "No deposit attachment to download.");
      return;
    }
    setDownloadingAttachment(true);
    try {
      await downloadDepositAttachment({
        bookingId: item.sourceId,
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

  const title =
    mode === "deposit"
      ? "Deposit update"
      : mode === "pay"
        ? "Pay now"
        : "View details";

  const subtitle =
    mode === "view"
      ? "All information for this revenue item. Read-only."
      : item
        ? `${typeLabel(item.type)} · ${getRevenueReference(item)}`
        : "";

  const handleSave = async () => {
    if (!item || readOnly) return;

    if (isBooking) {
      const existing = getRevenueSubDetail(item);
      // Same as web handleSaveRevenue: when marked paid, validate fee + deposit
      // (applies to both Pay Now and Deposit update).
      if (form.isPaid) {
        const validation = validateBookingRevenueWhenPaid({
          paidFee: form.paidFee || String(existing?.paidFee ?? ""),
          damageDeposit: form.damageDeposit,
          paidType:
            form.paidType && form.paidType !== "NONE"
              ? form.paidType
              : ((existing?.paidType as string) || form.paidType),
          damageDepositPaidType: form.damageDepositPaidType,
        });
        if (!validation.ok) {
          showToast("error", validation.message);
          return;
        }
      }

      const b = item.bookingDetail ?? {};
      const amounts = bookingRevenueAmountsForPayload(
        form.paidFee,
        form.damageDeposit,
      );
      // Pay Now uses checkbox; Deposit update keeps existing paid flag (web overlay pattern)
      const paid = isDepositMode ? !!existing?.isPaid : form.isPaid;

      const revenue: Record<string, any> = paid
        ? {
            isPaid: true,
            paidType: (form.paidType ?? "NONE") as PaidType,
            paidFee: amounts.paidFee,
            receiptNumber: form.receiptNumber ?? "",
            damageDeposit: amounts.damageDeposit,
            depositReceiptNumber: form.depositReceiptNumber ?? "",
            damageDepositPaidType: (form.damageDepositPaidType ??
              "NONE") as PaidType,
          }
        : { ...unpaidBookingRevenuePayload() };

      if (form.preInspection !== undefined) {
        revenue.preInspection = form.preInspection || null;
      }
      if (form.postInspection !== undefined) {
        revenue.postInspection = form.postInspection || null;
      }
      if (form.description !== undefined) {
        revenue.description = form.description || null;
      }

      if (isDepositMode) {
        // Deposit update: overlay status / deposit fields (same as web refundable tab)
        if (form.depositAmountStatus !== undefined) {
          revenue.depositAmountStatus = form.depositAmountStatus || null;
        }
        if (form.refundedBy !== undefined) {
          revenue.refundedBy = form.refundedBy || null;
        }
        revenue.damageDeposit =
          form.damageDeposit?.trim() || amounts.damageDeposit || null;
        revenue.depositReceiptNumber = form.depositReceiptNumber || null;
        revenue.damageDepositPaidType =
          (form.damageDepositPaidType ?? "NONE") as PaidType;
        revenue.isPaid = !!existing?.isPaid;
        revenue.paidFee = existing?.paidFee ?? amounts.paidFee;
        revenue.receiptNumber = existing?.receiptNumber ?? "";
        revenue.paidType = (existing?.paidType as PaidType) || "NONE";
        if (!attachmentFile && form.attachmentForDeposit) {
          revenue.attachmentForDeposit = form.attachmentForDeposit;
        }
      } else {
        // Pay Now: preserve existing deposit status / attachment when paid (web)
        if (paid) {
          if (existing?.depositAmountStatus) {
            revenue.depositAmountStatus = existing.depositAmountStatus;
          }
          if (existing?.refundedBy) {
            revenue.refundedBy = existing.refundedBy;
          }
          if (existing?.attachmentForDeposit) {
            revenue.attachmentForDeposit = existing.attachmentForDeposit;
          }
        }
      }

      const bookingPayload: Record<string, any> = {
        title: b.title ?? b.amenityName ?? "Booking",
        amenityId: b.amenityId,
        buildingId: b.buildingId,
        description: b.description ?? "",
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status ?? "PENDING",
        revenue,
      };
      if (b.towerId != null) bookingPayload.towerId = b.towerId;
      if (b.residentId != null || item.residentId != null) {
        bookingPayload.residentId = b.residentId ?? item.residentId;
      }

      const onSuccess = () => {
        onSaved();
        onClose();
      };

      if (isDepositMode && attachmentFile?.isLocal) {
        try {
          const fd = await buildBookingAttachmentFormData(
            bookingPayload,
            attachmentFile,
          );
          updateBooking(fd as any, { onSuccess });
        } catch (e: any) {
          showToast(
            "error",
            e?.message || "Failed to prepare deposit attachment upload.",
          );
        }
      } else {
        updateBooking(bookingPayload as any, { onSuccess });
      }
      return;
    }

    // FILTER / ACCESS_DEVICE / VISITOR_PASS / RENTAL — same as web
    if (form.isPaid) {
      const validation = validatePurchaseRevenueWhenPaid({
        paidAmount: form.paidAmount,
        paidType: form.paidType,
      });
      if (!validation.ok) {
        showToast("error", validation.message);
        return;
      }
    }

    const paid = form.isPaid;
    const paymentFields = paid
      ? {
          paidAmount: form.paidAmount,
          receipt: form.receipt || form.receiptNumber,
          paidType: form.paidType,
          paidNotes: form.paidNotes,
          isPaid: true,
        }
      : {
          paidAmount: null,
          receipt: null,
          paidType: item.type === "FILTER" ? "CASH" : "NONE",
          paidNotes: null,
          isPaid: false,
        };

    const residentId = item.residentId;
    const id = item.sourceId;
    const onSuccess = () => {
      onSaved();
      onClose();
    };

    if (item.type === "FILTER") {
      const d = item.filterDetail ?? {};
      updateFilter(
        {
          typeOfFilter: d.typeOfFilter ?? "",
          size: d.size ?? "",
          noOfFilter: d.noOfFilter ?? 0,
          ...paymentFields,
          pathVars: { id, residentId },
        } as any,
        { onSuccess },
      );
      return;
    }

    if (item.type === "ACCESS_DEVICE") {
      const d = item.accessDeviceDetail ?? {};
      updateDevice(
        {
          type: d.type ?? "REMOTE",
          cardNumber: d.cardNumber ?? "",
          accessLevel: d.accessLevel ?? "",
          assignedTo: d.assignedTo ?? "OWNER",
          status: d.status ?? "ACTIVE",
          ...paymentFields,
          pathVars: { id, residentId },
        } as any,
        { onSuccess },
      );
      return;
    }

    if (item.type === "VISITOR_PASS") {
      const d = item.visitorPassDetail ?? {};
      updatePass(
        {
          visitorPassNumber: d.visitorPassNumber ?? "",
          dateOfIssue: d.dateOfIssue ?? "",
          status: d.status ?? "ACTIVE",
          ...paymentFields,
          pathVars: { id, residentId },
        } as any,
        { onSuccess },
      );
      return;
    }

    if (item.type === "RENTAL") {
      const d = item.rentalDetail ?? {};
      updateRental(
        {
          ...d,
          ...paymentFields,
          pathVars: { id, residentId },
        } as any,
        { onSuccess },
      );
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          {/* Backdrop — separate from sheet to avoid nested Pressable lag */}
          <Pressable
            onPress={onClose}
            className="absolute inset-0"
            accessibilityLabel="Close"
          />

          <View className="max-h-[90%] rounded-t-3xl bg-white">
            <View className="px-5 pt-4 pb-2 border-b border-slate-200">
              <View className="self-center mb-2 h-1 w-10 rounded-full bg-slate-300" />
              <Text className="text-lg font-bold text-textPrimary">{title}</Text>
              {!!subtitle && (
                <Text className="text-sm text-textSecondary mt-1">{subtitle}</Text>
              )}
              {item && mode !== "view" && (
                <Text className="text-xs text-slate-500 mt-0.5">
                  {[item.buildingName, item.residentUnit, item.residentName]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              )}
            </View>

            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingVertical: 16, paddingBottom: 28 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {/* Fees & payment — Pay now (match web) */}
              {isPayMode && !readOnly && (
                <View className="mb-3 gap-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Fees & payment
                  </Text>

                  <View className="rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 gap-2">
                    <Pressable
                      onPress={toggleMarkedToPay}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-sm font-semibold text-textPrimary">
                          Marked to pay
                        </Text>
                        <Text className="text-xs text-textSecondary mt-0.5">
                          {isBooking
                            ? "Required to update revenue details. Check this to edit fees, deposit, and save changes."
                            : "Check to edit payment details and save."}
                        </Text>
                      </View>
                      <View
                        className={`h-6 w-6 rounded-md border-2 items-center justify-center ${
                          form.isPaid
                            ? "bg-primary border-primary"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {form.isPaid ? (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        ) : null}
                      </View>
                    </Pressable>
                    {!form.isPaid && (
                      <Text className="text-xs font-medium text-amber-600">
                        Check Marked to pay to enable the fields below and save
                        revenue details.
                      </Text>
                    )}
                  </View>

                  <View
                    className={`gap-3 ${!form.isPaid ? "opacity-60" : ""}`}
                    pointerEvents={form.isPaid ? "auto" : "none"}
                  >
                    {/* Non-refundable fee */}
                    <View className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 gap-3 border-l-4 border-l-amber-500">
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                        Non-refundable fee
                      </Text>
                      {isBooking ? (
                        <>
                          <AppInput
                            label="Fee amount"
                            value={form.paidFee}
                            onChangeText={(v) => setField("paidFee", v)}
                            keyboardType="decimal-pad"
                            placeholder="Fee amount"
                          />
                          <AppInput
                            label="Receipt number"
                            value={form.receiptNumber}
                            onChangeText={(v) => setField("receiptNumber", v)}
                            placeholder="Receipt #"
                          />
                          <SelectField
                            label="Payment type"
                            value={form.paidType}
                            onChange={(v) =>
                              setField("paidType", v as PaidType)
                            }
                            options={PAID_TYPE_OPTIONS}
                            placeholder="Select type"
                            mode="inline"
                          />
                        </>
                      ) : (
                        <>
                          <AppInput
                            label="Amount *"
                            value={form.paidAmount}
                            onChangeText={(v) => setField("paidAmount", v)}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                          />
                          <AppInput
                            label="Receipt"
                            value={form.receipt || form.receiptNumber}
                            onChangeText={(v) =>
                              setForm((prev) => ({
                                ...prev,
                                receipt: v,
                                receiptNumber: v,
                              }))
                            }
                            placeholder="Receipt #"
                          />
                          <SelectField
                            label="Payment type *"
                            value={
                              form.paidType === "NONE" ? "" : form.paidType
                            }
                            onChange={(v) =>
                              setField("paidType", v as PaidType)
                            }
                            options={PAID_TYPE_NO_NONE}
                            placeholder="Select type"
                            mode="inline"
                          />
                          <TextAreaField
                            label="Payment notes"
                            value={form.paidNotes}
                            onChangeText={(v) => setField("paidNotes", v)}
                            placeholder="Optional notes"
                          />
                        </>
                      )}
                    </View>

                    {/* Refundable deposit — booking only */}
                    {isBooking && (
                      <View className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 gap-3 border-l-4 border-l-emerald-500">
                        <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                          Refundable — deposit
                        </Text>
                        <AppInput
                          label="Deposit amount"
                          value={form.damageDeposit}
                          onChangeText={(v) => setField("damageDeposit", v)}
                          keyboardType="decimal-pad"
                          placeholder="Amount"
                        />
                        <AppInput
                          label="Deposit receipt number"
                          value={form.depositReceiptNumber}
                          onChangeText={(v) =>
                            setField("depositReceiptNumber", v)
                          }
                          placeholder="Receipt # for deposit"
                        />
                        <SelectField
                          label="Deposit payment type"
                          value={form.damageDepositPaidType}
                          onChange={(v) =>
                            setField("damageDepositPaidType", v as PaidType)
                          }
                          options={PAID_TYPE_OPTIONS}
                          placeholder="Select type"
                          mode="inline"
                        />
                      </View>
                    )}

                    {/* Inspection — booking */}
                    {isBooking && (
                      <View className="rounded-xl border border-slate-200 bg-slate-50 p-3 gap-3">
                        <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Inspection
                        </Text>
                        <TextAreaField
                          label="Pre-inspection"
                          value={form.preInspection}
                          onChangeText={(v) => setField("preInspection", v)}
                          placeholder="Notes"
                        />
                        <TextAreaField
                          label="Post-inspection"
                          value={form.postInspection}
                          onChangeText={(v) => setField("postInspection", v)}
                          placeholder="Notes"
                        />
                      </View>
                    )}
                  </View>

                  {isBooking && (
                    <View className="rounded-xl border border-slate-200 bg-slate-50 p-3 gap-3">
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        Notes
                      </Text>
                      <TextAreaField
                        label="Revenue description"
                        value={form.description}
                        onChangeText={(v) => setField("description", v)}
                        placeholder="Additional notes or comments"
                      />
                    </View>
                  )}
                </View>
              )}

              {/* ── View details (read-only, match web) ── */}
              {readOnly && item && (
                <RevenueViewDetails
                  item={item}
                  form={form}
                  downloading={downloadingAttachment}
                  onDownloadAttachment={handleDownloadDepositAttachment}
                />
              )}

              {/* Deposit update mode */}
              {isDepositMode && !readOnly && isBooking && (
                <>
                  <View className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 gap-3 border-l-4 border-l-emerald-500">
                    <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                      Update deposit & refund
                    </Text>
                    <SelectField
                      label="Deposit status"
                      value={form.depositAmountStatus}
                      onChange={(v) =>
                        setField(
                          "depositAmountStatus",
                          v as DepositAmountStatus,
                        )
                      }
                      options={DEPOSIT_STATUS_OPTIONS}
                      placeholder="Select status"
                      mode="inline"
                    />
                    <AppInput
                      label="Refunded by"
                      value={form.refundedBy}
                      onChangeText={(v) => setField("refundedBy", v)}
                      placeholder="e.g. Concierge name"
                    />
                    <AppInput
                      label="Deposit amount"
                      value={form.damageDeposit}
                      onChangeText={(v) => setField("damageDeposit", v)}
                      keyboardType="decimal-pad"
                      placeholder="Amount"
                    />
                    <AppInput
                      label="Deposit receipt number"
                      value={form.depositReceiptNumber}
                      onChangeText={(v) =>
                        setField("depositReceiptNumber", v)
                      }
                      placeholder="Receipt # for deposit"
                    />
                    <SelectField
                      label="Deposit payment type"
                      value={form.damageDepositPaidType}
                      onChange={(v) =>
                        setField("damageDepositPaidType", v as PaidType)
                      }
                      options={PAID_TYPE_OPTIONS}
                      placeholder="Select type"
                      mode="inline"
                    />
                  </View>

                  <View className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 gap-2">
                    <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Attachment for deposit
                    </Text>
                    <FilePicker
                      accept="files"
                      compact
                      label="Deposit attachment"
                      hint="PDF, image, or document"
                      value={attachmentPickerValue}
                      onChange={(file) => {
                        setAttachmentFile(file);
                        if (!file) setField("attachmentForDeposit", "");
                      }}
                    />
                    {!!form.attachmentForDeposit?.trim() &&
                      !attachmentFile?.isLocal && (
                        <Pressable
                          onPress={handleDownloadDepositAttachment}
                          disabled={downloadingAttachment}
                          className="mt-1 flex-row items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5"
                        >
                          {downloadingAttachment ? (
                            <ActivityIndicator size="small" color="#7C3AED" />
                          ) : (
                            <AppIcon
                              name="download-outline"
                              size={18}
                              color="#7C3AED"
                            />
                          )}
                          <Text className="text-sm font-semibold text-primary">
                            {downloadingAttachment
                              ? "Downloading…"
                              : "Download current attachment"}
                          </Text>
                        </Pressable>
                      )}
                  </View>

                  <View className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 gap-3">
                    <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Inspection
                    </Text>
                    <TextAreaField
                      label="Pre-inspection"
                      value={form.preInspection}
                      onChangeText={(v) => setField("preInspection", v)}
                      placeholder="Notes"
                    />
                    <TextAreaField
                      label="Post-inspection"
                      value={form.postInspection}
                      onChangeText={(v) => setField("postInspection", v)}
                      placeholder="Notes"
                    />
                    <TextAreaField
                      label="Revenue description"
                      value={form.description}
                      onChangeText={(v) => setField("description", v)}
                      placeholder="Additional notes or comments"
                    />
                  </View>
                </>
              )}

              <View className="mt-2 gap-2">
                {isPayMode && !form.isPaid ? (
                  <Text className="text-xs text-textSecondary">
                    Check Marked to pay to enter payment details. If unchecked,
                    Save records unpaid and clears payment fields.
                  </Text>
                ) : null}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <AppButton
                      variant="outline"
                      onPress={onClose}
                      disabled={pending}
                    >
                      {readOnly ? "Close" : "Cancel"}
                    </AppButton>
                  </View>
                  {readOnly && isBooking ? (
                    <View className="flex-1">
                      <AppButton
                        variant="outline"
                        leftIcon="clipboard-outline"
                        onPress={() => {
                          if (!item) return;
                          onClose();
                          router.push({
                            pathname:
                              "/(private)/pre-post-inspection/inspection-add-edit",
                            params: getInspectionParamsFromRevenue(item),
                          });
                        }}
                      >
                        Start inspection
                      </AppButton>
                    </View>
                  ) : null}
                  {!readOnly && (
                    <View className="flex-1">
                      <AppButton onPress={handleSave} loading={pending}>
                        Save
                      </AppButton>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function displayPaidType(value?: string | null) {
  if (!value) return "—";
  return PAID_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-3 rounded-xl border-2 border-primary/15 bg-slate-50 px-4 py-3 gap-3">
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </Text>
      {children}
    </View>
  );
}

function DetailGrid({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap gap-y-3">{children}</View>;
}

function DetailCell({
  label,
  value,
  full,
}: {
  label: string;
  value?: string | null;
  full?: boolean;
}) {
  return (
    <View className={full ? "w-full" : "w-1/2 pr-2"}>
      <Text className="text-[10px] font-medium uppercase text-slate-500">
        {label}
      </Text>
      <Text className="text-sm font-medium text-textPrimary mt-0.5">
        {value && String(value).trim() ? value : "—"}
      </Text>
    </View>
  );
}

function RevenueViewDetails({
  item,
  form,
  downloading,
  onDownloadAttachment,
}: {
  item: RevenueDetailItem;
  form: FormState;
  downloading?: boolean;
  onDownloadAttachment?: () => void;
}) {
  const resident =
    [item.residentUnit, item.residentName].filter(Boolean).join(" · ") || "—";
  const b = item.bookingDetail;
  const filter = item.filterDetail;
  const device = item.accessDeviceDetail;
  const pass = item.visitorPassDetail;
  const rental = item.rentalDetail;
  const hasAttachment = !!form.attachmentForDeposit?.trim();

  const description =
    item.type === "BOOKING"
      ? b?.description || form.description || "—"
      : form.paidNotes || "—";

  return (
    <View>
      <SectionCard title="Item information">
        <DetailGrid>
          <DetailCell label="Type" value={typeLabel(item.type)} />
          <DetailCell label="Reference" value={getRevenueReference(item)} />
          <DetailCell label="Building" value={item.buildingName} />
          <DetailCell label="Resident" value={resident} />
          <DetailCell
            label="Date"
            value={
              item.createdDate ? formatDateTime(item.createdDate) : undefined
            }
          />
          {item.type === "BOOKING" && (
            <>
              <DetailCell
                label="Start"
                value={
                  b?.startDate ? formatDateTime(b.startDate) : undefined
                }
              />
              <DetailCell
                label="End"
                value={b?.endDate ? formatDateTime(b.endDate) : undefined}
              />
              <DetailCell
                label="Status"
                value={bookingStatusLabel(b?.status)}
              />
            </>
          )}
        </DetailGrid>
        <View className="pt-2 border-t border-slate-200">
          <DetailCell label="Description" value={description} full />
        </View>
      </SectionCard>

      {item.type === "FILTER" && (
        <SectionCard title="Filter details">
          <DetailGrid>
            <DetailCell label="Type of filter" value={filter?.typeOfFilter} />
            <DetailCell label="Size" value={filter?.size} />
            <DetailCell
              label="Number of filters"
              value={
                filter?.noOfFilter != null ? String(filter.noOfFilter) : undefined
              }
            />
          </DetailGrid>
        </SectionCard>
      )}

      {item.type === "ACCESS_DEVICE" && (
        <SectionCard title="Access device details">
          <DetailGrid>
            <DetailCell
              label="Type"
              value={
                device?.type === "KEY_TAG"
                  ? "Key tag"
                  : device?.type === "REMOTE"
                    ? "Remote"
                    : device?.type
              }
            />
            <DetailCell label="Card number" value={device?.cardNumber} />
            <DetailCell label="Access level" value={device?.accessLevel} />
            <DetailCell
              label="Assigned to"
              value={
                device?.assignedTo === "PROPERTY_AGENT"
                  ? "Property agent"
                  : device?.assignedTo === "TENANT"
                    ? "Tenant"
                    : device?.assignedTo === "OWNER"
                      ? "Owner"
                      : device?.assignedTo
              }
            />
            <DetailCell label="Status" value={device?.status} />
          </DetailGrid>
        </SectionCard>
      )}

      {item.type === "VISITOR_PASS" && (
        <SectionCard title="Visitor pass details">
          <DetailGrid>
            <DetailCell
              label="Pass number"
              value={pass?.visitorPassNumber}
            />
            <DetailCell
              label="Date of issue"
              value={
                pass?.dateOfIssue
                  ? formatDateTime(pass.dateOfIssue)
                  : undefined
              }
            />
            <DetailCell
              label="Status"
              value={
                pass?.status === "LOST"
                  ? "Lost"
                  : pass?.status === "ACTIVE"
                    ? "Active"
                    : pass?.status
              }
            />
          </DetailGrid>
        </SectionCard>
      )}

      {item.type === "RENTAL" && (
        <SectionCard title="Rental details">
          <DetailGrid>
            <DetailCell label="Revenue for" value={rental?.purchaseFor} />
            <DetailCell
              label="Payment option"
              value={
                rental?.paymentOption === "YEARLY"
                  ? "Yearly"
                  : rental?.paymentOption === "MONTHLY"
                    ? "Monthly"
                    : rental?.paymentOption
              }
            />
            <DetailCell label="Parking stall" value={rental?.parkingStall} />
            <DetailCell label="Storage number" value={rental?.storageNumber} />
            <DetailCell label="Garden no" value={rental?.gardenNo} />
            <DetailCell
              label="Start date"
              value={
                rental?.startDate
                  ? String(rental.startDate).slice(0, 10)
                  : undefined
              }
            />
            <DetailCell
              label="End date"
              value={
                rental?.endDate
                  ? String(rental.endDate).slice(0, 10)
                  : undefined
              }
            />
            <DetailCell
              label="Status"
              value={
                rental?.status === "INACTIVE"
                  ? "Inactive"
                  : rental?.status === "ACTIVE"
                    ? "Active"
                    : rental?.status
              }
            />
          </DetailGrid>
        </SectionCard>
      )}

      {item.type === "BOOKING" && (
        <SectionCard title="Deposit status & refund">
          <DetailGrid>
            <DetailCell label="Resident" value={resident} />
            <DetailCell
              label="Deposit amount status"
              value={depositStatusLabel(form.depositAmountStatus)}
            />
            <DetailCell label="Refunded by" value={form.refundedBy} />
            <DetailCell
              label="Attachment for deposit"
              value={form.attachmentForDeposit || "—"}
              full
            />
          </DetailGrid>
          {hasAttachment && onDownloadAttachment ? (
            <Pressable
              onPress={onDownloadAttachment}
              disabled={downloading}
              className="mt-1 flex-row items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5"
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <AppIcon name="download-outline" size={18} color="#7C3AED" />
              )}
              <Text className="text-sm font-semibold text-primary">
                {downloading ? "Downloading…" : "Download attachment"}
              </Text>
            </Pressable>
          ) : null}
        </SectionCard>
      )}

      <SectionCard title="Revenue information">
        <DetailGrid>
          <DetailCell label="Resident" value={resident} />
          <DetailCell
            label="Marked to pay"
            value={form.isPaid ? "Yes" : "No"}
          />
          {item.type === "BOOKING" ? (
            <>
              <DetailCell label="Fee amount" value={form.paidFee} />
              <DetailCell label="Receipt number" value={form.receiptNumber} />
              <DetailCell
                label="Payment type"
                value={displayPaidType(form.paidType)}
              />
              <DetailCell label="Deposit amount" value={form.damageDeposit} />
              <DetailCell
                label="Deposit receipt number"
                value={form.depositReceiptNumber}
              />
              <DetailCell
                label="Deposit payment type"
                value={displayPaidType(form.damageDepositPaidType)}
              />
              <DetailCell label="Pre-inspection" value={form.preInspection} />
              <DetailCell label="Post-inspection" value={form.postInspection} />
              <DetailCell
                label="Revenue description"
                value={form.description}
                full
              />
            </>
          ) : (
            <>
              <DetailCell label="Amount" value={form.paidAmount} />
              <DetailCell
                label="Payment type"
                value={displayPaidType(form.paidType)}
              />
              <DetailCell
                label="Receipt"
                value={form.receipt || form.receiptNumber}
              />
              <DetailCell label="Payment notes" value={form.paidNotes} full />
            </>
          )}
        </DetailGrid>
      </SectionCard>
    </View>
  );
}


