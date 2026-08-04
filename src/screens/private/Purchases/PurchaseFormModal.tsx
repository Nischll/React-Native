import {
  PurchaseType,
  useAddEnterphonePurchase,
  useAddFilterPurchase,
  useAddRentalPurchase,
  useAddVisitorPassPurchase,
  useUpdateEnterphonePurchase,
  useUpdateFilterPurchase,
  useUpdateRentalPurchase,
  useUpdateVisitorPassPurchase,
} from "@/src/api/purchases.api";
import {
  useAddAccessDevice,
  useUpdateAccessDevice,
} from "@/src/api/accessDevice.api";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import DatePickerField from "@/src/components/ui/DatePickerField";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import SelectField from "@/src/components/ui/SelectField";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import { formatDateOnly } from "@/src/helper/formatDateTime";
import { validatePurchaseRevenueWhenPaid } from "@/src/helper/revenueAmountUtils";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { PAID_TYPE_OPTIONS, PaidType } from "@/src/types/booking.types";
import {
  ENTERPHONE_STATUS_OPTIONS,
  EnterphoneStatus,
  FOB_STATUS_OPTIONS,
  FobAssignedTo,
  FobStatus,
  FobType,
  PaymentOption,
  PurchaseFor,
  RentalStatus,
  VisitorPassStatus,
} from "@/src/types/resident.types";
import {
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

type Props = {
  visible: boolean;
  mode: "create" | "edit";
  purchaseType: PurchaseType;
  item?: RevenueDetailItem | null;
  onClose: () => void;
  onSaved: () => void;
};

const DEVICE_TYPE_OPTIONS = [
  { label: "Remote", value: "REMOTE" },
  { label: "Key tag", value: "KEY_TAG" },
];

const ASSIGNED_TO_OPTIONS = [
  { label: "Owner", value: "OWNER" },
  { label: "Tenant", value: "TENANT" },
  { label: "Property agent", value: "PROPERTY_AGENT" },
];

const VISITOR_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Lost", value: "LOST" },
];

const PURCHASE_FOR_OPTIONS = [
  { label: "Garden plot", value: "GARDEN_PLOT" },
  { label: "EV parking", value: "EV_PARKING" },
  { label: "Strata parking", value: "STRATA_PARKING" },
  { label: "Strata storage", value: "STRATA_STORAGE" },
];

const PAYMENT_OPTION_OPTIONS = [
  { label: "Monthly", value: "MONTHLY" },
  { label: "Yearly", value: "YEARLY" },
];

const RENTAL_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

function computeRentalEnd(start: string, option: PaymentOption): string {
  if (!start) return "";
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return "";
  if (option === "YEARLY") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() - 1);
  return formatDateOnly(d);
}

