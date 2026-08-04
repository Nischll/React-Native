import {
  useUpdateAccessDeviceRevenue,
  useUpdateBookingRevenue,
  useUpdateFilterRevenue,
  useUpdateRentalRevenue,
  useUpdateVisitorPassRevenue,
} from "@/src/api/revenue.api";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import SelectField from "@/src/components/ui/SelectField";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import {
  bookingRevenueAmountsForPayload,
  unpaidBookingRevenuePayload,
  validateBookingRevenueWhenPaid,
  validatePurchaseRevenueWhenPaid,
} from "@/src/helper/revenueAmountUtils";
import { PAID_TYPE_OPTIONS, PaidType } from "@/src/types/booking.types";
import {
  DEPOSIT_STATUS_OPTIONS,
  DepositAmountStatus,
  getRevenueReference,
  getRevenueSubDetail,
  RevenueDetailItem,
  typeLabel,
} from "@/src/types/revenueDetail.types";
import { showToast } from "@/src/utils/toast";
import { useEffect, useMemo, useState } from "react";
import {
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

export default function RevenueActionModal({
  item,
  mode,
  onClose,
  onSaved,
}: Props) {
  const visible = !!item && !!mode;
  const [form, setForm] = useState<FormState>(emptyForm());
  const [attachmentFile, setAttachmentFile] = useState<PickedFile | null>(null);

  const readOnly = mode === "view";
  const isDepositMode = mode === "deposit";
  const isPayMode = mode === "pay";
  const isBooking = item?.type === "BOOKING";
  const fieldsEnabled = readOnly || isDepositMode || form.isPaid;

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

  const title =
    mode === "deposit"
      ? "Deposit update"
      : mode === "pay"
        ? "Pay now"
        : "Revenue details";

  const handleSave = () => {
    if (!item || readOnly) return;

    if (isBooking) {
      if (form.isPaid && isPayMode) {
        const validation = validateBookingRevenueWhenPaid({
          paidFee: form.paidFee,
          damageDeposit: form.damageDeposit,
          paidType: form.paidType,
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
      const existing = getRevenueSubDetail(item);
      const paid = isDepositMode ? !!existing?.isPaid : form.isPaid;

      const revenue: Record<string, any> = paid
        ? {
            isPaid: true,
            paidType: form.paidType,
            paidFee: amounts.paidFee,
            receiptNumber: form.receiptNumber || "",
            damageDeposit: amounts.damageDeposit,
            depositReceiptNumber: form.depositReceiptNumber || "",
            damageDepositPaidType: form.damageDepositPaidType,
          }
        : { ...unpaidBookingRevenuePayload() };

      revenue.preInspection = form.preInspection || null;
      revenue.postInspection = form.postInspection || null;
      revenue.description = form.description || null;

      if (isDepositMode) {
        revenue.depositAmountStatus = form.depositAmountStatus || null;
        revenue.refundedBy = form.refundedBy || null;
        revenue.damageDeposit =
          form.damageDeposit || amounts.damageDeposit || null;
        revenue.depositReceiptNumber = form.depositReceiptNumber || null;
        revenue.damageDepositPaidType = form.damageDepositPaidType;
        revenue.isPaid = !!existing?.isPaid;
        revenue.paidFee = existing?.paidFee ?? amounts.paidFee;
        revenue.receiptNumber = existing?.receiptNumber ?? "";
        revenue.paidType = (existing?.paidType as PaidType) || "NONE";
        if (!attachmentFile && form.attachmentForDeposit) {
          revenue.attachmentForDeposit = form.attachmentForDeposit;
        }
      } else if (paid) {
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
        const fd = new FormData();
        // Spring @RequestPart("booking") expects application/json part
        fd.append(
          "booking",
          new Blob([JSON.stringify(bookingPayload)], {
            type: "application/json",
          }) as any,
        );
        fd.append("attachmentForDeposit", {
          uri: attachmentFile.uri,
          name: attachmentFile.name,
          type: attachmentFile.mimeType || "application/octet-stream",
        } as any);
        updateBooking(fd as any, { onSuccess });
      } else {
        updateBooking(bookingPayload as any, { onSuccess });
      }
      return;
    }

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
          paidType: "NONE",
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
              {item && (
                <>
                  <Text className="text-sm text-textSecondary mt-1">
                    {typeLabel(item.type)} · {getRevenueReference(item)}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {[item.buildingName, item.residentUnit, item.residentName]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </>
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
              {/* Marked to pay — Pay now only */}
              {isPayMode && !readOnly && (
                <View className="mb-4 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 gap-2">
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
                          ? "Required to update fees, deposit, and save changes."
                          : "Check to edit payment details and save."}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${
                        form.isPaid ? "bg-green-100" : "bg-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          form.isPaid ? "text-green-700" : "text-slate-600"
                        }`}
                      >
                        {form.isPaid ? "Pay now" : "Unpaid"}
                      </Text>
                    </View>
                  </Pressable>
                  {!form.isPaid && (
                    <Text className="text-xs font-medium text-amber-600">
                      Check Marked to pay to enable the fields below. Unchecked
                      Save records unpaid and clears payment fields.
                    </Text>
                  )}
                </View>
              )}

              {readOnly && (
                <View className="mb-4 rounded-xl border border-slate-200 px-4 py-3">
                  <Text className="text-xs text-slate-500">Paid</Text>
                  <Text className="text-sm font-semibold text-textPrimary mt-0.5">
                    {form.isPaid ? "Yes" : "No"}
                  </Text>
                </View>
              )}

              {/* Non-refundable fee — Pay now / view */}
              {!isDepositMode && (isBooking || isPayMode || readOnly) && (
                <View
                  className={`mb-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 gap-3 border-l-4 border-l-amber-500 ${
                    !fieldsEnabled ? "opacity-60" : ""
                  }`}
                >
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
                        editable={fieldsEnabled && !readOnly}
                        placeholder="0.00"
                      />
                      <AppInput
                        label="Receipt number"
                        value={form.receiptNumber}
                        onChangeText={(v) => setField("receiptNumber", v)}
                        editable={fieldsEnabled && !readOnly}
                        placeholder="Receipt #"
                      />
                      {readOnly || !fieldsEnabled ? (
                        <InfoLine
                          label="Payment type"
                          value={
                            form.paidType === "NONE" ? "—" : form.paidType
                          }
                        />
                      ) : (
                        <SelectField
                          label="Payment type"
                          value={form.paidType}
                          onChange={(v) =>
                            setField("paidType", v as PaidType)
                          }
                          options={PAID_TYPE_OPTIONS}
                          placeholder="Select payment type"
                          mode="dropdown"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <AppInput
                        label="Amount *"
                        value={form.paidAmount}
                        onChangeText={(v) => setField("paidAmount", v)}
                        keyboardType="decimal-pad"
                        editable={fieldsEnabled && !readOnly}
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
                        editable={fieldsEnabled && !readOnly}
                        placeholder="Receipt #"
                      />
                      {readOnly || !fieldsEnabled ? (
                        <InfoLine
                          label="Payment type"
                          value={
                            form.paidType === "NONE" ? "—" : form.paidType
                          }
                        />
                      ) : (
                        <SelectField
                          label="Payment type *"
                          value={form.paidType}
                          onChange={(v) =>
                            setField("paidType", v as PaidType)
                          }
                          options={PAID_TYPE_NO_NONE}
                          placeholder="Select payment type"
                          mode="dropdown"
                        />
                      )}
                      <TextAreaField
                        label="Payment notes"
                        value={form.paidNotes}
                        onChangeText={(v) => setField("paidNotes", v)}
                        editable={fieldsEnabled && !readOnly}
                        placeholder="Optional notes"
                      />
                    </>
                  )}
                </View>
              )}

              {/* Refundable deposit */}
              {isBooking && (isDepositMode || isPayMode || readOnly) && (
                <View
                  className={`mb-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 gap-3 border-l-4 border-l-emerald-500 ${
                    !isDepositMode && !fieldsEnabled ? "opacity-60" : ""
                  }`}
                >
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    {isDepositMode
                      ? "Update deposit & refund"
                      : "Refundable — deposit"}
                  </Text>

                  {(isDepositMode || readOnly) && (
                    <>
                      {isDepositMode && !readOnly ? (
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
                          mode="dropdown"
                        />
                      ) : (
                        <InfoLine
                          label="Deposit status"
                          value={
                            form.depositAmountStatus === "REFUNDED"
                              ? "Refunded"
                              : form.depositAmountStatus === "ON_HOLD"
                                ? "On hold"
                                : form.depositAmountStatus || "—"
                          }
                        />
                      )}
                      <AppInput
                        label="Refunded by"
                        value={form.refundedBy}
                        onChangeText={(v) => setField("refundedBy", v)}
                        editable={!readOnly && isDepositMode}
                        placeholder="e.g. Concierge name"
                      />
                    </>
                  )}

                  <AppInput
                    label="Deposit amount"
                    value={form.damageDeposit}
                    onChangeText={(v) => setField("damageDeposit", v)}
                    keyboardType="decimal-pad"
                    editable={
                      !readOnly &&
                      (isDepositMode || (isPayMode && form.isPaid))
                    }
                    placeholder="0.00"
                  />
                  <AppInput
                    label="Deposit receipt number"
                    value={form.depositReceiptNumber}
                    onChangeText={(v) => setField("depositReceiptNumber", v)}
                    editable={
                      !readOnly &&
                      (isDepositMode || (isPayMode && form.isPaid))
                    }
                    placeholder="Receipt # for deposit"
                  />
                  {readOnly ||
                  !(isDepositMode || (isPayMode && form.isPaid)) ? (
                    <InfoLine
                      label="Deposit payment type"
                      value={
                        form.damageDepositPaidType === "NONE"
                          ? "—"
                          : form.damageDepositPaidType
                      }
                    />
                  ) : (
                    <SelectField
                      label="Deposit payment type"
                      value={form.damageDepositPaidType}
                      onChange={(v) =>
                        setField("damageDepositPaidType", v as PaidType)
                      }
                      options={PAID_TYPE_OPTIONS}
                      placeholder="Select deposit payment type"
                      mode="dropdown"
                    />
                  )}
                </View>
              )}

              {/* Attachment — Deposit update only */}
              {isBooking && isDepositMode && !readOnly && (
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
                </View>
              )}

              {isBooking && readOnly && form.attachmentForDeposit ? (
                <View className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <InfoLine
                    label="Deposit attachment"
                    value={form.attachmentForDeposit}
                  />
                </View>
              ) : null}

              {/* Inspections */}
              {isBooking && (isDepositMode || isPayMode || readOnly) && (
                <View
                  className={`mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 gap-3 ${
                    !isDepositMode && !fieldsEnabled ? "opacity-60" : ""
                  }`}
                >
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Inspections
                  </Text>
                  <TextAreaField
                    label="Pre-inspection"
                    value={form.preInspection}
                    onChangeText={(v) => setField("preInspection", v)}
                    editable={!readOnly && (isDepositMode || form.isPaid)}
                    placeholder="Notes"
                  />
                  <TextAreaField
                    label="Post-inspection"
                    value={form.postInspection}
                    onChangeText={(v) => setField("postInspection", v)}
                    editable={!readOnly && (isDepositMode || form.isPaid)}
                    placeholder="Notes"
                  />
                </View>
              )}

              {/* Notes — always editable in pay/deposit (match web) */}
              {isBooking && (isDepositMode || isPayMode || readOnly) && (
                <View className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 gap-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Notes
                  </Text>
                  <TextAreaField
                    label="Revenue description"
                    value={form.description}
                    onChangeText={(v) => setField("description", v)}
                    editable={!readOnly}
                    placeholder="Additional notes or comments"
                  />
                </View>
              )}

              <View className="flex-row gap-3 mt-2">
                <View className="flex-1">
                  <AppButton
                    variant="outline"
                    onPress={onClose}
                    disabled={pending}
                  >
                    {readOnly ? "Close" : "Cancel"}
                  </AppButton>
                </View>
                {!readOnly && (
                  <View className="flex-1">
                    <AppButton onPress={handleSave} loading={pending}>
                      Save
                    </AppButton>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <View>
      <Text className="text-xs text-slate-500 mb-0.5">{label}</Text>
      <Text className="text-sm font-medium text-textPrimary">
        {value && String(value).trim() ? value : "—"}
      </Text>
    </View>
  );
}
