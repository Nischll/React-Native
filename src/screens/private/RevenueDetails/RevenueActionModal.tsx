import {
  useUpdateAccessDeviceRevenue,
  useUpdateBookingRevenue,
  useUpdateFilterRevenue,
  useUpdateRentalRevenue,
  useUpdateVisitorPassRevenue,
} from "@/src/api/revenue.api";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import SelectField from "@/src/components/ui/SelectField";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import {
  bookingRevenueAmountsForPayload,
  validateBookingRevenueWhenPaid,
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
import { useEffect, useState } from "react";
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
});

export default function RevenueActionModal({
  item,
  mode,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const readOnly = mode === "view";
  const isDepositMode = mode === "deposit";
  const isBooking = item?.type === "BOOKING";

  const { mutate: updateBooking, isPending: bookingPending } =
    useUpdateBookingRevenue(item?.type === "BOOKING" ? item.sourceId : undefined);
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
    if (!item) {
      setForm(emptyForm());
      return;
    }
    const rev = getRevenueSubDetail(item);
    setForm({
      isPaid: !!rev?.isPaid,
      paidFee: String(rev?.paidFee ?? ""),
      paidAmount: String(rev?.paidAmount ?? ""),
      receiptNumber: String(rev?.receiptNumber ?? ""),
      receipt: String(rev?.receipt ?? ""),
      paidType: (rev?.paidType as PaidType) || "NONE",
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
    });
  }, [item, mode]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const title =
    mode === "deposit"
      ? "Deposit update"
      : mode === "pay"
        ? "Pay now"
        : "Revenue details";

  const handleSave = () => {
    if (!item || readOnly) return;

    if (isBooking) {
      if (form.isPaid && !isDepositMode) {
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
      const paid = isDepositMode ? !!getRevenueSubDetail(item)?.isPaid : form.isPaid;

      const revenue: Record<string, any> = paid
        ? {
            isPaid: true,
            paidType: form.paidType,
            paidFee: amounts.paidFee,
            receiptNumber: form.receiptNumber || "",
            damageDeposit: amounts.damageDeposit,
            depositReceiptNumber: form.depositReceiptNumber || "",
            damageDepositPaidType: form.damageDepositPaidType,
            preInspection: form.preInspection || undefined,
            postInspection: form.postInspection || undefined,
            description: form.description || undefined,
          }
        : {
            isPaid: false,
            paidType: "NONE",
            damageDepositPaidType: "NONE",
            paidFee: null,
            receiptNumber: null,
            damageDeposit: null,
            depositReceiptNumber: null,
          };

      if (isDepositMode || form.depositAmountStatus) {
        revenue.depositAmountStatus = form.depositAmountStatus || null;
        revenue.refundedBy = form.refundedBy || null;
        revenue.damageDeposit = form.damageDeposit || amounts.damageDeposit || null;
        revenue.depositReceiptNumber = form.depositReceiptNumber || null;
        revenue.damageDepositPaidType = form.damageDepositPaidType;
        revenue.preInspection = form.preInspection || null;
        revenue.postInspection = form.postInspection || null;
        revenue.description = form.description || null;
        // Keep existing fee fields when updating deposit
        if (isDepositMode) {
          const existing = getRevenueSubDetail(item);
          revenue.isPaid = !!existing?.isPaid;
          revenue.paidFee = existing?.paidFee ?? amounts.paidFee;
          revenue.receiptNumber = existing?.receiptNumber ?? "";
          revenue.paidType = (existing?.paidType as PaidType) || "NONE";
        }
      }

      const payload: Record<string, any> = {
        title: b.title ?? b.amenityName ?? "Booking",
        amenityId: b.amenityId,
        buildingId: b.buildingId,
        description: b.description ?? "",
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status ?? "PENDING",
        revenue,
      };
      if (b.towerId != null) payload.towerId = b.towerId;
      if (b.residentId != null || item.residentId != null) {
        payload.residentId = b.residentId ?? item.residentId;
      }

      updateBooking(payload as any, {
        onSuccess: () => {
          onSaved();
          onClose();
        },
      });
      return;
    }

    if (form.isPaid && (!form.paidAmount.trim() || form.paidType === "NONE")) {
      showToast(
        "error",
        "When marked to pay, amount and payment type (other than None) are required.",
      );
      return;
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

  if (!item || !mode) return null;

  return (
    <Modal
      transparent
      visible
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable
          onPress={onClose}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-[90%] rounded-t-3xl bg-white"
          >
            <View className="px-5 pt-4 pb-2 border-b border-slate-200">
              <Text className="text-lg font-bold text-textPrimary">{title}</Text>
              <Text className="text-sm text-textSecondary mt-1">
                {typeLabel(item.type)} · {getRevenueReference(item)}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {[item.buildingName, item.residentUnit, item.residentName]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>

            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingVertical: 16, paddingBottom: 28 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {!isDepositMode && !readOnly && (
                <Pressable
                  onPress={() => setField("isPaid", !form.isPaid)}
                  className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <Text className="text-sm font-semibold text-textPrimary">
                    Marked to pay
                  </Text>
                  <View
                    className={`rounded-full px-3 py-1 ${
                      form.isPaid ? "bg-green-100" : "bg-amber-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        form.isPaid ? "text-green-700" : "text-amber-700"
                      }`}
                    >
                      {form.isPaid ? "Yes" : "No"}
                    </Text>
                  </View>
                </Pressable>
              )}

              {readOnly && (
                <View className="mb-4 rounded-xl border border-slate-200 px-4 py-3">
                  <Text className="text-xs text-slate-500">Paid</Text>
                  <Text className="text-sm font-semibold text-textPrimary mt-0.5">
                    {form.isPaid ? "Yes" : "No"}
                  </Text>
                </View>
              )}

              {/* Non-refundable fee */}
              {(isBooking || (!isBooking && (form.isPaid || readOnly || mode === "pay"))) &&
                !isDepositMode && (
                  <View className="mb-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 gap-3 border-l-4 border-l-amber-500">
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
                          editable={!readOnly && form.isPaid}
                        />
                        <AppInput
                          label="Receipt number"
                          value={form.receiptNumber}
                          onChangeText={(v) => setField("receiptNumber", v)}
                          editable={!readOnly && form.isPaid}
                        />
                        {readOnly || !form.isPaid ? (
                          <InfoLine
                            label="Payment type"
                            value={form.paidType === "NONE" ? "—" : form.paidType}
                          />
                        ) : (
                          <SelectField
                            label="Payment type"
                            value={form.paidType}
                            onChange={(v) => setField("paidType", v as PaidType)}
                            options={PAID_TYPE_OPTIONS}
                            placeholder="Select payment type"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <AppInput
                          label="Amount"
                          value={form.paidAmount}
                          onChangeText={(v) => setField("paidAmount", v)}
                          keyboardType="decimal-pad"
                          editable={!readOnly && form.isPaid}
                        />
                        <AppInput
                          label="Receipt"
                          value={form.receipt || form.receiptNumber}
                          onChangeText={(v) => {
                            setField("receipt", v);
                            setField("receiptNumber", v);
                          }}
                          editable={!readOnly && form.isPaid}
                        />
                        {readOnly || !form.isPaid ? (
                          <InfoLine
                            label="Payment type"
                            value={form.paidType === "NONE" ? "—" : form.paidType}
                          />
                        ) : (
                          <SelectField
                            label="Payment type"
                            value={form.paidType}
                            onChange={(v) => setField("paidType", v as PaidType)}
                            options={PAID_TYPE_OPTIONS.filter(
                              (o) => o.value !== "NONE",
                            )}
                            placeholder="Select payment type"
                          />
                        )}
                        <TextAreaField
                          label="Payment notes"
                          value={form.paidNotes}
                          onChangeText={(v) => setField("paidNotes", v)}
                          editable={!readOnly && form.isPaid}
                        />
                      </>
                    )}
                  </View>
                )}

              {/* Refundable deposit */}
              {isBooking && (isDepositMode || mode === "pay" || readOnly) && (
                <View className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 gap-3 border-l-4 border-l-emerald-500">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    Refundable — deposit
                  </Text>

                  {isDepositMode && !readOnly ? (
                    <SelectField
                      label="Deposit status"
                      value={form.depositAmountStatus}
                      onChange={(v) =>
                        setField("depositAmountStatus", v as DepositAmountStatus)
                      }
                      options={DEPOSIT_STATUS_OPTIONS}
                      placeholder="Select status"
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
                  />
                  <AppInput
                    label="Deposit amount"
                    value={form.damageDeposit}
                    onChangeText={(v) => setField("damageDeposit", v)}
                    keyboardType="decimal-pad"
                    editable={
                      !readOnly && (isDepositMode || (mode === "pay" && form.isPaid))
                    }
                  />
                  <AppInput
                    label="Deposit receipt number"
                    value={form.depositReceiptNumber}
                    onChangeText={(v) => setField("depositReceiptNumber", v)}
                    editable={
                      !readOnly && (isDepositMode || (mode === "pay" && form.isPaid))
                    }
                  />
                  {readOnly ||
                  !(isDepositMode || (mode === "pay" && form.isPaid)) ? (
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
                    />
                  )}
                </View>
              )}

              {isBooking && (isDepositMode || (mode === "pay" && form.isPaid) || readOnly) && (
                <View className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 gap-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Inspections & notes
                  </Text>
                  <TextAreaField
                    label="Pre-inspection"
                    value={form.preInspection}
                    onChangeText={(v) => setField("preInspection", v)}
                    editable={!readOnly}
                  />
                  <TextAreaField
                    label="Post-inspection"
                    value={form.postInspection}
                    onChangeText={(v) => setField("postInspection", v)}
                    editable={!readOnly}
                  />
                  <TextAreaField
                    label="Revenue notes"
                    value={form.description}
                    onChangeText={(v) => setField("description", v)}
                    editable={!readOnly}
                  />
                </View>
              )}

              <View className="flex-row gap-3 mt-2">
                <View className="flex-1">
                  <AppButton variant="outline" onPress={onClose} disabled={pending}>
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
          </Pressable>
        </Pressable>
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