export default function PurchaseFormModal({
  visible,
  mode,
  purchaseType,
  item,
  onClose,
  onSaved,
}: Props) {
  const { residences } = useResidencesForActiveBuilding();
  const isEdit = mode === "edit";

  const [residentId, setResidentId] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidType, setPaidType] = useState<PaidType>("NONE");
  const [receipt, setReceipt] = useState("");
  const [paidNotes, setPaidNotes] = useState("");

  // FILTER
  const [typeOfFilter, setTypeOfFilter] = useState("");
  const [size, setSize] = useState("");
  const [noOfFilter, setNoOfFilter] = useState("1");

  // ENTERPHONE
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [programmedPhoneNumber, setProgrammedPhoneNumber] = useState("");
  const [enterphoneStatus, setEnterphoneStatus] =
    useState<EnterphoneStatus>("ACTIVE");

  // ACCESS DEVICE
  const [cardNumber, setCardNumber] = useState("");
  const [deviceType, setDeviceType] = useState<FobType>("REMOTE");
  const [accessLevel, setAccessLevel] = useState("");
  const [assignedTo, setAssignedTo] = useState<FobAssignedTo>("OWNER");
  const [deviceStatus, setDeviceStatus] = useState<FobStatus>("ACTIVE");
  const [ownerApproval, setOwnerApproval] = useState<PickedFile | null>(null);

  // VISITOR PASS
  const [visitorPassNumber, setVisitorPassNumber] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [passStatus, setPassStatus] = useState<VisitorPassStatus>("ACTIVE");

  // RENTAL
  const [purchaseFor, setPurchaseFor] = useState<PurchaseFor>("GARDEN_PLOT");
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("MONTHLY");
  const [parkingStall, setParkingStall] = useState("");
  const [storageNumber, setStorageNumber] = useState("");
  const [gardenNo, setGardenNo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [rentalStatus, setRentalStatus] = useState<RentalStatus>("ACTIVE");

  const endDate = useMemo(
    () => computeRentalEnd(startDate, paymentOption),
    [startDate, paymentOption],
  );

  const { mutate: addFilter, isPending: addFilterPending } =
    useAddFilterPurchase();
  const { mutate: updateFilter, isPending: updateFilterPending } =
    useUpdateFilterPurchase();
  const { mutate: addEnterphone, isPending: addEnterphonePending } =
    useAddEnterphonePurchase();
  const { mutate: updateEnterphone, isPending: updateEnterphonePending } =
    useUpdateEnterphonePurchase();
  const residentIdNum = residentId ? Number(residentId) : undefined;
  const sourceIdNum = item?.sourceId;
  const { mutate: addDevice, isPending: addDevicePending } =
    useAddAccessDevice(residentIdNum);
  const { mutate: updateDevice, isPending: updateDevicePending } =
    useUpdateAccessDevice(residentIdNum, sourceIdNum);
  const { mutate: addPass, isPending: addPassPending } =
    useAddVisitorPassPurchase();
  const { mutate: updatePass, isPending: updatePassPending } =
    useUpdateVisitorPassPurchase();
  const { mutate: addRental, isPending: addRentalPending } =
    useAddRentalPurchase();
  const { mutate: updateRental, isPending: updateRentalPending } =
    useUpdateRentalPurchase();

  const pending =
    addFilterPending ||
    updateFilterPending ||
    addEnterphonePending ||
    updateEnterphonePending ||
    addDevicePending ||
    updateDevicePending ||
    addPassPending ||
    updatePassPending ||
    addRentalPending ||
    updateRentalPending;

  useEffect(() => {
    if (!visible) return;

    if (isEdit && item) {
      const detail = getRevenueSubDetail(item) ?? {};
      const nested =
        item.type === "FILTER"
          ? item.filterDetail
          : item.type === "ENTERPHONE"
            ? item.enterphoneDetail
            : item.type === "ACCESS_DEVICE"
              ? item.accessDeviceDetail
              : item.type === "VISITOR_PASS"
                ? item.visitorPassDetail
                : item.rentalDetail;

      setResidentId(String(item.residentId ?? ""));
      const amount = String(detail.paidAmount ?? nested?.paidAmount ?? "");
      const type = (detail.paidType || nested?.paidType || "NONE") as PaidType;
      const receiptVal = String(detail.receipt ?? nested?.receipt ?? "");
      setIsPaid(
        !!(
          detail.isPaid ??
          nested?.isPaid ??
          !!(amount || receiptVal || (type && type !== "NONE"))
        ),
      );
      setPaidAmount(amount);
      setPaidType(type);
      setReceipt(receiptVal);
      setPaidNotes(String(detail.paidNotes ?? nested?.paidNotes ?? ""));

      if (purchaseType === "FILTER") {
        setTypeOfFilter(String(nested?.typeOfFilter ?? ""));
        setSize(String(nested?.size ?? ""));
        setNoOfFilter(String(nested?.noOfFilter ?? "1"));
      }
      if (purchaseType === "ENTERPHONE") {
        setCode(String(nested?.code ?? ""));
        setDisplayName(String(nested?.displayName ?? ""));
        setProgrammedPhoneNumber(String(nested?.programmedPhoneNumber ?? ""));
        setEnterphoneStatus((nested?.status as EnterphoneStatus) || "ACTIVE");
      }
      if (purchaseType === "ACCESS_DEVICE") {
        setCardNumber(String(nested?.cardNumber ?? ""));
        setDeviceType((nested?.type as FobType) || "REMOTE");
        setAccessLevel(String(nested?.accessLevel ?? ""));
        setAssignedTo((nested?.assignedTo as FobAssignedTo) || "OWNER");
        setDeviceStatus((nested?.status as FobStatus) || "ACTIVE");
        setOwnerApproval(null);
      }
      if (purchaseType === "VISITOR_PASS") {
        setVisitorPassNumber(String(nested?.visitorPassNumber ?? ""));
        setDateOfIssue(
          nested?.dateOfIssue
            ? String(nested.dateOfIssue).slice(0, 10)
            : "",
        );
        setPassStatus((nested?.status as VisitorPassStatus) || "ACTIVE");
      }
      if (purchaseType === "RENTAL") {
        setPurchaseFor((nested?.purchaseFor as PurchaseFor) || "GARDEN_PLOT");
        setPaymentOption((nested?.paymentOption as PaymentOption) || "MONTHLY");
        setParkingStall(String(nested?.parkingStall ?? ""));
        setStorageNumber(String(nested?.storageNumber ?? ""));
        setGardenNo(String(nested?.gardenNo ?? ""));
        setStartDate(
          nested?.startDate ? String(nested.startDate).slice(0, 10) : "",
        );
        setRentalStatus((nested?.status as RentalStatus) || "ACTIVE");
      }
      return;
    }

    // create defaults
    setResidentId("");
    setIsPaid(false);
    setPaidAmount("");
    setPaidType("NONE");
    setReceipt("");
    setPaidNotes("");
    setTypeOfFilter("");
    setSize("");
    setNoOfFilter("1");
    setCode("");
    setDisplayName("");
    setProgrammedPhoneNumber("");
    setEnterphoneStatus("ACTIVE");
    setCardNumber("");
    setDeviceType("REMOTE");
    setAccessLevel("");
    setAssignedTo("OWNER");
    setDeviceStatus("ACTIVE");
    setOwnerApproval(null);
    setVisitorPassNumber("");
    setDateOfIssue(formatDateOnly(new Date()));
    setPassStatus("ACTIVE");
    setPurchaseFor("GARDEN_PLOT");
    setPaymentOption("MONTHLY");
    setParkingStall("");
    setStorageNumber("");
    setGardenNo("");
    setStartDate(formatDateOnly(new Date()));
    setRentalStatus("ACTIVE");
  }, [visible, isEdit, item, purchaseType]);

  const supportsPayment = purchaseType !== "ENTERPHONE";

  const validatePayment = () => {
    if (!supportsPayment) return true;
    if (!isPaid) return true;
    const validation = validatePurchaseRevenueWhenPaid({
      paidAmount,
      paidType,
    });
    if (!validation.ok) {
      showToast("error", validation.message);
      return false;
    }
    return true;
  };

  const paymentFields = () =>
    isPaid
      ? {
          isPaid: true,
          isFree: false,
          paidAmount,
          paidType,
          receipt,
          paidNotes,
        }
      : {
          isPaid: false,
          isFree: false,
          paidAmount: null,
          paidType: "NONE" as const,
          receipt: null,
          paidNotes: null,
        };

  const finish = {
    onSuccess: () => {
      onSaved();
      onClose();
    },
  };

  const handleSave = () => {
    if (!residentId) {
      showToast("error", "Please select a unit / resident.");
      return;
    }
    if (!validatePayment()) return;

    const rid = Number(residentId);
    const sourceId = item?.sourceId;

    if (purchaseType === "FILTER") {
      if (!typeOfFilter.trim() || !size.trim()) {
        showToast("error", "Filter type and size are required.");
        return;
      }
      const payload = {
        typeOfFilter: typeOfFilter.trim(),
        size: size.trim(),
        noOfFilter: Number(noOfFilter) || 1,
        ...paymentFields(),
        pathVars: isEdit
          ? { id: sourceId, residentId: rid }
          : { residentId: rid },
      };
      if (isEdit) updateFilter(payload as any, finish);
      else addFilter(payload as any, finish);
      return;
    }

    if (purchaseType === "ENTERPHONE") {
      if (!code.trim() || !displayName.trim()) {
        showToast("error", "Code and display name are required.");
        return;
      }
      const payload = {
        code: code.trim(),
        displayName: displayName.trim(),
        programmedPhoneNumber: programmedPhoneNumber.trim(),
        status: enterphoneStatus,
        pathVars: isEdit
          ? { id: sourceId, residentId: rid }
          : { residentId: rid },
      };
      if (isEdit) updateEnterphone(payload as any, finish);
      else addEnterphone(payload as any, finish);
      return;
    }

    if (purchaseType === "ACCESS_DEVICE") {
      if (!cardNumber.trim()) {
        showToast("error", "Card number is required.");
        return;
      }
      if (assignedTo === "TENANT" && !isEdit && !ownerApproval) {
        showToast(
          "error",
          "Owner approval document is required when assigned to a tenant.",
        );
        return;
      }

      const base = {
        type: deviceType,
        cardNumber: cardNumber.trim(),
        accessLevel: accessLevel.trim(),
        assignedTo,
        status: deviceStatus,
        ...paymentFields(),
      };

      if (ownerApproval?.isLocal) {
        const fd = new FormData();
        Object.entries(base).forEach(([k, v]) => {
          if (v != null) fd.append(k, String(v));
        });
        fd.append("ownerApproval", {
          uri: ownerApproval.uri,
          name: ownerApproval.name,
          type: ownerApproval.mimeType,
        } as any);
        if (isEdit) updateDevice(fd as any, finish);
        else addDevice(fd as any, finish);
      } else {
        if (isEdit) updateDevice(base as any, finish);
        else addDevice(base as any, finish);
      }
      return;
    }

    if (purchaseType === "VISITOR_PASS") {
      if (!visitorPassNumber.trim() || !dateOfIssue) {
        showToast("error", "Pass number and date of issue are required.");
        return;
      }
      const payload = {
        visitorPassNumber: visitorPassNumber.trim(),
        dateOfIssue,
        status: passStatus,
        ...paymentFields(),
        pathVars: isEdit
          ? { id: sourceId, residentId: rid }
          : { residentId: rid },
      };
      if (isEdit) updatePass(payload as any, finish);
      else addPass(payload as any, finish);
      return;
    }

    if (purchaseType === "RENTAL") {
      if (!startDate || !endDate) {
        showToast("error", "Start date is required.");
        return;
      }
      const payload = {
        purchaseFor,
        paymentOption,
        parkingStall: parkingStall.trim() || undefined,
        storageNumber: storageNumber.trim() || undefined,
        gardenNo: gardenNo.trim() || undefined,
        startDate,
        endDate,
        status: rentalStatus,
        ...paymentFields(),
        paidType: isPaid ? paidType : "NONE",
        pathVars: isEdit
          ? { id: sourceId, residentId: rid }
          : { residentId: rid },
      };
      if (isEdit) updateRental(payload as any, finish);
      else addRental(payload as any, finish);
    }
  };

  if (!visible) return null;

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
            className="max-h-[92%] rounded-t-3xl bg-white"
          >
            <View className="px-5 pt-4 pb-2 border-b border-slate-200">
              <Text className="text-lg font-bold text-textPrimary">
                {isEdit ? "Edit" : "Create"} {typeLabel(purchaseType)}
              </Text>
              <Text className="text-sm text-textSecondary mt-1">
                {isEdit
                  ? "Update purchase details and payment"
                  : "Assign a unit, then fill the purchase details"}
              </Text>
            </View>

            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <SelectField
                label="Unit *"
                value={residentId}
                onChange={setResidentId}
                options={residences}
                placeholder="Select unit"
                mode="inline"
              />

              {purchaseType === "FILTER" && (
                <View className="mt-3 gap-3">
                  <AppInput
                    label="Filter type *"
                    value={typeOfFilter}
                    onChangeText={setTypeOfFilter}
                    placeholder="e.g. HEPA"
                  />
                  <AppInput
                    label="Size *"
                    value={size}
                    onChangeText={setSize}
                    placeholder="e.g. 16x20"
                  />
                  <AppInput
                    label="Number of filters"
                    value={noOfFilter}
                    onChangeText={setNoOfFilter}
                    keyboardType="number-pad"
                  />
                </View>
              )}

              {purchaseType === "ENTERPHONE" && (
                <View className="mt-3 gap-3">
                  <AppInput
                    label="Code *"
                    value={code}
                    onChangeText={setCode}
                    placeholder="Enterphone code"
                  />
                  <AppInput
                    label="Display name *"
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Display name"
                  />
                  <AppInput
                    label="Programmed phone"
                    value={programmedPhoneNumber}
                    onChangeText={setProgrammedPhoneNumber}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                  />
                  <SelectField
                    label="Status"
                    value={enterphoneStatus}
                    onChange={(v) => setEnterphoneStatus(v as EnterphoneStatus)}
                    options={ENTERPHONE_STATUS_OPTIONS}
                    mode="inline"
                  />
                </View>
              )}

              {purchaseType === "ACCESS_DEVICE" && (
                <View className="mt-3 gap-3">
                  <AppInput
                    label="Card number *"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="Card / fob number"
                  />
                  <SelectField
                    label="Device type"
                    value={deviceType}
                    onChange={(v) => setDeviceType(v as FobType)}
                    options={DEVICE_TYPE_OPTIONS}
                    mode="inline"
                  />
                  <AppInput
                    label="Access level"
                    value={accessLevel}
                    onChangeText={setAccessLevel}
                    placeholder="Access level"
                  />
                  <SelectField
                    label="Assigned to"
                    value={assignedTo}
                    onChange={(v) => setAssignedTo(v as FobAssignedTo)}
                    options={ASSIGNED_TO_OPTIONS}
                    mode="inline"
                  />
                  <SelectField
                    label="Status"
                    value={deviceStatus}
                    onChange={(v) => setDeviceStatus(v as FobStatus)}
                    options={FOB_STATUS_OPTIONS}
                    mode="inline"
                  />
                  {assignedTo === "TENANT" && (
                    <FilePicker
                      label="Owner approval"
                      hint="Required for tenant assignment"
                      value={ownerApproval}
                      onChange={setOwnerApproval}
                      accept="all"
                      compact
                    />
                  )}
                </View>
              )}

              {purchaseType === "VISITOR_PASS" && (
                <View className="mt-3 gap-3">
                  <AppInput
                    label="Pass number *"
                    value={visitorPassNumber}
                    onChangeText={setVisitorPassNumber}
                    placeholder="Visitor pass #"
                  />
                  <View>
                    <Text className="mb-2 text-base font-semibold text-slate-700">
                      Date of issue *
                    </Text>
                    <DatePickerField
                      value={dateOfIssue}
                      onChange={setDateOfIssue}
                    />
                  </View>
                  <SelectField
                    label="Status"
                    value={passStatus}
                    onChange={(v) => setPassStatus(v as VisitorPassStatus)}
                    options={VISITOR_STATUS_OPTIONS}
                    mode="inline"
                  />
                </View>
              )}

              {purchaseType === "RENTAL" && (
                <View className="mt-3 gap-3">
                  <SelectField
                    label="Purchase for"
                    value={purchaseFor}
                    onChange={(v) => setPurchaseFor(v as PurchaseFor)}
                    options={PURCHASE_FOR_OPTIONS}
                    mode="inline"
                  />
                  <SelectField
                    label="Payment option"
                    value={paymentOption}
                    onChange={(v) => setPaymentOption(v as PaymentOption)}
                    options={PAYMENT_OPTION_OPTIONS}
                    mode="inline"
                  />
                  <AppInput
                    label="Parking stall"
                    value={parkingStall}
                    onChangeText={setParkingStall}
                  />
                  <AppInput
                    label="Storage number"
                    value={storageNumber}
                    onChangeText={setStorageNumber}
                  />
                  <AppInput
                    label="Garden number"
                    value={gardenNo}
                    onChangeText={setGardenNo}
                  />
                  <View>
                    <Text className="mb-2 text-base font-semibold text-slate-700">
                      Start date *
                    </Text>
                    <DatePickerField value={startDate} onChange={setStartDate} />
                  </View>
                  <AppInput
                    label="End date"
                    value={endDate}
                    editable={false}
                  />
                  <SelectField
                    label="Status"
                    value={rentalStatus}
                    onChange={(v) => setRentalStatus(v as RentalStatus)}
                    options={RENTAL_STATUS_OPTIONS}
                    mode="inline"
                  />
                </View>
              )}

              {supportsPayment && (
                <View className="mt-4 gap-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Fees & payment
                  </Text>
                  <View className="rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 gap-2">
                    <Pressable
                      onPress={() => {
                        setIsPaid((p) => {
                          if (p) {
                            setPaidAmount("");
                            setPaidType("NONE");
                            setReceipt("");
                            setPaidNotes("");
                            return false;
                          }
                          return true;
                        });
                      }}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-sm font-semibold text-textPrimary">
                          Marked to pay
                        </Text>
                        <Text className="text-xs text-textSecondary mt-0.5">
                          Required to update payment details. Check this to edit
                          and save.
                        </Text>
                      </View>
                      <View
                        className={`h-6 w-6 rounded-md border-2 items-center justify-center ${
                          isPaid
                            ? "bg-primary border-primary"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {isPaid ? (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        ) : null}
                      </View>
                    </Pressable>
                    {!isPaid && (
                      <Text className="text-xs font-medium text-amber-600">
                        Check Marked to pay to enable the fields below and save
                        revenue details.
                      </Text>
                    )}
                  </View>

                  <View
                    className={`rounded-xl border border-amber-200 bg-amber-50/60 p-3 gap-3 border-l-4 border-l-amber-500 ${
                      !isPaid ? "opacity-60" : ""
                    }`}
                    pointerEvents={isPaid ? "auto" : "none"}
                  >
                    <Text className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                      Payment
                    </Text>
                    <AppInput
                      label="Amount *"
                      value={paidAmount}
                      onChangeText={setPaidAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                    <SelectField
                      label="Payment type *"
                      value={paidType}
                      onChange={(v) => setPaidType(v as PaidType)}
                      options={PAID_TYPE_OPTIONS}
                      placeholder="Select type"
                      mode="inline"
                    />
                    <AppInput
                      label="Receipt"
                      value={receipt}
                      onChangeText={setReceipt}
                      placeholder="Receipt #"
                    />
                    <TextAreaField
                      label="Payment notes"
                      value={paidNotes}
                      onChangeText={setPaidNotes}
                      placeholder="Optional notes"
                    />
                  </View>
                </View>
              )}

              <View className="flex-row gap-3 mt-5">
                <View className="flex-1">
                  <AppButton
                    variant="outline"
                    onPress={onClose}
                    disabled={pending}
                  >
                    Cancel
                  </AppButton>
                </View>
                <View className="flex-1">
                  <AppButton onPress={handleSave} loading={pending}>
                    {isEdit ? "Update" : "Create"}
                  </AppButton>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
